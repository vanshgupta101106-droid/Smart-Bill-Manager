"""
OCR Service — Gemini AI Vision for high-accuracy bill extraction.
Falls back gracefully if API key is missing.
"""
import os
import re
import json
import io
from typing import Optional

try:
    import google.generativeai as genai
    from PIL import Image
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class OCRService:
    @staticmethod
    async def extract_from_bytes(file_bytes: bytes, file_ext: str) -> dict:
        """
        Extract bill data from raw file bytes using Gemini AI.
        This avoids all file-path issues by working directly with bytes.
        """
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key or not GENAI_AVAILABLE:
            print("[OCR] GEMINI_API_KEY not found or google-generativeai not installed.")
            return {
                "company": None,
                "amount": None,
                "date": None,
                "category": "Others",
                "ocr_text": "AI OCR requires GEMINI_API_KEY in .env",
                "ocr_confidence": "none"
            }

        try:
            # Masked debug print to verify key loading
            masked_key = f"{api_key[:6]}...{api_key[-4:]}" if api_key else "None"
            print(f"[OCR] Using Gemini API Key: {masked_key}")
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash')

            # Convert bytes to PIL Image
            img = Image.open(io.BytesIO(file_bytes))

            prompt = """Analyze this bill/receipt/invoice image carefully and extract:
{
  "company": "The merchant or company name (e.g. Amazon, Uber, etc.)",
  "amount": 1234.56,
  "date": "YYYY-MM-DD",
  "category": "Pick ONE: Electricity, Water, Shopping, Travel, Food, Medical, Education, Telecom, Rent, Insurance, Subscription, Others",
  "ocr_text": "All readable text on the document"
}
Rules:
- For amount, find the GRAND TOTAL or TOTAL PAYABLE (the final amount, not subtotals).
- Return ONLY valid JSON, no markdown.
- If a field cannot be determined, use null."""

            response = model.generate_content([prompt, img])
            response_text = response.text.strip()

            # Clean markdown code fences if present
            if response_text.startswith("```"):
                response_text = re.sub(r'^```\w*\n?', '', response_text)
                response_text = re.sub(r'\n?```$', '', response_text)

            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not json_match:
                print(f"[Gemini OCR] Could not find JSON in response: {response_text[:200]}")
                return {
                    "company": None, "amount": None, "date": None,
                    "category": "Others", "ocr_text": response_text[:1000],
                    "ocr_confidence": "low"
                }

            data = json.loads(json_match.group())

            company = data.get("company")
            amount = data.get("amount")
            date_val = data.get("date")
            category = data.get("category", "Others")

            # Validate amount
            if amount is not None:
                try:
                    amount = float(amount)
                except (ValueError, TypeError):
                    amount = None

            # Confidence scoring
            fields_found = sum(1 for x in [company, amount, date_val] if x is not None)
            confidence = "high" if fields_found >= 3 else "medium" if fields_found >= 2 else "low" if fields_found >= 1 else "none"

            print(f"[Gemini OCR] ✅ Extracted → Company: {company}, Amount: {amount}, Date: {date_val}, Category: {category}, Confidence: {confidence}")

            return {
                "company": company,
                "amount": amount,
                "date": date_val,
                "category": category if category in [
                    "Electricity", "Water", "Shopping", "Travel", "Food",
                    "Medical", "Education", "Telecom", "Rent", "Insurance",
                    "Subscription", "Others"
                ] else "Others",
                "ocr_text": data.get("ocr_text", response_text[:1000]),
                "ocr_confidence": confidence
            }

        except Exception as e:
            print(f"[Gemini OCR] ❌ Error: {e}")
            return {
                "company": None,
                "amount": None,
                "date": None,
                "category": "Others",
                "ocr_text": f"AI processing error: {str(e)}",
                "ocr_confidence": "none"
            }
