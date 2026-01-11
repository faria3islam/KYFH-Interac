import BudgetForm from "../components/BudgetForm"
import Dashboard from "../components/Dashboard"

export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Shared Wallet</h1>
      <BudgetForm />
      <Dashboard />
    </div>
  )
}