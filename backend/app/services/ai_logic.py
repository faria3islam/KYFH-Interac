from app.services.agentic_ai import AgenticAI

def generate_feedback(data):
    """Generate AI feedback using the agentic AI engine"""
    return AgenticAI.get_intelligent_feedback(data)

def get_ai_recommendations(data):
    """Get autonomous AI recommendations"""
    return AgenticAI.generate_autonomous_recommendations(data)