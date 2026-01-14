# Frontend Implementation Guide - Backend Integration

## 🎯 Overview

This guide outlines all frontend changes needed to integrate with the new backend architecture. The backend now requires:
- **Authentication** (JWT tokens)
- **Organization context** (multi-org support)
- **Approval workflow** (payment requests)

---

## 📋 Priority Tasks for Frontend Developer

### 🔴 CRITICAL (Must Complete)

1. **Authentication System** - JWT token management
2. **Organization Management** - Org selection/creation UI
3. **API Client with Auth** - All requests include JWT token
4. **Payment Approval UI** - New component for approving payments
5. **Receipt Image Upload** - File upload instead of text input

### 🟡 HIGH (Important for MVP)

6. **Update All API Calls** - Add org_id and auth headers
7. **Error Handling** - Handle 401 (unauthorized) redirects
8. **Loading States** - Better UX during API calls

---

## 🔧 Implementation Details

### 1. Authentication System

#### Create: `frontend/src/services/auth.js`

```javascript
const API_URL = "/api"
const TOKEN_KEY = "paypilot_token"
const USER_KEY = "paypilot_user"
const ORG_KEY = "paypilot_org"

// Get stored token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

// Get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem(USER_KEY)
  return userStr ? JSON.parse(userStr) : null
}

// Get current organization
export const getCurrentOrg = () => {
  const orgStr = localStorage.getItem(ORG_KEY)
  return orgStr ? JSON.parse(orgStr) : null
}

// Set token and user
export const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// Set current organization
export const setCurrentOrg = (org) => {
  localStorage.setItem(ORG_KEY, JSON.stringify(org))
}

// Clear auth
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(ORG_KEY)
}

// Check if authenticated
export const isAuthenticated = () => {
  return !!getToken()
}

// Register user
export const register = async (email, password, name) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Registration failed")
  }
  
  const data = await response.json()
  setAuth(data.access_token, { email, name })
  return data
}

// Login user
export const login = async (email, password) => {
  const formData = new FormData()
  formData.append("username", email)  // OAuth2 expects "username"
  formData.append("password", password)
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    body: formData
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Login failed")
  }
  
  const data = await response.json()
  setAuth(data.access_token, { email })
  return data
}

// Logout
export const logout = () => {
  clearAuth()
}
```

#### Create: `frontend/src/services/api.js`

```javascript
import { getToken, getCurrentOrg, clearAuth } from "./auth"

const API_URL = "/api"

// Make authenticated API request
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken()
  const org = getCurrentOrg()
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  }
  
  // Add auth token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  // Add org_id to body if POST/PUT/PATCH
  if (options.body && org && (options.method === "POST" || options.method === "PUT" || options.method === "PATCH")) {
    const body = typeof options.body === "string" ? JSON.parse(options.body) : options.body
    body.org_id = org.id
    options.body = JSON.stringify(body)
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })
  
  // Handle 401 (unauthorized) - redirect to login
  if (response.status === 401) {
    clearAuth()
    window.location.href = "/"
    throw new Error("Session expired. Please login again.")
  }
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

// Convenience methods
export const apiGet = (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString()
  const url = queryString ? `${endpoint}?${queryString}` : endpoint
  return apiRequest(url, { method: "GET" })
}

export const apiPost = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data)
  })
}

export const apiPut = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(data)
  })
}

export const apiDelete = (endpoint) => {
  return apiRequest(endpoint, { method: "DELETE" })
}
```

---

### 2. Update Login Page

#### Modify: `frontend/src/pages/Login.jsx`

```javascript
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login, register } from "../services/auth"
import "../components/BudgetForm.css"

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      if (isRegister) {
        if (!name.trim()) {
          setError("Please enter your name")
          return
        }
        await register(email, password, name)
        alert("Registration successful! Please create or select an organization.")
        navigate("/home")
      } else {
        await login(email, password)
        navigate("/home")
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ /* existing styles */ }}>
      <div style={{ /* existing styles */ }}>
        {/* ... existing logo and title ... */}
        
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ textAlign: "left" }}>
              <label>Name</label>
              <input
                className="budget-input"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div style={{ textAlign: "left" }}>
            <label>Email</label>
            <input
              className="budget-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div style={{ textAlign: "left" }}>
            <label>Password</label>
            <input
              className="budget-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div style={{ color: "red", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="budget-submit-btn"
            disabled={loading}
          >
            {loading ? "Loading..." : isRegister ? "Register" : "Login"}
          </button>
        </form>
        
        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{ marginTop: "1rem", background: "none", border: "none", color: "#6366f1", cursor: "pointer" }}
        >
          {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  )
}
```

