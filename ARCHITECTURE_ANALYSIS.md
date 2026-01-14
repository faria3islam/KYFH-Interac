# PayPilot Architecture Analysis & Task Breakdown

## 📊 Current State Analysis

### ✅ What You Have (Working)
1. **Budget Engine** - Basic budget creation, tracking, category management
2. **Expense Management** - Add/delete expenses, budget validation
3. **Receipt Processing** - Text-based receipt parsing, basic AI verification
4. **Wallet Service** - Balance management, transaction history
5. **Payment Routes** - Interac transfers, money requests (mock)
6. **AI Services** - Budget splitting, recommendations, personal shopper
7. **Data Storage** - JSON file-based (simple but not scalable)

### ❌ What's Missing (Critical for MVP)
1. **Auth & Organization System** - No users, orgs, roles, permissions
2. **Approval Workflow** - Payments execute immediately, no human approval step
3. **Multi-User Support** - Everything is single-user/global state
4. **Proper Database** - JSON file won't scale, no relationships
5. **Receipt Image Upload** - Only text input, no actual file upload
6. **Organization Context** - All data is global, not org-scoped

---

## 🎯 MVP Requirements (For Sunday Submission)

Based on the architecture plan, your MVP needs:

1. ✅ User creates organization
2. ✅ Admin uploads budget (within org context)
3. ✅ Vendor uploads receipt (within org context)
4. ✅ AI verifies receipt
5. ✅ System checks budget
6. ❌ **Admin presses approve** ← MISSING
7. ✅ Payment marked "executed" (after approval)

**Critical Gap**: The approval workflow is missing. Payments execute immediately without human review.

---

## 👥 Task Breakdown for 3 Backend Engineers

### 🧱 Backend Engineer #1: Platform & Auth Lead - Yusriyah
**Owns**: Auth, Organizations, Roles, Database Foundation

#### Priority Tasks (Must Complete by Sunday)

**1. Database Schema Design** (2-3 hours)
- [ ] Design schema for: Users, Organizations, Memberships, Roles
- [ ] Design schema for: Budgets (org-scoped), Expenses (org-scoped)
- [ ] Design schema for: Receipts, PaymentRequests, Approvals
- [ ] Choose: SQLite (simple) or PostgreSQL (if time allows)
- [ ] Create migration scripts

**2. Auth & Organization Service** (4-5 hours)
- [ ] Create `/auth/register` endpoint (user registration)
- [ ] Create `/auth/login` endpoint (JWT token generation)
- [ ] Create `/org/create` endpoint (create organization)
- [ ] Create `/org/invite` endpoint (invite members)
- [ ] Create `/org/members` endpoint (list org members)
- [ ] Create `/org/assign-role` endpoint (assign roles: admin, treasurer, member)
- [ ] JWT middleware for protected routes
- [ ] Role-based permission decorators

**3. Database Integration** (2-3 hours)
- [ ] Replace JSON file storage with database
- [ ] Update all existing routes to use DB (budget, expenses, wallet)
- [ ] Add organization_id foreign keys to all tables
- [ ] Ensure all queries are org-scoped

**4. API Security** (1-2 hours)
- [ ] Add JWT authentication middleware
- [ ] Protect all routes (except login/register)
- [ ] Add role checks for admin-only endpoints

**Total Estimated Time**: 9-13 hours

**Deliverables**:
- Working auth system
- Organization management
- Database with proper schema
- All existing endpoints work with org context

---

### 🧮 Backend Engineer #2: Budget & Payment Logic Lead - Hadiyah
**Owns**: Budget Engine, Approval Workflow, Payment State Machine

#### Priority Tasks (Must Complete by Sunday)

**1. Approval Workflow System** (4-5 hours) ⚠️ CRITICAL
- [ ] Create `PaymentRequest` model (status: pending, approved, rejected, executed)
- [ ] Create `/payment-requests/create` endpoint
  - When expense is added → create PaymentRequest (status: pending)
  - Link to expense, budget category, amount
- [ ] Create `/payment-requests/list` endpoint (filter by status, org)
- [ ] Create `/payment-requests/{id}/approve` endpoint (admin/treasurer only)
- [ ] Create `/payment-requests/{id}/reject` endpoint (admin/treasurer only)
- [ ] Create `/payment-requests/{id}/execute` endpoint
  - Only callable after approval
  - Deducts from wallet, marks expense as paid
  - Updates PaymentRequest status to "executed"

**2. Budget Validation Enhancement** (2-3 hours)
- [ ] Update budget validation to check org context
- [ ] Add budget approval workflow (optional for MVP)
- [ ] Ensure budget checks happen before payment execution
- [ ] Add budget alerts when approaching limits

