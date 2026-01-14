# Quick Reference Guide - PayPilot Backend Tasks

## 🎯 MVP Goal
**Complete approval workflow**: Receipt → Expense → PaymentRequest (pending) → Admin Approves → Payment Executes

---

## 👥 Task Assignment Summary

### Engineer #1: Auth & Organization (Foundation)
**Time**: 9-13 hours  
**Priority**: 🔴 CRITICAL - Others depend on this

**Tasks**:
1. ✅ Database schema (Users, Orgs, Memberships, Budgets, Expenses, Receipts, PaymentRequests)
2. ✅ Auth endpoints (`/auth/register`, `/auth/login`)
3. ✅ Organization endpoints (`/org/create`, `/org/invite`, `/org/members`)
4. ✅ JWT middleware for protected routes
5. ✅ Migrate existing routes to use DB (org-scoped)

**Key Files to Create**:
- `backend/app/db/models.py` - Database models
- `backend/app/db/database.py` - DB connection
- `backend/app/routes/auth.py` - Authentication
- `backend/app/routes/organizations.py` - Org management

**Key Files to Modify**:
- `backend/app/main.py` - Add new routers
- `backend/app/routes/budget.py` - Add org context
- `backend/app/routes/expenses.py` - Add org context
- `backend/app/routes/wallet.py` - Add org context

---

### Engineer #2: Approval Workflow (Core Feature)
**Time**: 10-14 hours  
**Priority**: 🔴 CRITICAL - This is the differentiator

**Tasks**:
1. ✅ PaymentRequest model and routes
2. ✅ `/payment-requests/list` - View pending requests
3. ✅ `/payment-requests/{id}/approve` - Admin approves
4. ✅ `/payment-requests/{id}/reject` - Admin rejects
5. ✅ `/payment-requests/{id}/execute` - Execute approved payment
6. ✅ Update expense routes to create PaymentRequest
7. ✅ Payment state machine (pending → approved → executed)

**Key Files to Create**:
- `backend/app/routes/payment_requests.py` - Approval workflow

**Key Files to Modify**:
- `backend/app/routes/expenses.py` - Create PaymentRequest on expense creation
- `backend/app/routes/budget.py` - Ensure budget validation before approval

**State Flow**:
```
Expense Created → PaymentRequest (pending)
                ↓
         Admin Approves → PaymentRequest (approved)
                ↓
         Execute Payment → PaymentRequest (executed) + Expense (paid)
```

---

### Engineer #3: Receipt Upload & AI (Core Feature)
**Time**: 10-14 hours  
**Priority**: 🟡 HIGH - Core user experience

**Tasks**:
1. ✅ File upload endpoint (`/receipts/upload`)
2. ✅ OCR text extraction (Tesseract or mock)
3. ✅ Enhanced receipt verification
4. ✅ Receipt → Expense → PaymentRequest pipeline
5. ✅ Store receipt files and metadata

**Key Files to Create**:
- `backend/app/routes/receipts.py` - Receipt upload

**Key Files to Modify**:
- `backend/app/services/receipt_processor.py` - Enhance verification
- `backend/app/routes/expenses.py` - Integrate receipt upload

**Pipeline Flow**:
```
Upload Image → OCR Extract Text → AI Verify → Create Expense → Create PaymentRequest (pending)
```

---

## 🔄 Integration Points

### Day 1 (Setup)
- **Engineer #1**: Database + Auth + Orgs
- **Engineers #2 & #3**: Wait for DB schema, then start building

### Day 2 (Build)
- **Engineer #1**: Migrate existing routes to DB
- **Engineer #2**: Build approval workflow
- **Engineer #3**: Build receipt upload

### Day 3 (Integrate)
- All: Integrate, test end-to-end, fix bugs
- Test complete flow: Register → Create Org → Upload Receipt → Approve → Execute

---

## 📋 Database Schema (Quick Reference)

```python
# Core Tables
users (id, email, password_hash, name)
organizations (id, name, created_by_user_id)
memberships (user_id, org_id, role)  # role: admin, treasurer, member

# Budget & Expenses
budgets (id, org_id, total_amount)
budget_categories (id, budget_id, category_name, allocated_amount, remaining_amount)
expenses (id, org_id, budget_id, amount, vendor_name, status)  # status: pending, paid

# Receipts
receipts (id, org_id, expense_id, filename, file_path, extracted_text, verification_status)

# Payments
payment_requests (id, org_id, expense_id, amount, status, requested_by, approved_by)
  # status: pending, approved, rejected, executed

# Wallet
wallets (id, org_id, balance)
wallet_transactions (id, wallet_id, type, amount, description)
```

---

## 🔐 Authentication Flow

1. User registers → `/auth/register` → Returns JWT token
2. User logs in → `/auth/login` → Returns JWT token
3. All protected routes require: `Authorization: Bearer <token>`
4. Middleware extracts user from token
5. Check org membership for org-scoped operations

---

## ✅ End-to-End Test Flow

1. **Register User** → `POST /auth/register`
2. **Create Organization** → `POST /org/create`
3. **Create Budget** → `POST /budget/create` (with org_id)
4. **Upload Receipt** → `POST /receipts/upload` (creates expense + payment request)
5. **List Payment Requests** → `GET /payment-requests?org_id=X&status=pending`
6. **Approve Payment** → `POST /payment-requests/{id}/approve`
7. **Execute Payment** → `POST /payment-requests/{id}/execute`
8. **Verify** → Expense status = "paid", Wallet balance decreased

---

## 🚨 Common Pitfalls to Avoid

1. **Don't forget org context** - All queries must filter by org_id
2. **Don't skip approval step** - Payments must go through approval
3. **Don't execute without approval** - Check status before execution
4. **Don't forget role checks** - Only admins/treasurers can approve
5. **Don't mix JSON and DB** - Migrate everything to DB

---

## 📦 Quick Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run database migrations (create tables)
python -c "from app.db.database import init_db; init_db()"

# Run server
uvicorn app.main:app --reload

# Test endpoints
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User"}'
```

---

## 🎯 Success Metrics

- ✅ All 3 engineers can work in parallel after Day 1
- ✅ Complete flow works end-to-end
- ✅ Multi-org support (data isolation)
- ✅ Approval workflow prevents unauthorized payments
- ✅ Receipt upload creates payment request automatically

---

## 📞 Communication Protocol

1. **Day 1 Morning**: All 3 meet to agree on DB schema
2. **Day 1 Evening**: Engineer #1 shares DB setup, others can start
3. **Day 2**: Daily standup (15 min) - share blockers
4. **Day 3**: Integration session - test together

---

## 🔧 Quick Fixes for Common Issues

**Issue**: "User not authenticated"  
**Fix**: Check JWT token in Authorization header

**Issue**: "Not a member of organization"  
**Fix**: User must be added via `/org/invite` or create org

**Issue**: "Payment request not found"  
**Fix**: Check org_id matches, user has access

**Issue**: "Cannot execute unapproved payment"  
**Fix**: Payment must be approved first

---

## 📝 Notes

- **Keep it simple** - SQLite is fine for demo
- **Mock OCR if needed** - Text input works for demo
- **Focus on flow** - One complete flow > many broken features
- **Test early** - Don't wait until Day 3 to test integration
