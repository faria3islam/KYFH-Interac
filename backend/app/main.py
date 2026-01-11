from fastapi import FastAPI
from routes import budget, expenses, payment

app = FastAPI()

app.include_router(budget.router)
app.include_router(expenses.router)
app.include_router(payment.router)