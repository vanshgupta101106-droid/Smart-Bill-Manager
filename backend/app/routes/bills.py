from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
from app.database import get_database
from app.schemas.bill import BillResponse, BillCreate
from app.services.storage_service import StorageService
from app.services.ocr_service import OCRService
from datetime import datetime
from uuid import uuid4

router = APIRouter(prefix="/bills", tags=["Bills"])

@router.post("/upload", response_model=BillResponse)
async def upload_bill(
    file: UploadFile = File(None),
    amount: Optional[float] = Form(None),
    category: str = Form("Others"),
    company: str = Form(None),
    date: str = Form(None)
):
    # 1. Save file if provided
    filename = None
    file_url = None
    
    if file:
        filename, file_url = await StorageService.upload_file(file)
    
    # 2. Run OCR if details are missing
    # 2. Run OCR if details are missing AND a file was uploaded
    if (not amount or not company) and filename:
        # Pass the filename or path to OCR
        ocr_data = await OCRService.extract_data(filename)
        amount = amount or ocr_data["amount"]
        company = company or ocr_data["company"]
        category = category or (ocr_data["category"] if category == "Others" else category)
        date = date or ocr_data["date"]
    
    # Defaults for manual entries
    amount = amount or 0.0
    company = company or "Unknown Merchant"
    date = date or datetime.now().strftime("%Y-%m-%d")
    
    bill_data = {
        "_id": str(uuid4()),
        "filename": filename,
        "file_url": file_url,
        "amount": amount,
        "category": category,
        "company": company,
        "date": date,
        "upload_time": datetime.now()
    }
    
    # 3. Save to MongoDB
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=503, 
            detail="Database not connected. Please check if your MongoDB service is running."
        )
    
    print(f"DEBUG: Attempting to save bill data: {bill_data}")
    
    await db.bills.insert_one(bill_data)
    
    return bill_data

@router.get("/", response_model=List[BillResponse])
async def list_bills():
    db = get_database()
    bills = await db.bills.find().to_list(100)
    return bills

@router.delete("/{bill_id}")
async def delete_bill(bill_id: str):
    db = get_database()
    bill = await db.bills.find_one({"_id": bill_id})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Delete file
    await StorageService.delete_file(bill["filename"])
    
    # Delete from DB
    await db.bills.delete_one({"_id": bill_id})
    
    return {"message": "Bill deleted successfully"}
