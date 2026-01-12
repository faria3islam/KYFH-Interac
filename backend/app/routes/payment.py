from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import List, Optional
import uuid
from app.db.db import load_data, save_data

router = APIRouter()

class InteracTransfer(BaseModel):
    recipient_email: EmailStr
    amount: float = Field(..., gt=0)
    message: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None

class MoneyRequest(BaseModel):
    requester_email: EmailStr
    amount: float = Field(..., gt=0)
    reason: Optional[str] = None

class SettleExpense(BaseModel):
    expense_id: str
    recipient_email: EmailStr

@router.post("/send-interac")
def send_interac(transfer: InteracTransfer):
    """Mock Interac e-Transfer send"""
    try:
        data = load_data()
        
        if not data or data.get("remaining", 0) < transfer.amount:
            raise HTTPException(status_code=400, detail="Insufficient budget to send transfer")
        
        # Create mock transaction
        transaction = {
            "id": str(uuid.uuid4())[:8],
            "type": "send",
            "recipient": transfer.recipient_email,
            "amount": transfer.amount,
            "message": transfer.message or "Budget expense transfer",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "has_security": bool(transfer.security_question)
        }
        
        # Initialize transactions list if needed
        if "transactions" not in data:
            data["transactions"] = []
        
        data["transactions"].append(transaction)
        
        # Deduct from budget
        data["remaining"] -= transfer.amount
        
        save_data(data)
        
        return {
            "status": "success",
            "message": f"Interac e-Transfer of ${transfer.amount:.2f} sent to {transfer.recipient_email}",
            "transaction": transaction
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/request-money")
def request_money(request: MoneyRequest):
    """Mock Interac money request"""
    try:
        data = load_data()
        
        # Create mock request
        money_request = {
            "id": str(uuid.uuid4())[:8],
            "type": "request",
            "requester": request.requester_email,
            "amount": request.amount,
            "reason": request.reason or "Budget contribution request",
            "status": "pending",
            "timestamp": datetime.now().isoformat()
        }
        
        # Initialize requests list if needed
        if "money_requests" not in data:
            data["money_requests"] = []
        
        data["money_requests"].append(money_request)
        
        save_data(data)
        
        return {
            "status": "success",
            "message": f"Money request of ${request.amount:.2f} sent to {request.requester_email}",
            "request": money_request
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settle-expense")
def settle_expense(settle: SettleExpense):
    """Settle a specific expense via Interac"""
    try:
        data = load_data()
        
        if not data or not data.get("expenses"):
            raise HTTPException(status_code=400, detail="No expenses to settle")
        
        # Find expense (using index as ID for simplicity)
        expense_index = int(settle.expense_id) if settle.expense_id.isdigit() else -1
        
        if expense_index < 0 or expense_index >= len(data["expenses"]):
            raise HTTPException(status_code=400, detail="Invalid expense ID")
        
        expense = data["expenses"][expense_index]
        
        # Create settlement transaction
        transaction = {
            "id": str(uuid.uuid4())[:8],
            "type": "settlement",
            "recipient": settle.recipient_email,
            "amount": expense["amount"],
            "message": f"Settlement for {expense['category']} expense",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "expense_category": expense["category"]
        }
        
        if "transactions" not in data:
            data["transactions"] = []
        
        data["transactions"].append(transaction)
        
        save_data(data)
        
        return {
            "status": "success",
            "message": f"Settlement of ${expense['amount']:.2f} sent to {settle.recipient_email}",
            "transaction": transaction
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions")
def get_transactions():
    """Get all Interac transactions"""
    data = load_data()
    return {
        "transactions": data.get("transactions", []),
        "money_requests": data.get("money_requests", [])
    }

@router.get("/settlement-suggestions")
def get_settlement_suggestions():
    """AI-powered settlement suggestions based on expenses"""
    data = load_data()
    
    if not data or not data.get("expenses"):
        return {"suggestions": []}
    
    # Mock AI suggestions based on category spending
    suggestions = []
    category_totals = {}
    
    for exp in data["expenses"]:
        cat = exp["category"]
        category_totals[cat] = category_totals.get(cat, 0) + exp["amount"]
    
    # Suggest splitting high-spending categories
    for cat, total in category_totals.items():
        if total > 100:  # Arbitrary threshold
            suggestions.append({
                "category": cat,
                "total": total,
                "suggested_split": round(total / 2, 2),
                "reason": f"Split {cat} expenses ({len([e for e in data['expenses'] if e['category'] == cat])} transactions)"
            })
    
    return {
        "suggestions": suggestions,
        "total_to_settle": sum(s["suggested_split"] for s in suggestions)
    }