import { useState, useEffect } from "react"
import './Payments.css'

const API_URL = "/api"

export default function Payments() {
  const [activeTab, setActiveTab] = useState("send")
  const [transactions, setTransactions] = useState([])
  const [requests, setRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  // Send transfer form
  const [sendForm, setSendForm] = useState({
    recipient_email: "",
    amount: "",
    message: "",
    security_question: "",
    security_answer: ""
  })

  // Request money form
  const [requestForm, setRequestForm] = useState({
    requester_email: "",
    amount: "",
    reason: ""
  })

  // Fetch transactions and suggestions
  const fetchData = async () => {
    try {
      const [txRes, suggestRes] = await Promise.all([
        fetch(`${API_URL}/transactions`),
        fetch(`${API_URL}/settlement-suggestions`)
      ])
      
      const txData = await txRes.json()
      const suggestData = await suggestRes.json()
      
      setTransactions(txData.transactions || [])
      setRequests(txData.money_requests || [])
      setSuggestions(suggestData.suggestions || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSendTransfer = async (e) => {
    e.preventDefault()
    
    if (!sendForm.recipient_email || !sendForm.amount || Number(sendForm.amount) <= 0) {
      alert("Please enter valid recipient email and amount")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/send-interac`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_email: sendForm.recipient_email,
          amount: Number(sendForm.amount),
          message: sendForm.message || undefined,
          security_question: sendForm.security_question || undefined,
          security_answer: sendForm.security_answer || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Transfer failed")
      }

      const result = await response.json()
      alert(result.message)
      
      setSendForm({
        recipient_email: "",
        amount: "",
        message: "",
        security_question: "",
        security_answer: ""
      })
      
      fetchData()
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestMoney = async (e) => {
    e.preventDefault()
    
    if (!requestForm.requester_email || !requestForm.amount || Number(requestForm.amount) <= 0) {
      alert("Please enter valid email and amount")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/request-money`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_email: requestForm.requester_email,
          amount: Number(requestForm.amount),
          reason: requestForm.reason || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Request failed")
      }

      const result = await response.json()
      alert(result.message)
      
      setRequestForm({
        requester_email: "",
        amount: "",
        reason: ""
      })
      
      fetchData()
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSettle = async (suggestion) => {
    const email = prompt(`Enter recipient email to settle ${suggestion.category} expenses ($${suggestion.suggested_split}):`)
    
    if (!email) return

    setLoading(true)
    try {
      // For demo, we'll settle the first expense in this category
      const response = await fetch(`${API_URL}/settle-expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_id: "0", // Simplified for demo
          recipient_email: email
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Settlement failed")
      }

      const result = await response.json()
      alert(result.message)
      fetchData()
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="payments-container">
      {/* Header */}
      <div className="payments-header">
        <div className="header-content">
          <div className="header-icon">💸</div>
          <div>
            <h1>Interac e-Transfer</h1>
            <p className="header-subtitle">Send money, request payments, and settle expenses</p>
          </div>
        </div>
      </div>

      {/* AI Settlement Suggestions */}
      {suggestions.length > 0 && (
        <div className="settlement-suggestions">
          <div className="suggestion-header">
            <div className="suggestion-title">
              <span className="ai-icon">🤖</span>
              <h2>AI Settlement Suggestions</h2>
            </div>
            <span className="suggestion-badge">{suggestions.length} suggestions</span>
          </div>
          
          <div className="suggestions-grid">
            {suggestions.map((sug, idx) => (
              <div key={idx} className="suggestion-card">
                <div className="suggestion-category">
                  <span className="category-emoji">
                    {sug.category === 'food' ? '🍽️' : sug.category === 'venue' ? '🏛️' : sug.category === 'decor' ? '🎨' : '✨'}
                  </span>
                  <span className="category-name">{sug.category}</span>
                </div>
                <div className="suggestion-amount">${sug.suggested_split.toFixed(2)}</div>
                <p className="suggestion-reason">{sug.reason}</p>
                <button 
                  className="settle-btn"
                  onClick={() => handleQuickSettle(sug)}
                  disabled={loading}
                >
                  Quick Settle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            📤 Send Money
          </button>
          <button 
            className={`tab ${activeTab === 'request' ? 'active' : ''}`}
            onClick={() => setActiveTab('request')}
          >
            📥 Request Money
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 History
          </button>
        </div>
      </div>

      {/* Send Money Tab */}
      {activeTab === 'send' && (
        <div className="tab-content">
          <form onSubmit={handleSendTransfer} className="transfer-form">
            <div className="form-group">
              <label>Recipient Email *</label>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={sendForm.recipient_email}
                onChange={(e) => setSendForm({...sendForm, recipient_email: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={sendForm.amount}
                onChange={(e) => setSendForm({...sendForm, amount: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Message (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Food expenses split"
                value={sendForm.message}
                onChange={(e) => setSendForm({...sendForm, message: e.target.value})}
              />
            </div>

            <div className="security-section">
              <h3>🔒 Security Question (Optional)</h3>
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  placeholder="e.g., What's our event name?"
                  value={sendForm.security_question}
                  onChange={(e) => setSendForm({...sendForm, security_question: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Answer</label>
                <input
                  type="text"
                  placeholder="Answer"
                  value={sendForm.security_answer}
                  onChange={(e) => setSendForm({...sendForm, security_answer: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Sending..." : `💸 Send Interac e-Transfer`}
            </button>
          </form>
        </div>
      )}

      {/* Request Money Tab */}
      {activeTab === 'request' && (
        <div className="tab-content">
          <form onSubmit={handleRequestMoney} className="transfer-form">
            <div className="form-group">
              <label>Request to (Email) *</label>
              <input
                type="email"
                placeholder="person@example.com"
                value={requestForm.requester_email}
                onChange={(e) => setRequestForm({...requestForm, requester_email: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={requestForm.amount}
                onChange={(e) => setRequestForm({...requestForm, amount: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Reason (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Your share of venue cost"
                value={requestForm.reason}
                onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Requesting..." : `📥 Request Money`}
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="tab-content">
          <div className="history-section">
            <h2>📤 Sent Transfers & Settlements</h2>
            {transactions.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.slice().reverse().map((tx, idx) => (
                  <div key={idx} className="transaction-item">
                    <div className="tx-icon">
                      {tx.type === 'settlement' ? '🤝' : '📤'}
                    </div>
                    <div className="tx-details">
                      <div className="tx-main">
                        <span className="tx-recipient">{tx.recipient}</span>
                        <span className="tx-amount">-${tx.amount.toFixed(2)}</span>
                      </div>
                      <div className="tx-meta">
                        <span className="tx-message">{tx.message}</span>
                        {tx.has_security && <span className="security-badge">🔒</span>}
                        <span className="tx-status completed">{tx.status}</span>
                      </div>
                      <div className="tx-time">{new Date(tx.timestamp).toLocaleString()}</div>
                      <div className="tx-id">ID: {tx.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="history-section">
            <h2>📥 Money Requests</h2>
            {requests.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>No requests yet</p>
              </div>
            ) : (
              <div className="transactions-list">
                {requests.slice().reverse().map((req, idx) => (
                  <div key={idx} className="transaction-item">
                    <div className="tx-icon">📥</div>
                    <div className="tx-details">
                      <div className="tx-main">
                        <span className="tx-recipient">{req.requester}</span>
                        <span className="tx-amount">${req.amount.toFixed(2)}</span>
                      </div>
                      <div className="tx-meta">
                        <span className="tx-message">{req.reason}</span>
                        <span className={`tx-status ${req.status}`}>{req.status}</span>
                      </div>
                      <div className="tx-time">{new Date(req.timestamp).toLocaleString()}</div>
                      <div className="tx-id">ID: {req.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
