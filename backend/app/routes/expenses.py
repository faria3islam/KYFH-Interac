from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.db.db import load_data, save_data
from app.services.receipt_processor import ReceiptProcessor
from app.services.wallet_service import WalletService

router = APIRouter()

class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be greater than 0")
    category: str = Field(..., min_length=1, description="Category is required")
    vendor_name: str = Field(default="", description="Vendor/supplier name")

class ReceiptUpload(BaseModel):
    receipt_text: str = Field(..., min_length=1, description="Text extracted from receipt/bill")
    filename: str = Field(..., min_length=1, description="Original filename")
    category: Optional[str] = Field(None, description="Optional: User-specified category")

class ExpenseDelete(BaseModel):
    expense_index: int = Field(..., ge=0, description="Expense index must be 0 or greater")

class FundReallocation(BaseModel):
    from_category: str = Field(..., min_length=1)
    to_category: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)

@router.post("/add-expense")
def add_expense(payload: ExpenseCreate):
    try:
        data = load_data()
        
        if not data:
            raise HTTPException(status_code=400, detail="No budget created yet")
        
        amount = payload.amount
        category = payload.category
        
        if category not in data.get("categories", {}):
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
        
        if amount > data["remaining"]:
            raise HTTPException(status_code=400, detail="Expense exceeds remaining budget")
        
        expense_entry = {
            "amount": amount,
            "category": category,
            "vendor_name": payload.vendor_name or "Unknown Vendor",
            "status": "pending",
            "timestamp": datetime.now().isoformat()
        }

        data["expenses"].append(expense_entry)
        data["categories"][category] -= amount
        data["remaining"] -= amount

        save_data(data)
        return {"status": "added", "remaining": data["remaining"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-receipt")
def upload_receipt(payload: ReceiptUpload):
    """
    AI-powered receipt processing: Verify authenticity, extract amount, auto-log expense
    """
    try:
        data = load_data()
        
        if not data:
            raise HTTPException(status_code=400, detail="No budget created yet")
        
        # Process receipt with AI
        result = ReceiptProcessor.process_receipt(
            text=payload.receipt_text,
            filename=payload.filename,
            user_category=payload.category
        )
        
        verification = result["verification"]
        amount = result["amount"]
        category = result["category"]
        
        # Validation
        if amount == 0:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract valid amount from receipt. Please enter manually."
            )
        
        if category not in data.get("categories", {}):
            # Default to misc if AI category not in budget
            category = "misc"
            if category not in data.get("categories", {}):
                category = list(data["categories"].keys())[0]  # Fallback to first category
        
        if amount > data["remaining"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Expense amount ${amount:.2f} exceeds remaining budget ${data['remaining']:.2f}"
            )
        
        # Auto-log expense with verification data
        expense_entry = {
            "amount": amount,
            "category": category,
            "receipt_verified": True,
            "verification_status": verification["status"],
            "verification_confidence": verification["confidence"],
            "verification_flags": verification.get("flags", []),
            "ai_suggested_category": result["ai_suggested_category"],
            "filename": result["filename"],
            "processed_at": result["processed_at"]
        }
        
        data["expenses"].append(expense_entry)
        data["categories"][category] -= amount
        data["remaining"] -= amount

        save_data(data)
        
        return {
            "status": "success",
            "message": "Receipt processed and expense auto-logged",
            "expense": expense_entry,
            "verification": verification,
            "remaining": data["remaining"],
            "warning": "Review flagged issues" if verification["status"] != "verified" else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/delete-expense")
def delete_expense(payload: ExpenseDelete):
    try:
        data = load_data()
        
        if not data or not data.get("expenses"):
            raise HTTPException(status_code=400, detail="No expenses to delete")
        
        index = payload.expense_index
        
        if index >= len(data["expenses"]):
            raise HTTPException(status_code=400, detail="Invalid expense index")
        
        # Get the expense to delete
        expense = data["expenses"][index]
        amount = expense["amount"]
        category = expense["category"]
        
        # Restore the amount to category and remaining
        data["categories"][category] += amount
        data["remaining"] += amount
        
        # Remove the expense
        data["expenses"].pop(index)
        
        save_data(data)
        return {"status": "deleted", "remaining": data["remaining"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reallocate-funds")
def reallocate_funds(payload: FundReallocation):
    try:
        data = load_data()
        
        if not data:
            raise HTTPException(status_code=400, detail="No budget created yet")
        
        from_cat = payload.from_category
        to_cat = payload.to_category
        amount = payload.amount
        
        if from_cat not in data.get("categories", {}):
            raise HTTPException(status_code=400, detail=f"Invalid source category: {from_cat}")
        
        if to_cat not in data.get("categories", {}):
            raise HTTPException(status_code=400, detail=f"Invalid destination category: {to_cat}")
        
        if data["categories"][from_cat] < amount:
            raise HTTPException(status_code=400, detail=f"Insufficient funds in {from_cat}")
        
        # Move funds
        data["categories"][from_cat] -= amount
        data["categories"][to_cat] += amount
        
        save_data(data)
        return {
            "status": "reallocated",
            "message": f"Moved ${amount:.2f} from {from_cat} to {to_cat}",
            "categories": data["categories"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-pay-vendors")
def bulk_pay_vendors():
    """
    Bulk vendor payment for clubs - AI checks budget, confirms amounts, sends payments
    """
    try:
        data = load_data()
        
        if not data:
            raise HTTPException(status_code=400, detail="No budget created yet")
        
        # Get pending expenses
        pending_expenses = [exp for exp in data.get("expenses", []) if exp.get("status") == "pending"]
        
        if not pending_expenses:
            return {
                "status": "no_payments",
                "message": "No pending vendor payments found",
                "payments": []
            }
        
        # Initialize wallet if doesn't exist
        if "wallet" not in data:
            data["wallet"] = {"balance": 0.0, "transactions": []}
        
        # AI checks budget and prepares payments
        total_amount = sum(exp["amount"] for exp in pending_expenses)
        wallet_balance = WalletService.get_balance(data["wallet"])
        
        if wallet_balance < total_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient wallet balance. Required: ${total_amount:.2f}, Available: ${wallet_balance:.2f}"
            )
        
        # Process each payment
        payments = []
        for expense in pending_expenses:
            vendor_name = expense.get("vendor_name", "Unknown Vendor")
            amount = expense["amount"]
            category = expense["category"]
            
            # Deduct from wallet
            wallet_transaction = WalletService.deduct_funds(
                data["wallet"],
                amount,
                f"Vendor Payment: {vendor_name} ({category})",
                "vendor_payment"
            )
            
            # Mark expense as paid
            expense["status"] = "paid"
            expense["payment_date"] = datetime.now().isoformat()
            expense["payment_method"] = "wallet_interac"
            expense["wallet_transaction_id"] = wallet_transaction["id"]
            
            payments.append({
                "vendor": vendor_name,
                "amount": amount,
                "category": category,
                "transaction_id": wallet_transaction["id"],
                "status": "completed"
            })
        
        save_data(data)
        
        return {
            "status": "success",
            "message": f"AI successfully processed {len(payments)} vendor payments totaling ${total_amount:.2f}",
            "payments": payments,
            "total_amount": total_amount,
            "remaining_wallet_balance": data["wallet"]["balance"],
            "ai_confirmation": f"✅ Budget verified. All {len(payments)} vendor payments approved and sent via Interac."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))