import json
import os
from pathlib import Path

FILE = "app/db/data.json"

def load_data():
    """Load data from JSON file with error handling"""
    try:
        if not os.path.exists(FILE):
            return {}
        with open(FILE, "r") as f:
            content = f.read().strip()
            if not content:
                return {}
            return json.loads(content)
    except json.JSONDecodeError:
        return {}
    except Exception as e:
        print(f"Error loading data: {e}")
        return {}

def save_data(data):
    """Save data to JSON file with error handling"""
    try:
        # Ensure directory exists
        Path(FILE).parent.mkdir(parents=True, exist_ok=True)
        with open(FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving data: {e}")
        raise