import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../components/BudgetForm.css"

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      alert("Please enter both username and password")
      return
    }
    
    // For now, accept any credentials
    navigate("/home")
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #faf5ff 0%, #ffffff 50%, #faf5ff 100%)",
      padding: "2rem"
    }}>
      <div style={{
        background: "white",
        padding: "3rem",
        borderRadius: "16px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        textAlign: "center",
        maxWidth: "400px",
        width: "100%"
      }}>
        <div style={{ marginBottom: "2rem" }}>
          <div className="home-logo" style={{ margin: "0 auto 1rem" }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="home-title" style={{ marginBottom: "0.5rem" }}>KYFH Interac</h1>
          <p style={{ color: "#6b7280", fontSize: "1.125rem", marginBottom: "0.5rem" }}>AI-Powered Shared Wallet</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ textAlign: "left" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.875rem", 
              fontWeight: "600", 
              color: "#374151", 
              marginBottom: "0.5rem" 
            }}>
              Username
            </label>
            <input
              className="budget-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          
          <div style={{ textAlign: "left" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.875rem", 
              fontWeight: "600", 
              color: "#374151", 
              marginBottom: "0.5rem" 
            }}>
              Password
            </label>
            <input
              className="budget-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          
          <button
            type="submit"
            className="budget-submit-btn"
            style={{ width: "100%", fontSize: "1.125rem", padding: "1rem 2rem", marginTop: "0.5rem" }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}