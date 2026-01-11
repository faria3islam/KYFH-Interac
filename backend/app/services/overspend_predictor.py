def predict_overspend(remaining, avg_rate):
    if remaining < avg_rate * 2:
        return "Warning: You may overspend soon."
    return "Budget looks stable."