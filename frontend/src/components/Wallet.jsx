import { useState, useEffect } from "react"
import "./Wallet.css"

const API_URL = "/api"

export default function Wallet() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState(null)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("interac_debit")
  const [loading, setLoading] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      // Fetch balance
      const balanceRes = await fetch(`${API_URL}/wallet/balance`)
      const balanceData = await balanceRes.json()
      setBalance(balanceData.balance)

      // Fetch stats
      const statsRes = await fetch(`${API_URL}/wallet/stats`)
      const statsData = await statsRes.json()
      setStats(statsData)

      // Fetch transactions
      const txRes = await fetch(`${API_URL}/wallet/transactions?limit=20`)
      const txData = await txRes.json()
      setTransactions(txData.transactions || [])
    } catch (error) {
      console.error("Error fetching wallet data:", error)
    }
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    
    const addAmount = parseFloat(amount)
    if (!addAmount || addAmount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/wallet/add-funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: addAmount,
          payment_method: paymentMethod
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to add funds")
      }

      const result = await response.json()
      alert(result.message)
      setAmount("")
      fetchWalletData() // Refresh wallet data
    } catch (error) {
      console.error("Error adding funds:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case "add_funds":
        return "💰"
      case "ai_purchase":
        return "🤖"
      case "purchase":
        return "🛒"
      case "expense":
        return "💸"
      default:
        return "📝"
    }
  }

  return (
    <div className="wallet-container">
      {/* Balance Card */}
      <div className="wallet-balance-card">
        <div className="balance-header">
          <div className="balance-icon">👛</div>
          <h2>Wallet Balance</h2>
        </div>
        <div className="balance-amount">{formatCurrency(balance)}</div>
        
        {stats && (
          <div className="balance-stats">
            <div className="stat-item">
              <span className="stat-label">Total Added</span>
              <span className="stat-value">{formatCurrency(stats.total_added)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">{formatCurrency(stats.total_spent)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Transactions</span>
              <span className="stat-value">{stats.transaction_count}</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Funds Form */}
      <div className="wallet-add-funds">
        <h3>💳 Add Funds</h3>
        <form onSubmit={handleAddFunds}>
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="wallet-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="wallet-select"
            >
              <option value="interac_debit">💳 Interac Debit</option>
              <option value="interac_online">🌐 Interac Online</option>
              <option value="interac_transfer">📲 Interac e-Transfer</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="wallet-btn-primary"
            disabled={loading}
          >
            {loading ? "Processing..." : "Add Funds"}
          </button>
        </form>
      </div>

      {/* Transaction History */}
      <div className="wallet-transactions">
        <div 
          className="transactions-header"
          onClick={() => setShowTransactions(!showTransactions)}
        >
          <h3>📋 Transaction History</h3>
          <span className="toggle-icon">{showTransactions ? "▼" : "▶"}</span>
        </div>

        {showTransactions && (
          <div className="transactions-list">
            {transactions.length === 0 ? (
              <div className="no-transactions">No transactions yet</div>
            ) : (
              transactions.map((tx, index) => (
                <div key={index} className="transaction-item">
                  <div className="tx-icon">{getTransactionIcon(tx.type)}</div>
                  <div className="tx-details">
                    <div className="tx-description">{tx.description}</div>
                    <div className="tx-date">{formatDate(tx.timestamp)}</div>
                  </div>
                  <div className="tx-amount-section">
                    <div className={`tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </div>
                    <div className="tx-balance">Balance: {formatCurrency(tx.balance_after)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="wallet-info">
        <div className="info-icon">ℹ️</div>
        <div className="info-text">
          <strong>KYFH Interac Wallet</strong>
          <p>Add funds via Interac once, use for all purchases. AI Personal Shopper can automatically use your wallet balance. Secure and convenient!</p>
        </div>
      </div>
    </div>
  )
}
