from fastapi import APIRouter
from services.budget_splitter import split_budget
from db.db import save_data, load_data

router = APIRouter()

@router.post("/create-budget")
def create_budget(payload: dict):
    total = payload["total_budget"]
    categories = split_budget(total)

    data = {
        "total_budget": total,
        "categories": categories,
        "expenses": [],
        "remaining": total
    }

    save_data(data)
    return {"status": "ok", "categories": categories}