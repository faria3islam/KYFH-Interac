import { useState } from "react"
import './PersonalShopper.css'

const API_URL = "/api"

export default function PersonalShopper({ onPurchaseComplete }) {
  const [category, setCategory] = useState("food")
  const [optimizeFor, setOptimizeFor] = useState("balanced")
  const [filters, setFilters] = useState({
    student_discount: false,
    halal: false,
    vegan: false,
    ethical: false
  })
  const [maxPrice, setMaxPrice] = useState("")
  const [maxDistance, setMaxDistance] = useState("")
  const [useWallet, setUseWallet] = useState(false)
  
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const [purchasing, setPurchasing] = useState(false)

  const handleSearch = async () => {
    setSearching(true)
    setResults(null)
    
    try {
      const response = await fetch(`${API_URL}/shop/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          optimize_for: optimizeFor,
          ...filters,
          max_price: maxPrice ? parseFloat(maxPrice) : null,
          max_distance: maxDistance ? parseFloat(maxDistance) : null
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Error searching products:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setSearching(false)
    }
  }

  const handlePurchase = async (productIndex) => {
    if (!confirm("AI will autonomously make this purchase. Continue?")) {
      return
    }
    
    setPurchasing(true)
    
    try {
      const response = await fetch(`${API_URL}/shop/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_index: productIndex,
          category,
          auto_add_expense: true,
          use_wallet: useWallet
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      let message = `✅ Purchase Successful!\n\n`
      message += `Product: ${result.product_name}\n`
      message += `Vendor: ${result.vendor}\n`
      message += `Price: $${result.final_price.toFixed(2)}\n`
      if (result.savings > 0) {
        message += `Savings: $${result.savings.toFixed(2)} 💰\n`
      }
      message += `Delivery: ${result.estimated_delivery}\n`
      message += `Purchase ID: ${result.purchase_id}\n\n`
      message += `AI Reasoning: ${result.ai_reasoning}`
      
      alert(message)
      
      if (onPurchaseComplete) onPurchaseComplete()
      setResults(null)
    } catch (error) {
      console.error("Error making purchase:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div className="personal-shopper-container">
      <div className="shopper-header">
        <div className="shopper-icon">🛒</div>
        <div className="shopper-title-section">
          <h2>AI Personal Shopper</h2>
          <p className="shopper-subtitle">Autonomous shopping agent finds, compares, and purchases for you</p>
        </div>
      </div>

      <div className="shopper-form">
        <div className="form-section">
          <h3>🎯 What are you looking for?</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select 
                className="shopper-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="food">🍽️ Food & Catering</option>
                <option value="venue">🏛️ Venue Rental</option>
                <option value="decor">🎨 Decorations</option>
                <option value="misc">✨ Supplies & Misc</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Optimize For</label>
              <select 
                className="shopper-select"
                value={optimizeFor}
                onChange={(e) => setOptimizeFor(e.target.value)}
              >
                <option value="balanced">🎯 Balanced (AI Recommended)</option>
                <option value="cheapest">💰 Cheapest Price</option>
                <option value="closest">📍 Closest Distance</option>
                <option value="best_rated">⭐ Best Rated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>⚙️ Filters & Preferences</h3>
          <div className="filters-grid">
            <label className="filter-checkbox">
              <input 
                type="checkbox"
                checked={filters.student_discount}
                onChange={(e) => setFilters({...filters, student_discount: e.target.checked})}
              />
              <span>🎓 Student Discount Required</span>
            </label>
            
            <label className="filter-checkbox">
              <input 
                type="checkbox"
                checked={filters.halal}
                onChange={(e) => setFilters({...filters, halal: e.target.checked})}
              />
              <span>🥩 Halal Certified</span>
            </label>
            
            <label className="filter-checkbox">
              <input 
                type="checkbox"
                checked={filters.vegan}
                onChange={(e) => setFilters({...filters, vegan: e.target.checked})}
              />
              <span>🌱 Vegan Options</span>
            </label>
            
            <label className="filter-checkbox">
              <input 
                type="checkbox"
                checked={filters.ethical}
                onChange={(e) => setFilters({...filters, ethical: e.target.checked})}
              />
              <span>♻️ Ethical Brands</span>
            </label>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Max Price ($)</label>
              <input 
                type="number"
                className="shopper-input"
                placeholder="No limit"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Max Distance (km)</label>
              <input 
                type="number"
                className="shopper-input"
                placeholder="No limit"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-row">
            <label className="filter-checkbox wallet-payment">
              <input 
                type="checkbox"
                checked={useWallet}
                onChange={(e) => setUseWallet(e.target.checked)}
              />
              <span>👛 Pay with Wallet Balance</span>
            </label>
          </div>
        </div>

        <button 
          className="search-btn"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? "🤖 AI Searching..." : "🔍 Let AI Find Best Options"}
        </button>
      </div>

      {results && (
        <div className="results-section">
          {results.status === "no_results" ? (
            <div className="no-results">
              <span className="no-results-icon">😞</span>
              <h3>No Results Found</h3>
              <p>{results.message}</p>
            </div>
          ) : (
            <>
              <div className="comparison-box">
                <h3>📊 AI Comparison Report</h3>
                <div className="comparison-grid">
                  <div className="comparison-card">
                    <div className="comparison-label">💰 Best Price</div>
                    <div className="comparison-value">{results.comparison.best_price.name}</div>
                    <div className="comparison-detail">${results.comparison.best_price.price.toFixed(2)}</div>
                  </div>
                  
                  <div className="comparison-card">
                    <div className="comparison-label">📍 Closest</div>
                    <div className="comparison-value">{results.comparison.closest.name}</div>
                    <div className="comparison-detail">{results.comparison.closest.distance} km</div>
                  </div>
                  
                  <div className="comparison-card">
                    <div className="comparison-label">⭐ Highest Rated</div>
                    <div className="comparison-value">{results.comparison.highest_rated.name}</div>
                    <div className="comparison-detail">{results.comparison.highest_rated.rating}/5.0</div>
                  </div>
                </div>
              </div>

              <div className="products-list">
                <h3>🤖 AI Recommendations (Best to Worst)</h3>
                {results.products.map((product, idx) => (
                  <div key={idx} className={`product-card ${idx === 0 ? 'ai-recommended' : ''}`}>
                    {idx === 0 && <div className="ai-badge-product">🤖 AI TOP PICK</div>}
                    
                    <div className="product-header">
                      <div className="product-info">
                        <h4>{product.name}</h4>
                        <p className="vendor">{product.vendor}</p>
                      </div>
                      <div className="product-score">
                        <div className="score-badge">AI Score: {product.ai_score}</div>
                      </div>
                    </div>
                    
                    <div className="product-details">
                      <div className="detail-item">
                        <span className="detail-label">💰 Price:</span>
                        <span className="detail-value">
                          ${product.discounted_price.toFixed(2)}
                          {product.savings > 0 && (
                            <span className="savings"> (Save ${product.savings.toFixed(2)}!)</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">📍 Distance:</span>
                        <span className="detail-value">{product.distance} km</span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">⭐ Rating:</span>
                        <span className="detail-value">{product.rating}/5.0</span>
                      </div>
                    </div>
                    
                    <div className="product-badges">
                      {product.student_discount && <span className="badge-sm">🎓 Student Discount</span>}
                      {product.halal && <span className="badge-sm">🥩 Halal</span>}
                      {product.vegan && <span className="badge-sm">🌱 Vegan</span>}
                      {product.ethical && <span className="badge-sm">♻️ Ethical</span>}
                    </div>
                    
                    <button 
                      className="purchase-btn"
                      onClick={() => handlePurchase(idx)}
                      disabled={purchasing}
                    >
                      {purchasing ? "Processing..." : "🤖 Let AI Purchase This"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
