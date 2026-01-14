# Detailed Implementation Guide

## 🔧 Specific Code Changes Needed

### Engineer #1: Auth & Organization Service

#### Step 1: Database Setup
**File**: `backend/app/db/models.py` (NEW)
```python
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(enum.Enum):
    ADMIN = "admin"
    TREASURER = "treasurer"
    MEMBER = "member"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Membership(Base):
    __tablename__ = "memberships"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    org_id = Column(Integer, ForeignKey("organizations.id"))
    role = Column(Enum(UserRole), default=UserRole.MEMBER)
    created_at = Column(DateTime, default=datetime.utcnow)

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    total_amount = Column(Float, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class BudgetCategory(Base):
    __tablename__ = "budget_categories"
    id = Column(Integer, primary_key=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"))
    category_name = Column(String, nullable=False)
    allocated_amount = Column(Float, nullable=False)
    remaining_amount = Column(Float, nullable=False)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    budget_id = Column(Integer, ForeignKey("budgets.id"))
    category_id = Column(Integer, ForeignKey("budget_categories.id"))
    amount = Column(Float, nullable=False)
    vendor_name = Column(String)
    status = Column(String, default="pending")  # pending, paid, cancelled
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    extracted_text = Column(String)
    verification_status = Column(String)  # verified, warning, suspicious
    verification_confidence = Column(Integer)
    flags = Column(String)  # JSON array
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class PaymentRequest(Base):
    __tablename__ = "payment_requests"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected, executed
    requested_by_user_id = Column(Integer, ForeignKey("users.id"))
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    executed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), unique=True)
    balance = Column(Float, default=0.0)

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"))
    type = Column(String, nullable=False)  # add_funds, vendor_payment, etc.
    amount = Column(Float, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**File**: `backend/app/db/database.py` (NEW)
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base

# Use SQLite for simplicity (change to PostgreSQL if needed)
SQLALCHEMY_DATABASE_URL = "sqlite:///./app/db/paypilot.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### Step 2: Auth Routes
**File**: `backend/app/routes/auth.py` (NEW)
```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.db.database import get_db
from app.db.models import User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}
```

#### Step 3: Organization Routes
**File**: `backend/app/routes/organizations.py` (NEW)
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import User, Organization, Membership, UserRole
from app.routes.auth import get_current_user

router = APIRouter()

class OrgCreate(BaseModel):
    name: str

class OrgInvite(BaseModel):
    email: EmailStr
    role: str  # "admin", "treasurer", "member"

@router.post("/create")
def create_organization(org_data: OrgCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = Organization(name=org_data.name, created_by_user_id=current_user.id)
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # Add creator as admin
    membership = Membership(
        user_id=current_user.id,
        org_id=org.id,
        role=UserRole.ADMIN
    )
    db.add(membership)
    db.commit()
    
    return {"id": org.id, "name": org.name, "message": "Organization created"}

@router.post("/{org_id}/invite")
def invite_member(org_id: int, invite_data: OrgInvite, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if current user is admin/treasurer
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.org_id == org_id
    ).first()
    
    if not membership or membership.role not in [UserRole.ADMIN, UserRole.TREASURER]:
        raise HTTPException(status_code=403, detail="Only admins and treasurers can invite members")
    
    # Find user by email
    user = db.query(User).filter(User.email == invite_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create membership
    role = UserRole[invite_data.role.upper()]
    membership = Membership(user_id=user.id, org_id=org_id, role=role)
    db.add(membership)
    db.commit()
    
    return {"message": f"User {invite_data.email} added to organization"}

@router.get("/{org_id}/members")
def get_members(org_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(Membership).filter(Membership.org_id == org_id).all()
    return [{"user_id": m.user_id, "role": m.role.value} for m in memberships]
```

---

### Engineer #2: Approval Workflow

#### Step 1: Payment Request Model & Routes
**File**: `backend/app/routes/payment_requests.py` (NEW)
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.db.models import PaymentRequest, Expense, User, Membership, UserRole, Wallet, WalletTransaction
from app.routes.auth import get_current_user
from app.services.wallet_service import WalletService

router = APIRouter()

class PaymentRequestResponse(BaseModel):
    id: int
    expense_id: int
    amount: float
    status: str
    requested_by_user_id: int
    approved_by_user_id: Optional[int]
    created_at: datetime

