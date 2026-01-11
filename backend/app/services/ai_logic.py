def generate_feedback(data):
    if data["remaining"] < data["total_budget"] * 0.2:
        return "You're running low on funds. Consider reducing expenses."
    return "Budget is healthy."