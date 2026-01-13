"""
Personal Shopper AI - Agentic Shopping Assistant
Finds best options, compares prices, and makes autonomous purchasing decisions
"""
import random
from typing import List, Dict, Any, Optional
from datetime import datetime

class PersonalShopperAI:
    """
    Autonomous AI shopping agent that researches products and makes purchase decisions
    In production: Connect to real vendor APIs, price comparison services
    """
    
    # Simulated product database (in production: real-time API calls)
    PRODUCT_DATABASE = {
        "food": [
            {"name": "Pizza Combo", "vendor": "Pizza Palace", "price": 25.99, "distance": 2.3, "rating": 4.5, "student_discount": True, "halal": False, "vegan": False, "ethical": True},
            {"name": "Veggie Pizza", "vendor": "Green Slice", "price": 22.50, "distance": 3.1, "rating": 4.7, "student_discount": False, "halal": True, "vegan": True, "ethical": True},
            {"name": "Meat Lovers Pizza", "vendor": "Quick Bite", "price": 18.99, "distance": 1.5, "rating": 4.2, "student_discount": True, "halal": True, "vegan": False, "ethical": False},
            {"name": "Gourmet Pizza", "vendor": "Artisan Kitchen", "price": 32.00, "distance": 4.0, "rating": 4.9, "student_discount": False, "halal": False, "vegan": False, "ethical": True},
            {"name": "Grocery Bundle", "vendor": "Fresh Mart", "price": 45.00, "distance": 1.0, "rating": 4.3, "student_discount": True, "halal": True, "vegan": True, "ethical": True},
        ],
        "venue": [
            {"name": "Community Hall", "vendor": "City Events", "price": 150.00, "distance": 2.0, "rating": 4.4, "student_discount": True, "halal": True, "vegan": True, "ethical": True},
            {"name": "Modern Conference Room", "vendor": "Business Center", "price": 200.00, "distance": 5.0, "rating": 4.6, "student_discount": False, "halal": True, "vegan": True, "ethical": True},
            {"name": "Outdoor Space", "vendor": "Park Services", "price": 80.00, "distance": 3.5, "rating": 4.1, "student_discount": True, "halal": True, "vegan": True, "ethical": True},
        ],
        "decor": [
            {"name": "Balloon Package", "vendor": "Party Plus", "price": 35.00, "distance": 2.5, "rating": 4.3, "student_discount": True, "halal": True, "vegan": True, "ethical": False},
            {"name": "Premium Decorations", "vendor": "Elegant Affairs", "price": 65.00, "distance": 4.5, "rating": 4.8, "student_discount": False, "halal": True, "vegan": True, "ethical": True},
            {"name": "Budget Decor Set", "vendor": "ValueDecorations", "price": 25.00, "distance": 1.2, "rating": 3.9, "student_discount": True, "halal": True, "vegan": True, "ethical": False},
        ],
        "misc": [
            {"name": "Supplies Bundle", "vendor": "Office Depot", "price": 30.00, "distance": 2.0, "rating": 4.5, "student_discount": True, "halal": True, "vegan": True, "ethical": True},
            {"name": "Tech Equipment Rental", "vendor": "TechRent", "price": 75.00, "distance": 3.0, "rating": 4.7, "student_discount": True, "halal": True, "vegan": True, "ethical": True},
        ]
    }
    
    @staticmethod
    def calculate_score(product: Dict, preferences: Dict) -> float:
        """
        AI scoring algorithm - weighs multiple factors based on user preferences
        """
        score = 0
        weights = {
            "price": preferences.get("price_weight", 0.4),
            "distance": preferences.get("distance_weight", 0.3),
            "rating": preferences.get("rating_weight", 0.2),
            "filters": preferences.get("filters_weight", 0.1)
        }
        
        # Price score (lower is better, normalized to 0-100)
        max_price = preferences.get("max_price") or 100
        price_score = max(0, 100 - (product["price"] / max_price * 100))
        score += price_score * weights["price"]
        
        # Distance score (closer is better, normalized to 0-100)
        max_distance = preferences.get("max_distance") or 10
        distance_score = max(0, 100 - (product["distance"] / max_distance * 100))
        score += distance_score * weights["distance"]
        
        # Rating score (higher is better)
        rating_score = (product["rating"] / 5.0) * 100
        score += rating_score * weights["rating"]
        
        # Filter match score
        filter_score = 100
        if preferences.get("student_discount") and not product["student_discount"]:
            filter_score -= 30
        if preferences.get("halal") and not product["halal"]:
            filter_score -= 40
        if preferences.get("vegan") and not product["vegan"]:
            filter_score -= 40
        if preferences.get("ethical") and not product["ethical"]:
            filter_score -= 25
        
        score += max(0, filter_score) * weights["filters"]
        
        return round(score, 2)
    
    @staticmethod
    def search_products(category: str, preferences: Dict) -> List[Dict]:
        """
        AI searches and ranks products based on user preferences
        """
        products = PersonalShopperAI.PRODUCT_DATABASE.get(category, [])
        
        # Apply hard filters first
        filtered_products = []
        for product in products:
            # Check mandatory filters
            if preferences.get("student_discount") and not product["student_discount"]:
                continue
            if preferences.get("halal") and not product["halal"]:
                continue
            if preferences.get("vegan") and not product["vegan"]:
                continue
            if preferences.get("ethical") and not product["ethical"]:
                continue
            if preferences.get("max_price") and product["price"] > preferences["max_price"]:
                continue
            if preferences.get("max_distance") and product["distance"] > preferences["max_distance"]:
                continue
            
            filtered_products.append(product)
        
        # Calculate AI scores for each product
        scored_products = []
        for product in filtered_products:
            score = PersonalShopperAI.calculate_score(product, preferences)
            product_with_score = product.copy()
            product_with_score["ai_score"] = score
            
            # Calculate savings
            if product["student_discount"] and preferences.get("student_discount"):
                discount = product["price"] * 0.15  # 15% student discount
                product_with_score["discounted_price"] = product["price"] - discount
                product_with_score["savings"] = discount
            else:
                product_with_score["discounted_price"] = product["price"]
                product_with_score["savings"] = 0
            
            scored_products.append(product_with_score)
        
        # Sort by AI score (highest first)
        scored_products.sort(key=lambda x: x["ai_score"], reverse=True)
        
        return scored_products
    
    @staticmethod
    def make_autonomous_purchase(product: Dict, preferences: Dict) -> Dict[str, Any]:
        """
        AI autonomously executes the purchase
        In production: Connect to vendor APIs, payment gateways
        """
        # Simulate purchase process
        purchase_id = f"PUR-{random.randint(10000, 99999)}"
        
        final_price = product.get("discounted_price", product["price"])
        
        # Simulate processing time and confirmation
        purchase_result = {
            "purchase_id": purchase_id,
            "status": "completed",
            "product_name": product["name"],
            "vendor": product["vendor"],
            "original_price": product["price"],
            "final_price": final_price,
            "savings": product.get("savings", 0),
            "estimated_delivery": f"{product['distance'] * 15} minutes" if product['distance'] < 5 else "1-2 hours",
            "payment_method": "Budget Account",
            "timestamp": datetime.now().isoformat(),
            "ai_reasoning": PersonalShopperAI.generate_reasoning(product, preferences)
        }
        
        return purchase_result
    
    @staticmethod
    def generate_reasoning(product: Dict, preferences: Dict) -> str:
        """
        AI explains its purchase decision
        """
        reasons = []
        
        if preferences.get("optimize_for") == "cheapest":
            reasons.append(f"Lowest price option at ${product.get('discounted_price', product['price']):.2f}")
        elif preferences.get("optimize_for") == "closest":
            reasons.append(f"Closest option at {product['distance']} km away")
        elif preferences.get("optimize_for") == "best_rated":
            reasons.append(f"Highest rated option ({product['rating']}/5.0 stars)")
        
        if product.get("savings", 0) > 0:
            reasons.append(f"Saved ${product['savings']:.2f} with student discount")
        
        if preferences.get("ethical") and product["ethical"]:
            reasons.append("Ethical brand as requested")
        
        if preferences.get("vegan") and product["vegan"]:
            reasons.append("Vegan-friendly option")
        
        if preferences.get("halal") and product["halal"]:
            reasons.append("Halal-certified")
        
        if product["rating"] >= 4.5:
            reasons.append(f"Excellent customer reviews ({product['rating']}/5.0)")
        
        return " • ".join(reasons) if reasons else "Best match for your preferences"
    
    @staticmethod
    def compare_options(products: List[Dict]) -> Dict[str, Any]:
        """
        AI generates comparison report
        """
        if not products:
            return {"message": "No products found matching your criteria"}
        
        best_price = min(products, key=lambda x: x.get("discounted_price", x["price"]))
        best_distance = min(products, key=lambda x: x["distance"])
        best_rating = max(products, key=lambda x: x["rating"])
        best_overall = products[0]  # Already sorted by AI score
        
        return {
            "total_options": len(products),
            "best_price": {
                "name": best_price["name"],
                "vendor": best_price["vendor"],
                "price": best_price.get("discounted_price", best_price["price"])
            },
            "closest": {
                "name": best_distance["name"],
                "vendor": best_distance["vendor"],
                "distance": best_distance["distance"]
            },
            "highest_rated": {
                "name": best_rating["name"],
                "vendor": best_rating["vendor"],
                "rating": best_rating["rating"]
            },
            "ai_recommendation": {
                "name": best_overall["name"],
                "vendor": best_overall["vendor"],
                "price": best_overall.get("discounted_price", best_overall["price"]),
                "score": best_overall["ai_score"],
                "reasoning": PersonalShopperAI.generate_reasoning(best_overall, {})
            }
        }
