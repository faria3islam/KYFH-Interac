from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import budget, expenses, payment

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "KYFH-Interac API", "status": "running"}

app.include_router(budget.router)
app.include_router(expenses.router)
app.include_router(payment.router)