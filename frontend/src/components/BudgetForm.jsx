import { useState } from "react"
import './BudgetForm.css'

// Use /api prefix which Vite will proxy to backend
const API_URL = "/api"

export default function BudgetForm({ onBudgetCreated }) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const submitBudget = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid budget amount")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/create-budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_budget: Number(amount) })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      alert("Budget created successfully!")
      setAmount("")
      if (onBudgetCreated) onBudgetCreated()
    } catch (error) {
      console.error("Error creating budget:", error)
      alert(`Error creating budget: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="budget-form-container">
      <div className="budget-form-header">
        <div className="budget-form-icon">💰</div>
        <h2>Create Budget</h2>
      </div>
      <div className="budget-form-inputs">
        <input
          className="budget-input"
          placeholder="Enter total budget ($)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button 
          className="budget-submit-btn" 
          onClick={submitBudget}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Budget"}
        </button>
      </div>
    </div>
  )
}