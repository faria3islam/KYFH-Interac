from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services.wallet_service import WalletService
from app.db.db import save_data, load_data

router = APIRouter()

class AddFundsRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount to add to wallet")
    payment_method: str = Field(default="interac_debit", description="Payment method (interac_debit, interac_online, interac_transfer)")

@router.get("/wallet/balance")
def get_wallet_balance():
    """Get current wallet balance"""
    try:
        data = load_data()
        if not data:
            return {"balance": 0.0, "message": "No wallet found. Create a budget first."}
        
        wallet = data.get("wallet", {"balance": 0.0, "transactions": []})
        balance = WalletService.get_balance(wallet)
        
        return {
            "balance": balance,
            "formatted": f"${balance:.2f}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/wallet/add-funds")
def add_funds(request: AddFundsRequest):
    """Add funds to wallet"""
    try:
        data = load_data()
        if not data:
            # Initialize data if doesn't exist
            data = {
                "total_budget": 0,
                "categories": {},
                "expenses": [],
                "remaining": 0,
                "wallet": {"balance": 0.0, "transactions": []}
            }
        
        # Initialize wallet if doesn't exist
        if "wallet" not in data:
            data["wallet"] = {"balance": 0.0, "transactions": []}
        
        # Add funds
        transaction = WalletService.add_funds(
            data["wallet"],
            request.amount,
            request.payment_method
        )
        
        # Save updated data
        save_data(data)
        
        return {
            "status": "success",
            "transaction": transaction,
            "new_balance": data["wallet"]["balance"],
            "message": f"Successfully added ${request.amount:.2f} to wallet"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/wallet/transactions")
def get_wallet_transactions(limit: Optional[int] = None):
    """Get wallet transaction history"""
    try:
        data = load_data()
        if not data or "wallet" not in data:
            return {"transactions": [], "message": "No transactions found"}
        
        transactions = WalletService.get_transactions(data["wallet"], limit)
        
        return {
            "transactions": transactions,
            "count": len(transactions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/wallet/stats")
def get_wallet_stats():
    """Get wallet statistics"""
    try:
        data = load_data()
        if not data or "wallet" not in data:
            return {
                "current_balance": 0.0,
                "total_added": 0.0,
                "total_spent": 0.0,
                "transaction_count": 0
            }
        
        stats = WalletService.get_wallet_stats(data["wallet"])
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
