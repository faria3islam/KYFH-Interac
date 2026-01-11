from fastapi import APIRouter

router = APIRouter()

@router.post("/fake-payment")
def fake_payment():
    return {"status": "success", "message": "Interac payment simulated"}