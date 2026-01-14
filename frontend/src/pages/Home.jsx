import { useState } from "react"
import { useNavigate } from "react-router-dom"
import BudgetForm from "../components/BudgetForm"
import Dashboard from "../components/Dashboard"
import Payments from "../components/Payments"
import PersonalShopper from "../components/PersonalShopper"
import Wallet from "../components/Wallet"
import "../components/BudgetForm.css"

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeView, setActiveView] = useState("dashboard")
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <div className="home-title-row">
            <div className="home-logo">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="home-title">KYFH Interac</h1>
            <button 
              className="logout-btn"
              onClick={() => navigate("/")}
              title="Logout"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
          <p className="home-subtitle">Autonomous AI Agent for Smart Shared Expense Management</p>
        </div>
        
        {/* View Toggle */}
        <div className="view-toggle">
          <button 
            className={`view-btn ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            📊 Budget Dashboard
          </button>
          <button 
            className={`view-btn ${activeView === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveView('wallet')}
          >
            👛 Wallet
          </button>
          <button 
            className={`view-btn ${activeView === 'shopper' ? 'active' : ''}`}
            onClick={() => setActiveView('shopper')}
          >
            🛒 AI Personal Shopper
          </button>
          <button 
            className={`view-btn ${activeView === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveView('payments')}
          >
            💸 Interac Payments
          </button>
        </div>
        
        {activeView === 'dashboard' ? (
          <>
            <BudgetForm onBudgetCreated={() => setRefreshKey(prev => prev + 1)} />
            <Dashboard refresh={refreshKey} />
          </>
        ) : activeView === 'wallet' ? (
          <Wallet key={refreshKey} />
        ) : activeView === 'shopper' ? (
          <PersonalShopper onPurchaseComplete={() => setRefreshKey(prev => prev + 1)} />
        ) : (
          <Payments />
        )}
      </div>
    </div>
  )
}