---

### 3. Organization Management

#### Create: `frontend/src/components/OrganizationSelector.jsx`

```javascript
import { useState, useEffect } from "react"
import { apiGet, apiPost } from "../services/api"
import { getCurrentOrg, setCurrentOrg } from "../services/auth"
import "./OrganizationSelector.css"

export default function OrganizationSelector({ onOrgChange }) {
  const [orgs, setOrgs] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      // Get user's organizations (you'll need to create this endpoint)
      // For now, we'll create a simple flow
      const currentOrg = getCurrentOrg()
      if (currentOrg) {
        setOrgs([currentOrg])
      }
    } catch (error) {
      console.error("Error loading organizations:", error)
    }
  }

  const handleCreateOrg = async (e) => {
    e.preventDefault()
    if (!orgName.trim()) {
      alert("Please enter organization name")
      return
    }

    setLoading(true)
    try {
      const result = await apiPost("/org/create", { name: orgName })
      const newOrg = { id: result.id, name: result.name }
      setCurrentOrg(newOrg)
      setOrgs([...orgs, newOrg])
      setOrgName("")
      setShowCreate(false)
      if (onOrgChange) onOrgChange(newOrg)
      alert("Organization created successfully!")
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOrg = (org) => {
    setCurrentOrg(org)
    if (onOrgChange) onOrgChange(org)
  }

  const currentOrg = getCurrentOrg()

  return (
    <div className="org-selector">
      <div className="org-selector-header">
        <h3>Organization</h3>
        <button onClick={() => setShowCreate(!showCreate)} className="org-btn">
          {showCreate ? "✕ Cancel" : "+ Create New"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateOrg} className="org-create-form">
          <input
            type="text"
            placeholder="Organization name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="org-input"
            required
          />
          <button type="submit" disabled={loading} className="org-submit-btn">
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {currentOrg && (
        <div className="current-org">
          <span className="org-badge">🏢 {currentOrg.name}</span>
        </div>
      )}

      {!currentOrg && !showCreate && (
        <div className="org-empty">
          <p>No organization selected. Create one to get started.</p>
        </div>
      )}
    </div>
  )
}
```

#### Create: `frontend/src/components/OrganizationSelector.css`

```css
.org-selector {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.org-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.org-btn {
  padding: 0.5rem 1rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.org-create-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.org-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.org-submit-btn {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.current-org {
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
}

.org-badge {
  font-weight: 600;
  color: #1e40af;
}
```

---

### 4. Payment Approval Component

#### Create: `frontend/src/components/PaymentApprovals.jsx`

```javascript
import { useState, useEffect } from "react"
import { apiGet, apiPost } from "../services/api"
import "./PaymentApprovals.css"

export default function PaymentApprovals() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending") // pending, approved, rejected, executed

  useEffect(() => {
    loadPaymentRequests()
  }, [filter])

  const loadPaymentRequests = async () => {
    try {
      const org = JSON.parse(localStorage.getItem("paypilot_org"))
      if (!org) {
        alert("Please select an organization")
        return
      }

      const data = await apiGet("/payment-requests", {
        org_id: org.id,
        status: filter
      })
      setRequests(data)
    } catch (error) {
      console.error("Error loading payment requests:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId) => {
    if (!confirm("Approve this payment request?")) return

    try {
      await apiPost(`/payment-requests/${requestId}/approve`, {})
      alert("Payment request approved!")
      loadPaymentRequests()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleReject = async (requestId) => {
    if (!confirm("Reject this payment request?")) return

    try {
      await apiPost(`/payment-requests/${requestId}/reject`, {})
      alert("Payment request rejected!")
      loadPaymentRequests()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleExecute = async (requestId) => {
    if (!confirm("Execute this payment? This will deduct from wallet.")) return

    try {
      const result = await apiPost(`/payment-requests/${requestId}/execute`, {})
      alert(`Payment executed! New wallet balance: $${result.new_wallet_balance.toFixed(2)}`)
      loadPaymentRequests()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return <div className="loading">Loading payment requests...</div>
  }

  return (
    <div className="payment-approvals-container">
      <div className="approvals-header">
        <h2>💸 Payment Approvals</h2>
        <div className="filter-tabs">
          <button 
            className={filter === "pending" ? "active" : ""}
            onClick={() => setFilter("pending")}
          >
            Pending ({requests.filter(r => r.status === "pending").length})
          </button>
          <button 
            className={filter === "approved" ? "active" : ""}
            onClick={() => setFilter("approved")}
          >
            Approved
          </button>
          <button 
            className={filter === "executed" ? "active" : ""}
            onClick={() => setFilter("executed")}
          >
            Executed
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No payment requests found</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.id} className={`request-card ${request.status}`}>
              <div className="request-header">
                <div>
                  <h3>${request.amount.toFixed(2)}</h3>
                  <p className="request-meta">
                    Expense ID: {request.expense_id} | 
                    Status: <span className={`status-badge ${request.status}`}>{request.status}</span>
                  </p>
                </div>
                <div className="request-actions">
                  {request.status === "pending" && (
                    <>
                      <button 
                        className="btn-approve"
                        onClick={() => handleApprove(request.id)}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => handleReject(request.id)}
                      >
                        ❌ Reject
                      </button>
                    </>
                  )}
                  {request.status === "approved" && (
                    <button 
                      className="btn-execute"
                      onClick={() => handleExecute(request.id)}
                    >
                      💸 Execute Payment
                    </button>
                  )}
                  {request.status === "executed" && (
                    <span className="executed-badge">✅ Executed</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### 5. Receipt Image Upload

#### Update: `frontend/src/components/Dashboard.jsx`

Replace the receipt upload section with file upload:

```javascript
// Add state for file upload
const [receiptFile, setReceiptFile] = useState(null)
const [receiptPreview, setReceiptPreview] = useState(null)

