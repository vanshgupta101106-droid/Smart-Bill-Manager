import random

class OCRService:
    @staticmethod
    async def extract_data(file_path: str):
        """
        In a real production app, this would use Google Vision, AWS Textract, or Tesseract.
        For now, we simulate the 'Auto-detect' feature to demonstrate the workflow.
        """
        # Simulated extraction results
        companies = ["Amazon", "Flipkart", "BSES Electricity", "Water Corp", "Uber", "Zomato"]
        categories = ["Shopping", "Shopping", "Electricity", "Water", "Travel", "Food"]
        
        idx = random.randint(0, len(companies) - 1)
        
        return {
            "company": companies[idx],
            "amount": round(random.uniform(500, 5000), 2),
            "date": "2024-03-10", # Mocked date
            "category": categories[idx]
        }