**3. Payment State Machine** (2-3 hours)
- [ ] Define payment states: pending → approved/rejected → executed
- [ ] Add state transition validation
- [ ] Add audit log for state changes
- [ ] Prevent invalid transitions (e.g., can't execute without approval)

**4. Integration with Existing Routes** (2-3 hours)
- [ ] Update `/add-expense` to create PaymentRequest
- [ ] Update `/upload-receipt` to create PaymentRequest
- [ ] Update `/bulk-pay-vendors` to use approval workflow
- [ ] Ensure wallet deductions only happen after approval

**Total Estimated Time**: 10-14 hours

**Deliverables**:
- Complete approval workflow
- Payment state machine
- All payments require approval before execution
- Budget validation integrated with payments

---

### 🤖 Backend Engineer #3: AI & Receipt Intelligence Lead - Karan
**Owns**: Receipt Processing, AI Verification, File Upload

#### Priority Tasks (Must Complete by Sunday)

**1. Receipt Image Upload** (3-4 hours) ⚠️ CRITICAL
- [ ] Add file upload endpoint `/receipts/upload` (accepts image/PDF)
- [ ] Store uploaded files (local storage or cloud)
- [ ] Integrate OCR library (Tesseract or cloud API)
- [ ] Extract text from image/PDF
- [ ] Return extracted text to frontend

**2. Enhanced Receipt Verification** (3-4 hours)
- [ ] Improve `ReceiptProcessor.verify_authenticity()` with better fraud detection
- [ ] Add vendor validation (check if vendor exists in system)
- [ ] Add amount verification (cross-check with budget)
- [ ] Add date validation (reject old receipts)
- [ ] Generate fraud flags with confidence scores

**3. Receipt-to-Expense Pipeline** (2-3 hours)
- [ ] Update `/upload-receipt` to accept file upload
- [ ] Process: Upload → OCR → Verify → Extract → Create Expense → Create PaymentRequest
- [ ] Link receipt to expense and payment request
- [ ] Store receipt metadata (filename, upload date, verification status)

**4. AI Enhancement** (2-3 hours)
- [ ] Improve category detection (use LLM if available)
- [ ] Add vendor name extraction from receipt
- [ ] Add line item extraction (optional for MVP)
- [ ] Improve confidence scoring

**Total Estimated Time**: 10-14 hours

**Deliverables**:
- Working image/PDF upload
- OCR text extraction
- Enhanced fraud detection
- Receipt → Expense → PaymentRequest pipeline

---

## 🔄 Integration Points (All 3 Engineers)

### Shared Contracts (Define First - 1 hour meeting)
1. **Database Schema** - Agree on tables, relationships, indexes
2. **API Endpoints** - Document request/response formats
3. **Error Codes** - Standardize error responses
4. **Authentication** - How JWT tokens are passed, validated

### Integration Sequence
1. **Day 1**: Engineer #1 sets up DB + Auth → Others can start building
2. **Day 2**: Engineer #2 builds approval workflow → Engineer #3 integrates receipt upload
3. **Day 3**: All integrate, test end-to-end flow, fix bugs

---

## 📋 Simplified Database Schema (Recommended)

```sql
-- Users & Auth
users (id, email, password_hash, name, created_at)
organizations (id, name, created_by_user_id, created_at)
memberships (id, user_id, org_id, role, created_at)
  -- roles: 'admin', 'treasurer', 'member'

-- Budget & Expenses
budgets (id, org_id, total_amount, created_by_user_id, created_at)
budget_categories (id, budget_id, category_name, allocated_amount, remaining_amount)
expenses (id, org_id, budget_id, category_id, amount, vendor_name, status, created_by_user_id, created_at)
  -- status: 'pending', 'paid', 'cancelled'

-- Receipts
receipts (id, org_id, expense_id, filename, file_path, extracted_text, verification_status, verification_confidence, flags, uploaded_by_user_id, created_at)

-- Payments & Approvals
payment_requests (id, org_id, expense_id, amount, status, requested_by_user_id, approved_by_user_id, executed_at, created_at)
  -- status: 'pending', 'approved', 'rejected', 'executed'

-- Wallet (org-scoped)
wallets (id, org_id, balance, created_at)
wallet_transactions (id, wallet_id, type, amount, description, created_at)
```

---

## 🚨 Critical Path (Must-Have for Demo)

1. **Auth + Org** (Engineer #1) - Without this, nothing works
2. **Approval Workflow** (Engineer #2) - Core differentiator
3. **Receipt Upload** (Engineer #3) - Core feature

**Everything else can be simplified or mocked for demo.**

---

## ⚡ Quick Wins (If Time Permits)

- Add email notifications for approval requests
- Add budget alerts (email/SMS)
- Add receipt image preview in frontend
- Add payment request history dashboard
- Add fraud detection dashboard

---

## 📝 Notes for Sunday Submission

1. **Keep it simple** - Don't over-engineer
2. **Mock what you can** - Real OCR can be mocked with text input
3. **Focus on flow** - The approval workflow is the key differentiator
4. **Test end-to-end** - One complete flow is better than many broken features
5. **Document APIs** - Use FastAPI's auto-docs (`/docs`)

---

## 🎯 Success Criteria

MVP is complete when:
- ✅ User can register/login
- ✅ User can create organization
- ✅ Admin can create budget
- ✅ User can upload receipt (image or text)
- ✅ AI verifies receipt
- ✅ System creates payment request (pending)
- ✅ Admin can approve/reject payment request
- ✅ Approved payment executes (deducts from wallet)
- ✅ All data is org-scoped (multi-org support)