// Update handleReceiptUpload function
const handleReceiptUpload = async () => {
  if (!receiptFile) {
    alert("Please select a receipt image")
    return
  }

  setUploadingReceipt(true)
  setVerificationResult(null)

  try {
    const formData = new FormData()
    formData.append("file", receiptFile)
    
    const org = JSON.parse(localStorage.getItem("paypilot_org"))
    if (org) {
      formData.append("org_id", org.id)
    }
    
    if (receiptCategory) {
      formData.append("category", receiptCategory)
    }

    const response = await fetch(`${API_URL}/receipts/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getToken()}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    setVerificationResult(result)
    
    // Show success message
    alert(`✅ Receipt processed!\nAmount: $${result.extracted_amount}\nStatus: ${result.verification.status}`)
    
    // Reset form
    setReceiptFile(null)
    setReceiptPreview(null)
    setReceiptCategory("")
    setShowReceiptUpload(false)
    fetchData()
  } catch (error) {
    console.error("Error uploading receipt:", error)
    alert(`Error processing receipt: ${error.message}`)
  } finally {
    setUploadingReceipt(false)
  }
}

// Add file input handler
const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    setReceiptFile(file)
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setReceiptPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }
}

// Update JSX for receipt upload
{showReceiptUpload && (
  <div className="receipt-upload-form">
    <div className="receipt-info-banner">
      <span className="receipt-info-icon">🤖</span>
      <div className="receipt-info-text">
        <strong>AI-Powered Receipt Verification</strong>
        <p>Upload a receipt image. AI will extract text, verify authenticity, and create a payment request.</p>
      </div>
    </div>
    
    <div className="form-group">
      <label>Upload Receipt (Image/PDF)</label>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="file-input"
      />
      {receiptPreview && (
        <div className="receipt-preview">
          <img src={receiptPreview} alt="Receipt preview" style={{ maxWidth: "300px", marginTop: "1rem" }} />
        </div>
      )}
    </div>
    
    <div className="form-group">
      <label>Category (optional - AI will detect)</label>
      <select 
        className="expense-select"
        value={receiptCategory}
        onChange={(e) => setReceiptCategory(e.target.value)}
      >
        <option value="">🤖 Let AI Decide</option>
        {data.categories && Object.keys(data.categories).map(cat => (
          <option key={cat} value={cat}>
            {categoryIcons[cat]} {cat}
          </option>
        ))}
      </select>
    </div>
    
    <button 
      className="add-expense-btn receipt-submit-btn"
      onClick={handleReceiptUpload}
      disabled={uploadingReceipt || !receiptFile}
    >
      {uploadingReceipt ? '🔍 AI Verifying...' : '🤖 Process Receipt with AI'}
    </button>
  </div>
)}
```

---

### 6. Update Home Page

#### Modify: `frontend/src/pages/Home.jsx`

Add organization selector and payment approvals:

```javascript
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { isAuthenticated, getCurrentOrg, logout } from "../services/auth"
import OrganizationSelector from "../components/OrganizationSelector"
import PaymentApprovals from "../components/PaymentApprovals"
// ... other imports

export default function Home() {
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeView, setActiveView] = useState("dashboard")
  const [currentOrg, setCurrentOrg] = useState(getCurrentOrg())

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      navigate("/")
      return
    }

    // Check if org is selected
    const org = getCurrentOrg()
    if (!org) {
      setActiveView("organizations")
    } else {
      setCurrentOrg(org)
    }
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const handleOrgChange = (org) => {
    setCurrentOrg(org)
    if (org) {
      setActiveView("dashboard")
    }
  }

  // Show org selector if no org selected
  if (!currentOrg) {
    return (
      <div className="home-container">
        <div className="home-content">
          <div className="home-header">
            <h1 className="home-title">KYFH Interac</h1>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
          <OrganizationSelector onOrgChange={handleOrgChange} />
        </div>
      </div>
    )
  }

  return (
    <div className="home-container">
      <div className="home-content">
        {/* ... existing header ... */}
        
        {/* Add Organization Selector */}
        <OrganizationSelector onOrgChange={handleOrgChange} />
        
        {/* View Toggle - Add Approvals */}
        <div className="view-toggle">
          {/* ... existing buttons ... */}
          <button 
            className={`view-btn ${activeView === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveView('approvals')}
          >
            ✅ Approvals
          </button>
        </div>
        
        {/* Add Approvals View */}
        {activeView === 'approvals' ? (
          <PaymentApprovals />
        ) : (
          // ... existing views ...
        )}
      </div>
    </div>
  )
}
```

---

### 7. Update All API Calls

#### Update: `frontend/src/components/Dashboard.jsx`

Replace all `fetch` calls with `apiRequest`:

```javascript
import { apiGet, apiPost } from "../services/api"

// Replace fetchData
const fetchData = async () => {
  try {
    const data = await apiGet("/dashboard")
    setData(data)
    setLoading(false)
  } catch (error) {
    console.error("Error fetching dashboard:", error)
    setData(null)
    setLoading(false)
  }
}

// Replace addExpense
const addExpense = async () => {
  if (!expenseAmount || Number(expenseAmount) <= 0) {
    alert("Please enter a valid amount")
    return
  }

  try {
    await apiPost("/add-expense", {
      amount: Number(expenseAmount),
      category: expenseCategory,
      vendor_name: vendorName || "Unknown Vendor"
    })
    setExpenseAmount("")
    setVendorName("")
    fetchData()
  } catch (error) {
    alert(`Error: ${error.message}`)
  }
}

// Similar updates for deleteExpense, handleReallocation, etc.
```

---

## 📝 Summary Checklist

### Files to Create:
- [ ] `frontend/src/services/auth.js` - Auth utilities
- [ ] `frontend/src/services/api.js` - API client with auth
- [ ] `frontend/src/components/OrganizationSelector.jsx` - Org management
- [ ] `frontend/src/components/OrganizationSelector.css` - Org styles
- [ ] `frontend/src/components/PaymentApprovals.jsx` - Approval UI
- [ ] `frontend/src/components/PaymentApprovals.css` - Approval styles

### Files to Update:
- [ ] `frontend/src/pages/Login.jsx` - Add register/login with API
- [ ] `frontend/src/pages/Home.jsx` - Add org selector, approvals view
- [ ] `frontend/src/components/Dashboard.jsx` - Update all API calls, add file upload
- [ ] `frontend/src/components/BudgetForm.jsx` - Update API calls
- [ ] `frontend/src/components/Wallet.jsx` - Update API calls
- [ ] `frontend/src/components/Payments.jsx` - Update API calls
- [ ] `frontend/src/components/PersonalShopper.jsx` - Update API calls

### Key Changes:
1. ✅ All API calls use `apiRequest` with JWT tokens
2. ✅ All POST requests include `org_id`
3. ✅ Login/Register flow implemented
4. ✅ Organization selection UI
5. ✅ Payment approval workflow UI
6. ✅ Receipt image upload (not just text)
7. ✅ Error handling for 401 (redirect to login)

---

## 🚀 Testing Checklist

- [ ] User can register
- [ ] User can login
- [ ] User can create organization
- [ ] User can select organization
- [ ] Dashboard loads with org context
- [ ] Receipt image upload works
- [ ] Payment requests appear in approvals
- [ ] Admin can approve/reject payments
- [ ] Approved payments can be executed
- [ ] Logout clears session
- [ ] 401 errors redirect to login

---

## 💡 Tips

1. **Start with auth** - Get login/register working first
2. **Test with Postman** - Verify backend endpoints before frontend
3. **Use browser DevTools** - Check Network tab for API calls
4. **Handle errors gracefully** - Show user-friendly messages
5. **Add loading states** - Better UX during API calls

Good luck! 🎉
