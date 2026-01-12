from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.db.db import load_data, save_data

router = APIRouter()

class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be greater than 0")
    category: str = Field(..., min_length=1, description="Category is required")

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

        data["expenses"].append(payload.dict())
        data["categories"][category] -= amount
        data["remaining"] -= amount

        save_data(data)
        return {"status": "added", "remaining": data["remaining"]}
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