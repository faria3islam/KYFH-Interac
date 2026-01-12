def split_budget(total, historical_data=None):
    """
    Adaptive budget allocation using historical spending patterns.
    If historical data exists, AI learns and adjusts allocations.
    """
    # Default allocations
    default = {
        "food": 0.4,
        "venue": 0.3,
        "decor": 0.2,
        "misc": 0.1
    }
    
    # If we have historical spending data, adapt allocations
    if historical_data and len(historical_data) > 0:
        total_spent = sum(exp["amount"] for exp in historical_data)
        if total_spent > 0:
            # Calculate actual spending patterns
            category_spending = {}
            for exp in historical_data:
                cat = exp["category"]
                category_spending[cat] = category_spending.get(cat, 0) + exp["amount"]
            
            # Adaptive learning: blend historical patterns with defaults (70% history, 30% default)
            adapted = {}
            for cat in default.keys():
                historical_ratio = category_spending.get(cat, 0) / total_spent if total_spent > 0 else 0
                adapted[cat] = (0.7 * historical_ratio + 0.3 * default[cat])
            
            # Normalize to ensure sum is 1.0
            total_ratio = sum(adapted.values())
            if total_ratio > 0:
                adapted = {k: v/total_ratio for k, v in adapted.items()}
                return {k: total * v for k, v in adapted.items()}
    
    # Return default allocation
    return {k: total * v for k, v in default.items()}