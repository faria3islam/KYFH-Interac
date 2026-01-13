from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from app.services.personal_shopper import PersonalShopperAI
from app.services.wallet_service import WalletService
from app.db.db import load_data, save_data

router = APIRouter()

class ShoppingPreferences(BaseModel):
    category: str = Field(..., description="Product category to search")
    optimize_for: Literal["cheapest", "closest", "best_rated", "balanced"] = Field("balanced", description="What to optimize for")
    student_discount: bool = Field(False, description="Require student discount")
    halal: bool = Field(False, description="Require halal certification")
    vegan: bool = Field(False, description="Require vegan options")
    ethical: bool = Field(False, description="Require ethical brands")
    max_price: Optional[float] = Field(None, description="Maximum price")
    max_distance: Optional[float] = Field(None, description="Maximum distance in km")

class PurchaseRequest(BaseModel):
    product_index: int = Field(..., ge=0, description="Index of product to purchase")
    category: str = Field(..., description="Product category")
    auto_add_expense: bool = Field(True, description="Automatically add to expenses")
    use_wallet: bool = Field(False, description="Pay with wallet balance")

@router.post("/shop/search")
def search_products(preferences: ShoppingPreferences):
    """
    AI Personal Shopper searches and ranks products based on preferences
    """
    try:
        # Set optimization weights based on preference
        pref_dict = preferences.dict()
        
        if preferences.optimize_for == "cheapest":
            pref_dict["price_weight"] = 0.7
            pref_dict["distance_weight"] = 0.1
            pref_dict["rating_weight"] = 0.1
            pref_dict["filters_weight"] = 0.1
        elif preferences.optimize_for == "closest":
            pref_dict["price_weight"] = 0.1
            pref_dict["distance_weight"] = 0.7
            pref_dict["rating_weight"] = 0.1
            pref_dict["filters_weight"] = 0.1
        elif preferences.optimize_for == "best_rated":
            pref_dict["price_weight"] = 0.1
            pref_dict["distance_weight"] = 0.1
            pref_dict["rating_weight"] = 0.7
            pref_dict["filters_weight"] = 0.1
        else:  # balanced
            pref_dict["price_weight"] = 0.4
            pref_dict["distance_weight"] = 0.3
            pref_dict["rating_weight"] = 0.2
            pref_dict["filters_weight"] = 0.1
        
        # AI searches and ranks products
        products = PersonalShopperAI.search_products(preferences.category, pref_dict)
        
        if not products:
            return {
                "status": "no_results",
                "message": "No products found matching your criteria. Try relaxing some filters.",
                "products": [],
                "comparison": None
            }
        
        # AI generates comparison report
        comparison = PersonalShopperAI.compare_options(products)
        
        return {
            "status": "success",
            "message": f"AI found {len(products)} options. Showing best matches first.",
            "products": products[:10],  # Top 10 results
            "comparison": comparison,
            "ai_recommendation": products[0] if products else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shop/purchase")
def make_purchase(request: PurchaseRequest):
    """
    AI Personal Shopper autonomously makes the purchase
    """
    try:
        # Get the search results (in production, store in session/cache)
        # For demo, re-run search with default preferences
        preferences = {
            "optimize_for": "balanced",
            "price_weight": 0.4,
            "distance_weight": 0.3,
            "rating_weight": 0.2,
            "filters_weight": 0.1
        }
        
        products = PersonalShopperAI.search_products(request.category, preferences)
        
        if not products or request.product_index >= len(products):
            raise HTTPException(status_code=400, detail="Invalid product selection")
        
        selected_product = products[request.product_index]
        
        # Check wallet balance if using wallet
        if request.use_wallet:
            data = load_data()
            if not data:
                raise HTTPException(status_code=400, detail="No budget created yet")
            
            # Initialize wallet if doesn't exist
            if "wallet" not in data:
                data["wallet"] = {"balance": 0.0, "transactions": []}
            
            wallet_balance = WalletService.get_balance(data["wallet"])
            if wallet_balance < selected_product["price"]:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient wallet balance. Balance: ${wallet_balance:.2f}, Required: ${selected_product['price']:.2f}"
                )
        
        # AI makes autonomous purchase
        purchase_result = PersonalShopperAI.make_autonomous_purchase(selected_product, preferences)
        
        # Deduct from wallet if using wallet payment
        if request.use_wallet:
            try:
                wallet_transaction = WalletService.deduct_funds(
                    data["wallet"],
                    purchase_result["final_price"],
                    f"AI Purchase: {purchase_result['product_name']} from {purchase_result['vendor']}",
                    "ai_purchase"
                )
                purchase_result["payment_method"] = "wallet"
                purchase_result["wallet_transaction_id"] = wallet_transaction["id"]
                purchase_result["wallet_balance_after"] = wallet_transaction["balance_after"]
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
        else:
            purchase_result["payment_method"] = "interac"
        
        # Auto-add to expenses if requested
        if request.auto_add_expense:
            data = load_data()
            
            if not data:
                raise HTTPException(status_code=400, detail="No budget created yet")
            
            amount = purchase_result["final_price"]
            category = request.category
            
            if category not in data.get("categories", {}):
                # Try to map to existing category
                category_map = {
                    "food": "food",
                    "venue": "venue",
                    "decor": "decor"
                }
                category = category_map.get(category, "misc")
            
            if amount > data["remaining"]:
                return {
                    **purchase_result,
                    "expense_added": False,
                    "warning": f"Purchase successful but not added to expenses: exceeds remaining budget (${data['remaining']:.2f})"
                }
            
            # Add expense
            expense_entry = {
                "amount": amount,
                "category": category,
                "ai_purchased": True,
                "purchase_id": purchase_result["purchase_id"],
                "vendor": purchase_result["vendor"],
                "product_name": purchase_result["product_name"],
                "original_price": purchase_result["original_price"],
                "savings": purchase_result["savings"],
                "ai_reasoning": purchase_result["ai_reasoning"]
            }
            
            data["expenses"].append(expense_entry)
            data["categories"][category] -= amount
            data["remaining"] -= amount
            
            # Save wallet changes if used
            if request.use_wallet:
                save_data(data)
            else:
                save_data(data)
            
            purchase_result["expense_added"] = True
            purchase_result["remaining_budget"] = data["remaining"]
        
        return purchase_result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shop/categories")
def get_shopping_categories():
    """
    Get available shopping categories
    """
    return {
        "categories": ["food", "venue", "decor", "misc"],
        "filters": [
            {"id": "student_discount", "name": "Student Discount", "type": "boolean"},
            {"id": "halal", "name": "Halal Certified", "type": "boolean"},
            {"id": "vegan", "name": "Vegan", "type": "boolean"},
            {"id": "ethical", "name": "Ethical Brands", "type": "boolean"}
        ],
        "optimize_options": [
            {"id": "balanced", "name": "🎯 Balanced (AI Recommended)", "description": "Best overall value"},
            {"id": "cheapest", "name": "💰 Cheapest", "description": "Lowest price"},
            {"id": "closest", "name": "📍 Closest", "description": "Nearest location"},
            {"id": "best_rated", "name": "⭐ Best Rated", "description": "Highest customer ratings"}
        ]
    }
