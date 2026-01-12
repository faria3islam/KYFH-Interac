from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.budget_splitter import split_budget
from app.services.ai_logic import generate_feedback, get_ai_recommendations
from app.db.db import save_data, load_data

router = APIRouter()

class BudgetCreate(BaseModel):
    total_budget: float = Field(..., gt=0, description="Total budget must be greater than 0")

@router.post("/create-budget")
def create_budget(payload: BudgetCreate):
    try:
        total = payload.total_budget
        
        # Load previous data to learn from historical patterns
        old_data = load_data()
        historical_expenses = old_data.get("expenses", []) if old_data else []
        
        # AI learns from past spending and adapts allocation
        categories = split_budget(total, historical_expenses)

        data = {
            "total_budget": total,
            "categories": categories,
            "expenses": [],
            "remaining": total
        }

        save_data(data)
        
        learning_msg = ""
        if len(historical_expenses) > 0:
            learning_msg = f" (AI adapted based on {len(historical_expenses)} previous expenses)"
        
        return {
            "status": "ok", 
            "categories": categories,
            "message": f"Budget created with AI-optimized allocations{learning_msg}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
def get_dashboard():
    data = load_data()
    if not data:
        return {
            "total_budget": 0,
            "categories": {},
            "expenses": [],
            "remaining": 0,
            "feedback": "No budget created yet",
            "recommendations": []
        }
    
    # Generate intelligent AI feedback and autonomous recommendations
    feedback = generate_feedback(data)
    recommendations = get_ai_recommendations(data)
    
    return {
        **data, 
        "feedback": feedback,
        "recommendations": recommendations
    }