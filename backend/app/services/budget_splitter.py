def split_budget(total):
    return {
        "food": total * 0.4,
        "venue": total * 0.3,
        "decor": total * 0.2,
        "misc": total * 0.1
    }