@router.get("/", response_model=List[PaymentRequestResponse])
def list_payment_requests(
    org_id: int,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user is member of org
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.org_id == org_id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    
    query = db.query(PaymentRequest).filter(PaymentRequest.org_id == org_id)
    if status:
        query = query.filter(PaymentRequest.status == status)
    
    return query.all()

@router.post("/{request_id}/approve")
def approve_payment_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment_request = db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()
    if not payment_request:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    # Check if user is admin/treasurer
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.org_id == payment_request.org_id,
        Membership.role.in_([UserRole.ADMIN, UserRole.TREASURER])
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only admins and treasurers can approve payments")
    
    if payment_request.status != "pending":
        raise HTTPException(status_code=400, detail=f"Payment request is already {payment_request.status}")
    
    payment_request.status = "approved"
    payment_request.approved_by_user_id = current_user.id
    db.commit()
    
    return {"message": "Payment request approved", "request_id": request_id}

@router.post("/{request_id}/reject")
def reject_payment_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment_request = db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()
    if not payment_request:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    # Check if user is admin/treasurer
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.org_id == payment_request.org_id,
        Membership.role.in_([UserRole.ADMIN, UserRole.TREASURER])
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only admins and treasurers can reject payments")
    
    if payment_request.status != "pending":
        raise HTTPException(status_code=400, detail=f"Payment request is already {payment_request.status}")
    
    payment_request.status = "rejected"
    payment_request.approved_by_user_id = current_user.id
    db.commit()
    
    return {"message": "Payment request rejected", "request_id": request_id}

@router.post("/{request_id}/execute")
def execute_payment_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment_request = db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()
    if not payment_request:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    if payment_request.status != "approved":
        raise HTTPException(status_code=400, detail="Payment request must be approved before execution")
    
    # Get expense
    expense = db.query(Expense).filter(Expense.id == payment_request.expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Get wallet
    wallet = db.query(Wallet).filter(Wallet.org_id == payment_request.org_id).first()
    if not wallet:
        wallet = Wallet(org_id=payment_request.org_id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    # Check balance
    if wallet.balance < payment_request.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    # Deduct from wallet
    wallet.balance -= payment_request.amount
    
    # Create transaction record
    transaction = WalletTransaction(
        wallet_id=wallet.id,
        type="vendor_payment",
        amount=-payment_request.amount,
        description=f"Payment for expense {expense.id}"
    )
    db.add(transaction)
    
    # Update expense status
    expense.status = "paid"
    
    # Update payment request
    payment_request.status = "executed"
    payment_request.executed_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Payment executed successfully",
        "request_id": request_id,
        "new_wallet_balance": wallet.balance
    }
```

#### Step 2: Update Expense Routes
**File**: `backend/app/routes/expenses.py` (MODIFY)
- Update `/add-expense` to create PaymentRequest after creating expense
- Update `/upload-receipt` to create PaymentRequest after creating expense

```python
# In add_expense function, after creating expense:
from app.db.models import PaymentRequest

# ... existing expense creation code ...

# Create payment request
payment_request = PaymentRequest(
    org_id=org_id,  # Get from current user's org
    expense_id=expense.id,
    amount=amount,
    status="pending",
    requested_by_user_id=current_user.id
)
db.add(payment_request)
db.commit()
```

---

### Engineer #3: Receipt Upload & AI

#### Step 1: File Upload Endpoint
**File**: `backend/app/routes/receipts.py` (NEW)
```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Receipt, User
from app.routes.auth import get_current_user
from app.services.receipt_processor import ReceiptProcessor
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads/receipts"

@router.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    org_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create upload directory if it doesn't exist
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # OCR extraction (simplified - use Tesseract or cloud API)
    extracted_text = extract_text_from_image(file_path)  # Implement this
    
    # Process receipt
    result = ReceiptProcessor.process_receipt(
        text=extracted_text,
        filename=file.filename,
        user_category=None
    )
    
    # Save receipt record
    receipt = Receipt(
        org_id=org_id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
        verification_status=result["verification"]["status"],
        verification_confidence=result["verification"]["confidence"],
        flags=str(result["verification"].get("flags", [])),
        uploaded_by_user_id=current_user.id
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    
    return {
        "receipt_id": receipt.id,
        "verification": result["verification"],
        "extracted_amount": result["amount"],
        "suggested_category": result["category"]
    }

def extract_text_from_image(file_path: str) -> str:
    """
    Extract text from image using OCR
    Options:
    1. Tesseract OCR (free, local)
    2. AWS Textract (cloud, paid)
    3. Google Vision API (cloud, paid)
    """
    # For MVP, you can mock this or use Tesseract
    try:
        import pytesseract
        from PIL import Image
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text
    except ImportError:
        # Mock for demo
        return "Total: $50.00\nVendor: Test Store\nDate: 2026-01-15"
```

#### Step 2: Update Receipt Processor
**File**: `backend/app/services/receipt_processor.py` (ENHANCE)
- Add better fraud detection
- Add vendor validation
- Improve confidence scoring

---

## 📦 Required Dependencies

Add to `requirements.txt`:
```
fastapi
uvicorn
sqlalchemy
passlib[bcrypt]
python-jose[cryptography]
python-multipart  # For file uploads
pytesseract  # For OCR (optional)
Pillow  # For image processing
pydantic[email]
```

---

## 🔄 Migration Strategy

1. **Keep JSON file as backup** during migration
2. **Run migration script** to import existing data
3. **Test all endpoints** with new DB
4. **Remove JSON file** once confirmed working

---

## ✅ Testing Checklist

- [ ] User can register and login
- [ ] User can create organization
- [ ] User can invite members
- [ ] Admin can create budget
- [ ] User can upload receipt (image)
- [ ] Receipt creates expense + payment request
- [ ] Admin can see pending payment requests
- [ ] Admin can approve payment request
- [ ] Approved payment can be executed
- [ ] Wallet balance decreases after execution
- [ ] Expense status updates to "paid"
