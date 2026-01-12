import { useEffect, useState } from "react"
import './Dashboard.css'

// Use /api prefix which Vite will proxy to backend
const API_URL = "/api"

export default function Dashboard({ refresh }) {
  const [data, setData] = useState(null)
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("food")
  const [loading, setLoading] = useState(true)
  const [showReallocationModal, setShowReallocationModal] = useState(false)
  const [reallocation, setReallocation] = useState({ from: "food", to: "venue", amount: "" })

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
          category: expenseCategory 
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `HTTP error! status: ${response.status}`)
      }
      
      setExpenseAmount("")
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
            placeholder="Enter amount"
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
          <h2>Recent Expenses</h2>
          <div className="expenses-list">
            {data.expenses.slice(-10).reverse().map((exp, idx) => {
              const actualIndex = data.expenses.length - 1 - idx
              return (
                <div 
                  key={idx} 
                  className="expense-item"
                  style={{
                    padding: '1.75rem 2rem',
                    gap: '2.5rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  <span className="expense-icon" style={{ fontSize: '2.25rem' }}>{categoryIcons[exp.category] || '📦'}</span>
                  <span className="expense-category" style={{ fontSize: '1.125rem' }}>{exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}</span>
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
    </div>
  )
}
