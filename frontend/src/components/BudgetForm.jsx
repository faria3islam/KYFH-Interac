import { useState } from "react"

export default function BudgetForm() {
  const [amount, setAmount] = useState("")

  const submitBudget = async () => {
    await fetch("http://localhost:8000/create-budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total_budget: Number(amount) })
    })
  }

  return (
    <div className="mb-6">
      <input
        className="border p-2 mr-2"
        placeholder="Enter total budget"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button className="bg-green-600 text-white px-4 py-2" onClick={submitBudget}>
        Create Budget
      </button>
    </div>
  )
}