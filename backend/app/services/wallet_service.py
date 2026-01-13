from datetime import datetime
from typing import Dict, List, Optional
import random
import string

class WalletService:
    """
    Internal wallet service - handles balance, transactions, and Interac payments
    """
    
    @staticmethod
    def generate_transaction_id() -> str:
        """Generate unique transaction ID"""
        return f"TXN-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"
    
    @staticmethod
    def get_balance(wallet_data: Dict) -> float:
        """Get current wallet balance"""
        return wallet_data.get("balance", 0.0)
    
    @staticmethod
    def add_funds(wallet_data: Dict, amount: float, payment_method: str = "interac_debit") -> Dict:
        """
        Add funds to wallet
        Returns transaction record
        """
        if amount <= 0:
            raise ValueError("Amount must be greater than 0")
        
        current_balance = wallet_data.get("balance", 0.0)
        new_balance = current_balance + amount
        
        transaction = {
            "id": WalletService.generate_transaction_id(),
            "type": "add_funds",
            "amount": amount,
            "balance_after": new_balance,
            "payment_method": payment_method,
            "timestamp": datetime.now().isoformat(),
            "status": "completed",
            "description": f"Added ${amount:.2f} to wallet via {payment_method}"
        }
        
        wallet_data["balance"] = new_balance
        
        if "transactions" not in wallet_data:
            wallet_data["transactions"] = []
        wallet_data["transactions"].append(transaction)
        
        return transaction
    
    @staticmethod
    def deduct_funds(wallet_data: Dict, amount: float, description: str, 
                     transaction_type: str = "purchase") -> Dict:
        """
        Deduct funds from wallet for a purchase
        Returns transaction record
        Raises ValueError if insufficient funds
        """
        if amount <= 0:
            raise ValueError("Amount must be greater than 0")
        
        current_balance = wallet_data.get("balance", 0.0)
        
        if current_balance < amount:
            raise ValueError(f"Insufficient funds. Balance: ${current_balance:.2f}, Required: ${amount:.2f}")
        
        new_balance = current_balance - amount
        
        transaction = {
            "id": WalletService.generate_transaction_id(),
            "type": transaction_type,
            "amount": -amount,  # Negative for deduction
            "balance_after": new_balance,
            "timestamp": datetime.now().isoformat(),
            "status": "completed",
            "description": description
        }
        
        wallet_data["balance"] = new_balance
        
        if "transactions" not in wallet_data:
            wallet_data["transactions"] = []
        wallet_data["transactions"].append(transaction)
        
        return transaction
    
    @staticmethod
    def get_transactions(wallet_data: Dict, limit: Optional[int] = None) -> List[Dict]:
        """
        Get wallet transaction history
        Optionally limit to recent N transactions
        """
        transactions = wallet_data.get("transactions", [])
        
        # Sort by timestamp (newest first)
        sorted_transactions = sorted(
            transactions,
            key=lambda x: x.get("timestamp", ""),
            reverse=True
        )
        
        if limit:
            return sorted_transactions[:limit]
        
        return sorted_transactions
    
    @staticmethod
    def get_wallet_stats(wallet_data: Dict) -> Dict:
        """Get wallet statistics"""
        transactions = wallet_data.get("transactions", [])
        
        total_added = sum(
            t["amount"] for t in transactions 
            if t.get("type") == "add_funds"
        )
        
        total_spent = abs(sum(
            t["amount"] for t in transactions 
            if t.get("type") in ["purchase", "ai_purchase", "expense"]
        ))
        
        return {
            "current_balance": wallet_data.get("balance", 0.0),
            "total_added": total_added,
            "total_spent": total_spent,
            "transaction_count": len(transactions)
        }
