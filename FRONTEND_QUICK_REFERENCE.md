# Frontend Quick Reference - Backend Integration

## 🎯 What Frontend Needs to Do

The backend now requires:
1. **JWT Authentication** - All requests need `Authorization: Bearer <token>` header
2. **Organization Context** - All POST requests need `org_id` in body
3. **Payment Approval Flow** - New UI for approving payments before execution

---

## 📦 New Files to Create

### 1. Auth Service (`frontend/src/services/auth.js`)
- `getToken()` - Get JWT from localStorage
- `login(email, password)` - Login and store token
- `register(email, password, name)` - Register new user
- `logout()` - Clear auth
- `isAuthenticated()` - Check if logged in
- `getCurrentOrg()` / `setCurrentOrg(org)` - Manage current organization

### 2. API Client (`frontend/src/services/api.js`)
- `apiRequest(endpoint, options)` - Make authenticated request
- `apiGet(endpoint, params)` - GET request
- `apiPost(endpoint, data)` - POST request (auto-adds org_id)
- Automatically adds JWT token to headers
- Handles 401 errors (redirects to login)

### 3. Organization Selector (`frontend/src/components/OrganizationSelector.jsx`)
- Shows current organization
- Create new organization
- Select organization

### 4. Payment Approvals (`frontend/src/components/PaymentApprovals.jsx`)
- List pending payment requests
- Approve/Reject buttons (admin only)
- Execute approved payments
- Filter by status (pending, approved, executed)

---

## 🔄 Files to Update

### `Login.jsx`
- Add register/login form
- Call `login()` or `register()` from auth service
- Store token on success

### `Home.jsx`
- Check authentication on mount
- Show OrganizationSelector if no org selected
- Add "Approvals" tab to view toggle
- Show PaymentApprovals component

### `Dashboard.jsx`
- Replace all `fetch()` with `apiGet()` / `apiPost()`
- Update receipt upload to use file input (not text)
- Use `FormData` for file uploads

### `BudgetForm.jsx`
- Replace `fetch()` with `apiPost()`

### `Wallet.jsx`
- Replace `fetch()` with `apiGet()` / `apiPost()`

### `Payments.jsx`
- Replace `fetch()` with `apiGet()` / `apiPost()`

### `PersonalShopper.jsx`
- Replace `fetch()` with `apiGet()` / `apiPost()`

---

## 🔑 Key Code Patterns

### Making Authenticated API Call

**Before:**
```javascript
const response = await fetch(`${API_URL}/dashboard`)
const data = await response.json()
```

**After:**
```javascript
import { apiGet } from "../services/api"
const data = await apiGet("/dashboard")
```

### POST Request with Org Context

**Before:**
```javascript
const response = await fetch(`${API_URL}/add-expense`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ amount: 50, category: "food" })
})
```

**After:**
```javascript
import { apiPost } from "../services/api"
await apiPost("/add-expense", {
  amount: 50,
  category: "food"
  // org_id is automatically added by apiPost
})
```

### File Upload

**Before:**
```javascript
body: JSON.stringify({ receipt_text: text })
```

**After:**
```javascript
const formData = new FormData()
formData.append("file", file)
formData.append("org_id", org.id)

const response = await fetch(`${API_URL}/receipts/upload`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${getToken()}`
  },
  body: formData
})
```

---

## 🎨 UI Changes Needed

### 1. Login Page
- Add "Register" toggle
- Add "Name" field for registration
- Show error messages

### 2. Home Page
- Add OrganizationSelector at top
- Add "Approvals" button to view toggle
- Show org selector if no org selected

### 3. Dashboard
- Change receipt upload from textarea to file input
- Show image preview when file selected
- Update all API calls

### 4. New: Payment Approvals View
- List of payment requests
- Filter tabs (Pending, Approved, Executed)
- Approve/Reject buttons
- Execute button for approved payments

---

## 🔐 Authentication Flow

```
1. User visits / → Login page
2. User registers/logs in → Token stored in localStorage
3. User redirected to /home
4. If no org selected → Show org selector
5. User creates/selects org → Org stored in localStorage
6. All API calls include JWT token
7. If 401 error → Redirect to login
```

---

## 📋 API Endpoints Reference

### Auth
- `POST /auth/register` - Register user
- `POST /auth/login` - Login (OAuth2 form data)

### Organizations
- `POST /org/create` - Create organization
- `POST /org/{id}/invite` - Invite member
- `GET /org/{id}/members` - List members

### Payment Requests
- `GET /payment-requests?org_id=X&status=pending` - List requests
- `POST /payment-requests/{id}/approve` - Approve
- `POST /payment-requests/{id}/reject` - Reject
- `POST /payment-requests/{id}/execute` - Execute

### Receipts
- `POST /receipts/upload` - Upload image (FormData)

### Existing Endpoints (Update to use apiGet/apiPost)
- `GET /dashboard`
- `POST /create-budget`
- `POST /add-expense`
- `POST /upload-receipt` (now uses file upload)
- `POST /delete-expense`
- `POST /reallocate-funds`
- `POST /bulk-pay-vendors`
- `GET /wallet/balance`
- `POST /wallet/add-funds`
- etc.

---

## ⚠️ Important Notes

1. **All POST requests need org_id** - apiPost() handles this automatically
2. **All requests need JWT token** - apiRequest() handles this automatically
3. **File uploads use FormData** - Not JSON
4. **401 errors = session expired** - Redirect to login
5. **Check org before API calls** - Show org selector if missing

---

## 🚨 Common Issues

**Issue**: "401 Unauthorized"  
**Fix**: Check if token exists, user might need to login again

**Issue**: "Organization not found"  
**Fix**: User needs to create/select organization first

**Issue**: "Cannot approve payment"  
**Fix**: Check if user has admin/treasurer role

**Issue**: "File upload fails"  
**Fix**: Use FormData, not JSON. Include Authorization header.

---

## ✅ Testing Checklist

- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can create organization
- [ ] Can select organization
- [ ] Dashboard loads with org data
- [ ] Can upload receipt image
- [ ] Payment requests appear
- [ ] Can approve payment (as admin)
- [ ] Can execute approved payment
- [ ] Logout clears session
- [ ] 401 redirects to login

---

## 📝 Quick Start

1. **Create auth service** - Copy code from guide
2. **Create API client** - Copy code from guide
3. **Update Login page** - Add register/login
4. **Add org selector** - Show on Home page
5. **Update one component** - Test with Dashboard
6. **Update remaining components** - Use same pattern
7. **Add approvals view** - New component

---

## 💡 Pro Tips

- Start with auth - Get login working first
- Test with browser DevTools - Check Network tab
- Use Postman - Test backend endpoints separately
- Handle errors - Show user-friendly messages
- Add loading states - Better UX

---

## 🔗 Integration Points

**Frontend → Backend:**
- All requests: Add `Authorization: Bearer <token>`
- All POST: Add `org_id` to body
- File uploads: Use `FormData` with `multipart/form-data`

**Backend → Frontend:**
- 401 errors: Redirect to login
- Success responses: Update UI
- Error responses: Show error message

---

Good luck! 🚀
