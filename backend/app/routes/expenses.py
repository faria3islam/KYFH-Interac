from fastapi import APIRouter
from db.db import load_data, save_data

router = APIRouter()

@router.post("/add-expense")
def add_expense(payload: dict):
    data = load_data()
    amount = payload["amount"]
    category = payload["category"]

    data["expenses"].append(payload)
    data["categories"][category] -= amount
    data["remaining"] -= amount

    save_data(data)
    return {"status": "added"}