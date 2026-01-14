"""
Receipt & Bill Authentication Service
Simulates AI-powered receipt verification, text extraction, and fraud detection
"""
import re
import random
from typing import Dict, Any
from datetime import datetime

class ReceiptProcessor:
    """
    Prototype AI Receipt Processor
    In production, this would use OCR (Tesseract/AWS Textract) and ML models
    """
    
    # Common receipt patterns for text extraction (simplified for prototype)
    AMOUNT_PATTERNS = [
        r'total[:\s]+\$?(\d+\.?\d*)',
        r'amount[:\s]+\$?(\d+\.?\d*)',
        r'sum[:\s]+\$?(\d+\.?\d*)',
        r'\$(\d+\.?\d*)',
        r'(\d+\.\d{2})'
    ]
    
    # Suspicious keywords that might indicate fraud
    SUSPICIOUS_KEYWORDS = [
        'photocopy', 'duplicate', 'copy', 'edited', 'modified',
        'fake', 'sample', 'template', 'draft'
    ]
    
    @staticmethod
    def extract_amount_from_text(text: str) -> float:
        """
        Extract monetary amount from receipt text
        In production: Use trained ML model or advanced OCR
        """
        text_lower = text.lower()
        
        # Try each pattern
        for pattern in ReceiptProcessor.AMOUNT_PATTERNS:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            if matches:
                try:
                    amount = float(matches[0])
                    if 0.01 <= amount <= 100000:  # Reasonable bounds
                        return round(amount, 2)
                except ValueError:
                    continue
        
        return 0.0
    
    @staticmethod
    def detect_category_from_text(text: str) -> str:
        """
        Use AI to detect expense category from receipt content
        In production: Use NLP/classification model
        """
        text_lower = text.lower()
        
        # Simple keyword matching (prototype)
        category_keywords = {
            'food': ['restaurant', 'cafe', 'pizza', 'burger', 'coffee', 'food', 'grocery', 'lunch', 'dinner', 'breakfast'],
            'venue': ['venue', 'hall', 'rental', 'space', 'hotel', 'conference', 'room'],
            'decor': ['decor', 'decoration', 'flowers', 'balloon', 'banner', 'lighting'],
            'misc': ['misc', 'other', 'general', 'supply', 'office']
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        
        return 'misc'
    
    @staticmethod
    def verify_authenticity(text: str, filename: str) -> Dict[str, Any]:
        """
        AI-powered authenticity verification
        In production: Use image analysis, metadata check, ML fraud detection
        """
        text_lower = text.lower()
        filename_lower = filename.lower()
        
        # Check for suspicious keywords
        suspicious_flags = []
        for keyword in ReceiptProcessor.SUSPICIOUS_KEYWORDS:
            if keyword in text_lower or keyword in filename_lower:
                suspicious_flags.append(f"Contains '{keyword}'")
        
        # Check if amount is extracted (real receipts have amounts)
        amount = ReceiptProcessor.extract_amount_from_text(text)
        if amount == 0:
            suspicious_flags.append("No valid amount detected")
        
        # Check for unrealistic amounts
        if amount > 10000:
            suspicious_flags.append(f"Unusually high amount: ${amount}")
        
        # Simulated image quality check (in production: analyze actual image)
        # For prototype, randomly flag some as low quality
        quality_score = random.randint(60, 100)
        if quality_score < 70:
            suspicious_flags.append(f"Low image quality: {quality_score}%")
        
        # Determine verification status
        if len(suspicious_flags) >= 2:
            status = "suspicious"
            confidence = random.randint(30, 60)
        elif len(suspicious_flags) == 1:
            status = "warning"
            confidence = random.randint(65, 85)
        else:
            status = "verified"
            confidence = random.randint(85, 99)
        
        return {
            "status": status,
            "confidence": confidence,
            "quality_score": quality_score,
            "flags": suspicious_flags,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def process_receipt(text: str, filename: str, user_category: str = None) -> Dict[str, Any]:
        """
        Complete receipt processing pipeline
        """
        # Step 1: Verify authenticity
        verification = ReceiptProcessor.verify_authenticity(text, filename)
        
        # Step 2: Extract amount
        amount = ReceiptProcessor.extract_amount_from_text(text)
        
        # Step 3: Detect category (or use user-provided)
        ai_category = ReceiptProcessor.detect_category_from_text(text)
        final_category = user_category if user_category else ai_category
        
        return {
            "amount": amount,
            "category": final_category,
            "ai_suggested_category": ai_category,
            "verification": verification,
            "filename": filename,
            "processed_at": datetime.now().isoformat()
        }
