import { useEffect, useState } from "react"
import './Dashboard.css'

// Use /api prefix which Vite will proxy to backend
const API_URL = "/api"

export default function Dashboard({ refresh }) {
  const [data, setData] = useState(null)
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("food")
  const [vendorName, setVendorName] = useState("")
  const [loading, setLoading] = useState(true)
  const [showReallocationModal, setShowReallocationModal] = useState(false)
  const [reallocation, setReallocation] = useState({ from: "food", to: "venue", amount: "" })
  const [showBulkPayModal, setShowBulkPayModal] = useState(false)
  const [bulkPayLoading, setBulkPayLoading] = useState(false)
  
  // Receipt upload states
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [receiptText, setReceiptText] = useState("")
  const [receiptFilename, setReceiptFilename] = useState("")
  const [receiptCategory, setReceiptCategory] = useState("")
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)

  const fetchData = () => {
    fetch(`${API_URL}/dashboard`)
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching dashboard:", err)
        setData(null)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [refresh])

  const addExpense = async () => {
    if (!expenseAmount || Number(expenseAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    try {
      const response = await fetch(`${API_URL}/add-expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: Number(expenseAmount), 
          category: expenseCategory,
          vendor_name: vendorName || "Unknown Vendor"
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `HTTP error! status: ${response.status}`)
      }
      
      setExpenseAmount("")
      setVendorName("")
      fetchData()
    } catch (error) {
      console.error("Error adding expense:", error)
      alert(`Error adding expense: ${error.message}`)
    }
  }

  const deleteExpense = async (index) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/delete-expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expense_index: index })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `HTTP error! status: ${response.status}`)
      }
      
      fetchData()
    } catch (error) {
      console.error("Error deleting expense:", error)
      alert(`Error deleting expense: ${error.message}`)
    }
  }

  const handleReallocation = async () => {
    if (!reallocation.amount || Number(reallocation.amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    try {
      const response = await fetch(`${API_URL}/reallocate-funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_category: reallocation.from,
          to_category: reallocation.to,
          amount: Number(reallocation.amount)
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      alert(result.message)
      setShowReallocationModal(false)
      setReallocation({ from: "food", to: "venue", amount: "" })
      fetchData()
    } catch (error) {
      console.error("Error reallocating funds:", error)
      alert(`Error: ${error.message}`)
    }
  }

  const handleBulkPay = async () => {
    setBulkPayLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/bulk-pay-vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      let message = `${result.message}\n\n`
      message += `${result.ai_confirmation}\n\n`
      message += `Total Paid: $${result.total_amount.toFixed(2)}\n`
      message += `Remaining Wallet Balance: $${result.remaining_wallet_balance.toFixed(2)}\n\n`
      message += `Payments:\n`
      result.payments.forEach((payment, idx) => {
        message += `${idx + 1}. ${payment.vendor} - $${payment.amount.toFixed(2)} (${payment.category})\n`
      })
      
      alert(message)
      setShowBulkPayModal(false)
      fetchData()
    } catch (error) {
      console.error("Error processing bulk payment:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setBulkPayLoading(false)
    }
  }

  const handleReceiptUpload = async () => {
    if (!receiptText.trim()) {
      alert("Please paste receipt text or enter bill details")
      return
    }

    setUploadingReceipt(true)
    setVerificationResult(null)

    try {
      const response = await fetch(`${API_URL}/upload-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt_text: receiptText,
          filename: receiptFilename || "manual-entry.txt",
          category: receiptCategory || null
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setVerificationResult(result)
      
      // Show verification result
      const verification = result.verification
      let message = `✅ Receipt Processed!\n\n`
      message += `Amount: $${result.expense.amount}\n`
      message += `Category: ${result.expense.category}\n`
      message += `Status: ${verification.status.toUpperCase()}\n`
      message += `Confidence: ${verification.confidence}%\n`
      
      if (verification.flags && verification.flags.length > 0) {
        message += `\n⚠️ Flags:\n${verification.flags.map(f => `• ${f}`).join('\n')}`
      }
      
      alert(message)
      
      // Reset form
      setReceiptText("")
      setReceiptFilename("")
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

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!data || data.total_budget === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📝</span>
        <p>Create a budget to get started</p>
      </div>
    )
  }

  const categoryIcons = {
    food: "🍽️",
    venue: "🏛️",
    decor: "🎨",
    misc: "✨"
  }

  const totalSpent = data.total_budget - data.remaining
  const expenseCount = data.expenses ? data.expenses.length : 0
  const recommendations = data.recommendations || []
  
  console.log("Dashboard data:", data)
  console.log("Recommendations:", recommendations)

  return (
    <div className="dashboard-container">
      {/* AI Assistant Header - Always Visible */}
      <div className="ai-assistant-banner">
        <div className="ai-avatar">
          <div className="ai-pulse"></div>
          🤖
        </div>
        <div className="ai-banner-content">
          <h3>AI Assistant Active</h3>
          <p>Analyzing spending patterns • Learning your behavior • Making smart recommendations</p>
        </div>
        <div className="ai-stats">
          <div className="ai-stat-item">
            <span className="stat-value">{recommendations.length}</span>
            <span className="stat-label">Active Insights</span>
          </div>
          <div className="ai-stat-item">
            <span className="stat-value">{expenseCount}</span>
            <span className="stat-label">Analyzed</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <h1>Budget Dashboard</h1>
        <p className="welcome-text">Track your event expenses with AI-powered insights</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Total Budget</h3>
            <p className="stat-number">${data.total_budget.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <h3>Total Spent</h3>
            <p className="stat-number">${totalSpent.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-info">
            <h3>Remaining</h3>
            <p className="stat-number">${data.remaining.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total Expenses</h3>
            <p className="stat-number">{expenseCount}</p>
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      {data.feedback && (
        <div className={`ai-feedback ${data.remaining < data.total_budget * 0.2 ? 'warning' : ''}`}>
          <div className="ai-feedback-icon">💡</div>
          <div className="ai-feedback-content">
            <h3>AI Insight</h3>
            <p>{data.feedback}</p>
          </div>
        </div>
      )}

      {/* AI Autonomous Recommendations - Prominent Section */}
      <div className="ai-recommendations-section">
        <div className="ai-section-header">
          <div className="ai-header-left">
            <div className="ai-icon-large">🤖</div>
            <div>
              <h2>Agentic AI Recommendations</h2>
              <p className="ai-subtitle">Autonomous analysis and proactive decision-making</p>
            </div>
          </div>
          {recommendations.length > 0 && (
            <div className="ai-badge">
              <span className="badge-pulse"></span>
              {recommendations.length} New Insights
            </div>
          )}
        </div>
        
        {recommendations.length > 0 ? (
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={`recommendation-card ${rec.priority} animate-slide-in`} style={{animationDelay: `${idx * 0.1}s`}}>
                <div className="rec-header">
                  <span className="rec-type">
                    {rec.type === 'learning' && '🧠 '}
                    {rec.type === 'reallocation' && '🔄 '}
                    {rec.type === 'critical' && '🚨 '}
                    {rec.type === 'overspend' && '⚠️ '}
                    {rec.type === 'optimization' && '✨ '}
                    {rec.type.toUpperCase()}
                  </span>
                  <span className={`rec-priority ${rec.priority}`}>
                    {rec.priority === 'high' ? '🔴 HIGH' : rec.priority === 'medium' ? '🟡 MEDIUM' : rec.priority === 'low' ? '🟢 LOW' : 'ℹ️ INFO'}
                  </span>
                </div>
                <p className="rec-action">{rec.action}</p>
                <p className="rec-reason">💡 {rec.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="ai-empty-state">
            <div className="ai-thinking">🤖</div>
            <h3>AI is Learning...</h3>
            <p>Add more expenses to unlock intelligent recommendations and predictions</p>
          </div>
        )}
      </div>

      {/* Quick Add Expense */}
      <div className="quick-add-section">
        <h2>Add New Expense</h2>
        <div className="expense-form">
          <input
            className="expense-input"
            placeholder="Vendor name"
            type="text"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
          />
          <input
            className="expense-input"
            placeholder="Amount"
            type="number"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
          />
          <select 
            className="expense-select"
            value={expenseCategory}
            onChange={(e) => setExpenseCategory(e.target.value)}
          >
            {data.categories && Object.keys(data.categories).map(cat => (
              <option key={cat} value={cat} className="capitalize">
                {categoryIcons[cat]} {cat}
              </option>
            ))}
          </select>
          <button 
            className="add-expense-btn"
            onClick={addExpense}
          >
            Add Expense
          </button>
        </div>
      </div>

      {/* Receipt Upload Section - NEW */}
      <div className="quick-add-section receipt-upload-section">
        <button 
          className="add-expense-btn receipt-toggle-btn"
          onClick={() => setShowReceiptUpload(!showReceiptUpload)}
        >
          {showReceiptUpload ? '✕ Close Receipt Upload' : '📄 Upload Receipt / Bill (AI Verification)'}
        </button>
        
        {showReceiptUpload && (
          <div className="receipt-upload-form">
            <div className="receipt-info-banner">
              <span className="receipt-info-icon">🤖</span>
              <div className="receipt-info-text">
                <strong>AI-Powered Receipt Verification</strong>
                <p>Paste your receipt text below. AI will verify authenticity, extract amount, detect category, and auto-log the expense.</p>
              </div>
            </div>
            
            <div className="form-group">
              <label>Receipt/Bill Text</label>
              <textarea
                className="receipt-textarea"
                placeholder="Paste receipt text here... Example:&#10;&#10;Joe's Pizza Restaurant&#10;123 Main St&#10;&#10;2x Large Pizza    $25.00&#10;1x Soda            $3.50&#10;Subtotal:         $28.50&#10;Tax:               $2.85&#10;TOTAL:            $31.35&#10;&#10;The AI will extract the amount and verify authenticity!"
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                rows={8}
              />
            </div>
            
            <div className="receipt-form-row">
              <div className="form-group">
                <label>Filename (optional)</label>
                <input
                  type="text"
                  className="expense-input"
                  placeholder="e.g., pizza-receipt.jpg"
                  value={receiptFilename}
                  onChange={(e) => setReceiptFilename(e.target.value)}
                />
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
            </div>
            
            <button 
              className="add-expense-btn receipt-submit-btn"
              onClick={handleReceiptUpload}
              disabled={uploadingReceipt}
            >
              {uploadingReceipt ? '🔍 AI Verifying...' : '🤖 Process Receipt with AI'}
            </button>
            
            <div className="receipt-features">
              <div className="feature-item">✅ Authenticity Verification</div>
              <div className="feature-item">💰 Auto Amount Extraction</div>
              <div className="feature-item">🏷️ Smart Category Detection</div>
              <div className="feature-item">🚨 Fraud Detection</div>
            </div>
          </div>
        )}
      </div>

      {/* Category Overview */}
      <div className="quick-add-section">
        <h2>Budget Categories</h2>
        <div className="action-buttons">
          {Object.entries(data.categories).map(([cat, amount]) => (
            <button
              key={cat}
              className={`action-btn ${amount < 0 ? 'overspent' : ''}`}
            >
              {categoryIcons[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}: ${amount.toFixed(0)}
            </button>
          ))}
        </div>
      </div>

      {/* Reallocate Funds */}
      <div className="quick-add-section reallocate-section">
        <button 
          className="add-expense-btn full-width-btn"
          onClick={() => setShowReallocationModal(!showReallocationModal)}
        >
          {showReallocationModal ? '✕ Close' : '🔄 Reallocate Funds Between Categories'}
        </button>
        
        {showReallocationModal && (
          <div className="realloc-form">
            <div className="form-row">
              <div className="form-group">
                <label>From Category</label>
                <select 
                  value={reallocation.from}
                  onChange={(e) => setReallocation({...reallocation, from: e.target.value})}
                  className="expense-select"
                >
                  {Object.keys(data.categories).map(cat => (
                    <option key={cat} value={cat}>{categoryIcons[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>To Category</label>
                <select 
                  value={reallocation.to}
                  onChange={(e) => setReallocation({...reallocation, to: e.target.value})}
                  className="expense-select"
                >
                  {Object.keys(data.categories).map(cat => (
                    <option key={cat} value={cat}>{categoryIcons[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={reallocation.amount}
                  onChange={(e) => setReallocation({...reallocation, amount: e.target.value})}
                  className="expense-input"
                />
              </div>
              <div className="form-group">
                <label>&nbsp;</label>
                <button className="add-expense-btn" onClick={handleReallocation}>
                  Reallocate ${reallocation.amount || 0}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Expenses */}
      {data.expenses && data.expenses.length > 0 && (
        <div className="quick-add-section">
          <div className="expenses-header-row">
            <h2>Recent Expenses</h2>
            {data.expenses.some(exp => exp.status === 'pending') && (
              <button 
                className="bulk-pay-btn"
                onClick={() => setShowBulkPayModal(true)}
                title="Pay all vendors at once"
              >
                🔥 Pay All Vendors
              </button>
            )}
          </div>
          <div className="expenses-list">
            {data.expenses.slice(-10).reverse().map((exp, idx) => {
              const actualIndex = data.expenses.length - 1 - idx
              const isVerified = exp.receipt_verified
              const verificationStatus = exp.verification_status
              const isAIPurchased = exp.ai_purchased
              
              return (
                <div 
                  key={idx} 
                  className={`expense-item ${isVerified ? 'verified-expense' : ''} ${isAIPurchased ? 'ai-purchased-expense' : ''} ${exp.status === 'pending' ? 'pending-expense' : ''}`}
                  style={{
                    padding: '1.75rem 2rem',
                    gap: '2.5rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  <span className="expense-icon" style={{ fontSize: '2.25rem' }}>{categoryIcons[exp.category] || '📦'}</span>
                  <div className="expense-details">
                    <div className="expense-vendor-row">
                      <span className="expense-category" style={{ fontSize: '1.125rem' }}>
                        {exp.vendor_name || exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                      </span>
                      {exp.status === 'pending' && (
                        <span className="status-badge pending-badge">⏳ Pending Payment</span>
                      )}
                      {exp.status === 'paid' && (
                        <span className="status-badge paid-badge">✅ Paid</span>
                      )}
                    </div>
                    {exp.vendor_name && (
                      <span className="expense-subcategory">
                        {categoryIcons[exp.category]} {exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                      </span>
                    )}
                    {isAIPurchased && (
                      <div className="verification-badges">
                        <span className="verification-badge ai-purchased">🤖 AI Purchased</span>
                        {exp.vendor && (
                          <span className="receipt-filename">🏪 {exp.vendor}</span>
                        )}
                        {exp.product_name && (
                          <span className="receipt-filename" title={exp.ai_reasoning}>📦 {exp.product_name}</span>
                        )}
                        {exp.savings > 0 && (
                          <span className="verification-badge verified">💰 Saved ${exp.savings.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                    {isVerified && !isAIPurchased && (
                      <div className="verification-badges">
                        {verificationStatus === 'verified' && (
                          <span className="verification-badge verified">✅ Verified ({exp.verification_confidence}%)</span>
                        )}
                        {verificationStatus === 'warning' && (
                          <span className="verification-badge warning">⚠️ Warning ({exp.verification_confidence}%)</span>
                        )}
                        {verificationStatus === 'suspicious' && (
                          <span className="verification-badge suspicious">🚨 Suspicious ({exp.verification_confidence}%)</span>
                        )}
                        {exp.filename && (
                          <span className="receipt-filename" title={exp.filename}>📄 {exp.filename.length > 20 ? exp.filename.substring(0, 20) + '...' : exp.filename}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="expense-amount" style={{ fontSize: '1.375rem' }}>-${exp.amount.toFixed(2)}</span>
                  <button 
                    className="expense-delete-x"
                    onClick={() => deleteExpense(actualIndex)}
                    title="Delete expense"
                    style={{ fontSize: '1.75rem' }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bulk Pay Modal */}
      {showBulkPayModal && (
        <div className="modal-overlay" onClick={() => setShowBulkPayModal(false)}>
          <div className="modal-content bulk-pay-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔥 Pay All Vendors</h2>
            <div className="modal-body">
              <div className="ai-check-section">
                <div className="ai-avatar">🤖</div>
                <div className="ai-message">
                  <strong>AI will:</strong>
                  <ul>
                    <li>✅ Verify approved budget</li>
                    <li>✅ Confirm all vendor amounts</li>
                    <li>✅ Send payments via Interac (from wallet)</li>
                    <li>✅ Log all transactions</li>
                  </ul>
                </div>
              </div>
              
              <div className="pending-vendors">
                <h3>Pending Vendor Payments:</h3>
                {data.expenses && data.expenses.filter(exp => exp.status === 'pending').map((exp, idx) => (
                  <div key={idx} className="vendor-item">
                    <span className="vendor-name">{exp.vendor_name || 'Unknown Vendor'}</span>
                    <span className="vendor-category">{categoryIcons[exp.category]} {exp.category}</span>
                    <span className="vendor-amount">${exp.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="vendor-total">
                  <strong>Total:</strong>
                  <strong>${data.expenses && data.expenses.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}</strong>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-btn-cancel"
                onClick={() => setShowBulkPayModal(false)}
                disabled={bulkPayLoading}
              >
                Cancel
              </button>
              <button 
                className="modal-btn-confirm"
                onClick={handleBulkPay}
                disabled={bulkPayLoading}
              >
                {bulkPayLoading ? "Processing..." : "💸 Confirm & Pay All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
