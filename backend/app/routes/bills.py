from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.database import get_database
from app.schemas.bill import BillResponse, BillCreate, BillUpdate, AnalyticsResponse
from app.services.storage_service import StorageService
from app.services.ocr_service import OCRService
from datetime import datetime
from uuid import uuid4
from collections import defaultdict
import csv
import io
import os
from app.auth import get_current_user

router = APIRouter(prefix="/bills", tags=["Bills"])

# ─── Categories ────────────────────────────────────────────────
CATEGORIES = [
    "Electricity", "Water", "Shopping", "Travel", "Food",
    "Medical", "Education", "Telecom", "Rent", "Insurance",
    "Subscription", "Others"
]


@router.get("/categories")
async def get_categories():
    """Return all available bill categories."""
    return CATEGORIES


# ─── Upload Bill ───────────────────────────────────────────────
@router.post("/upload", response_model=BillResponse)
async def upload_bill(
    file: UploadFile = File(None),
    amount: Optional[float] = Form(None),
    category: str = Form("Others"),
    company: str = Form(None),
    date: str = Form(None),
    notes: str = Form(None),
    current_user: str = Depends(get_current_user),
):
    """Upload a bill with optional file. Runs AI OCR if file provided and details missing."""
    filename = None
    file_url = None
    ocr_text = ""
    ocr_confidence = "none"

    if file and file.filename:
        # 1. Read file bytes ONCE (avoids stream-consumed issues)
        file_bytes = await file.read()
        file_ext = os.path.splitext(file.filename)[1].lower()

        # 2. Run AI OCR on raw bytes FIRST (before upload consumes anything)
        if not amount or not company:
            ocr_data = await OCRService.extract_from_bytes(file_bytes, file_ext)
            amount = amount or ocr_data.get("amount")
            company = company or ocr_data.get("company")
            if category == "Others" and ocr_data.get("category") and ocr_data["category"] != "Others":
                category = ocr_data["category"]
            date = date or ocr_data.get("date")
            ocr_text = ocr_data.get("ocr_text", "")
            ocr_confidence = ocr_data.get("ocr_confidence", "none")

        # 3. Upload to cloud/local storage
        filename, file_url = await StorageService.upload_file(file_bytes, file.filename)

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
        "notes": notes or "",
        "upload_time": datetime.now(),
        "ocr_text": ocr_text,
        "ocr_confidence": ocr_confidence,
        "user_id": current_user,
    }

    # 3. Save to MongoDB
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Database not connected. Please check if your MongoDB service is running."
        )

    await db.bills.insert_one(bill_data)
    return bill_data


# ─── List & Search Bills ──────────────────────────────────────
@router.get("/", response_model=List[BillResponse])
async def list_bills(
    search: Optional[str] = Query(None, description="Search in company name or OCR text"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_amount: Optional[float] = Query(None, description="Minimum amount"),
    max_amount: Optional[float] = Query(None, description="Maximum amount"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    sort_by: Optional[str] = Query("upload_time", description="Sort field: amount, date, upload_time, company"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    limit: int = Query(500, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    current_user: str = Depends(get_current_user),
):
    """
    Advanced bill listing with search, filters, sorting, and pagination.
    The search parameter does a text search across company name and OCR text.
    """
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected.")

    # Build MongoDB query
    query = {"user_id": current_user}

    if search:
        query["$or"] = [
            {"company": {"$regex": search, "$options": "i"}},
            {"ocr_text": {"$regex": search, "$options": "i"}},
            {"notes": {"$regex": search, "$options": "i"}},
        ]

    if category and category != "All":
        query["category"] = category

    if min_amount is not None or max_amount is not None:
        amount_query = {}
        if min_amount is not None:
            amount_query["$gte"] = min_amount
        if max_amount is not None:
            amount_query["$lte"] = max_amount
        query["amount"] = amount_query

    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["date"] = date_query

    # Sort direction
    sort_dir = -1 if sort_order == "desc" else 1

    # Map sort field
    sort_field_map = {
        "amount": "amount",
        "date": "date",
        "upload_time": "upload_time",
        "company": "company",
    }
    sort_field = sort_field_map.get(sort_by, "upload_time")

    cursor = db.bills.find(query).sort(sort_field, sort_dir).skip(skip).limit(limit)
    bills = await cursor.to_list(limit)
    return bills


# ─── Get Single Bill ──────────────────────────────────────────
@router.get("/{bill_id}", response_model=BillResponse)
async def get_bill(bill_id: str, current_user: str = Depends(get_current_user)):
    """Get a single bill by its ID, ensuring it belongs to the authenticated user."""
    db = get_database()
    bill = await db.bills.find_one({"_id": bill_id, "user_id": current_user})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found or access denied")
    return bill


# ─── Update Bill ──────────────────────────────────────────────
@router.put("/{bill_id}", response_model=BillResponse)
async def update_bill(bill_id: str, bill_update: BillUpdate, current_user: str = Depends(get_current_user)):
    """Update bill details, ensuring the bill belongs to the authenticated user."""
    db = get_database()
    # Check if bill exists and belongs to user
    bill = await db.bills.find_one({"_id": bill_id, "user_id": current_user})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found or access denied")

    update_data = {k: v for k, v in bill_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db.bills.update_one({"_id": bill_id}, {"$set": update_data})

    updated_bill = await db.bills.find_one({"_id": bill_id})
    return updated_bill


# ─── Delete Bill ──────────────────────────────────────────────
@router.delete("/{bill_id}")
async def delete_bill(bill_id: str, current_user: str = Depends(get_current_user)):
    """Delete a bill, ensuring it belongs to the authenticated user."""
    db = get_database()
    bill = await db.bills.find_one({"_id": bill_id, "user_id": current_user})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found or access denied")

    # Delete file if exists
    if bill.get("filename"):
        await StorageService.delete_file(bill["filename"])

    await db.bills.delete_one({"_id": bill_id})
    return {"message": "Bill deleted successfully"}


# ─── Analytics ────────────────────────────────────────────────
@router.get("/analytics/overview", response_model=AnalyticsResponse)
async def get_analytics(current_user: str = Depends(get_current_user)):
    """
    Get comprehensive spending analytics for the authenticated user:
    - Total bills & amount
    - Category breakdown
    - Monthly spending trend
    - Top merchants
    - Highest/lowest bills
    """
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected.")

    bills = await db.bills.find({"user_id": current_user}).to_list(5000)

    if not bills:
        return AnalyticsResponse(
            total_bills=0,
            total_amount=0,
            average_amount=0,
            category_breakdown={},
            monthly_spending={},
            top_merchants=[],
            highest_bill=None,
            lowest_bill=None,
        )

    total_amount = sum(float(b.get("amount", 0)) for b in bills)
    avg_amount = total_amount / len(bills) if bills else 0

    # Category breakdown
    cat_totals = defaultdict(float)
    cat_counts = defaultdict(int)
    for b in bills:
        cat = b.get("category", "Others")
        cat_totals[cat] += float(b.get("amount", 0))
        cat_counts[cat] += 1

    category_breakdown = {
        cat: {"total": round(cat_totals[cat], 2), "count": cat_counts[cat]}
        for cat in cat_totals
    }

    # Monthly spending
    monthly = defaultdict(float)
    for b in bills:
        date_str = b.get("date", "")
        if date_str and len(date_str) >= 7:
            month_key = date_str[:7]  # YYYY-MM
            monthly[month_key] += float(b.get("amount", 0))

    monthly_spending = {k: round(v, 2) for k, v in sorted(monthly.items())}

    # Top merchants
    merchant_totals = defaultdict(lambda: {"total": 0, "count": 0})
    for b in bills:
        merchant = b.get("company", "Unknown")
        merchant_totals[merchant]["total"] += float(b.get("amount", 0))
        merchant_totals[merchant]["count"] += 1

    top_merchants = sorted(
        [{"name": k, **v} for k, v in merchant_totals.items()],
        key=lambda x: x["total"],
        reverse=True
    )[:10]

    # Highest and lowest bills
    sorted_bills = sorted(bills, key=lambda x: float(x.get("amount", 0)))
    highest = sorted_bills[-1] if sorted_bills else None
    lowest = sorted_bills[0] if sorted_bills else None

    highest_bill = {
        "company": highest.get("company", "Unknown"),
        "amount": float(highest.get("amount", 0)),
        "date": highest.get("date", ""),
        "category": highest.get("category", "Others"),
    } if highest else None

    lowest_bill = {
        "company": lowest.get("company", "Unknown"),
        "amount": float(lowest.get("amount", 0)),
        "date": lowest.get("date", ""),
        "category": lowest.get("category", "Others"),
    } if lowest else None

    return AnalyticsResponse(
        total_bills=len(bills),
        total_amount=round(total_amount, 2),
        average_amount=round(avg_amount, 2),
        category_breakdown=category_breakdown,
        monthly_spending=monthly_spending,
        top_merchants=top_merchants,
        highest_bill=highest_bill,
        lowest_bill=lowest_bill,
    )


# ─── Export Bills as CSV ──────────────────────────────────────
@router.get("/export/csv")
async def export_csv(
    category: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: str = Depends(get_current_user),
):
    """Export bills as a CSV file. Supports optional category and date filters."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected.")

    query = {"user_id": current_user}
    if category and category != "All":
        query["category"] = category
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["date"] = date_query

    bills = await db.bills.find(query).sort("date", -1).to_list(5000)

    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Company", "Category", "Amount", "Date", "Notes", "File", "Upload Time"])

    for bill in bills:
        writer.writerow([
            bill.get("_id", ""),
            bill.get("company", ""),
            bill.get("category", ""),
            bill.get("amount", 0),
            bill.get("date", ""),
            bill.get("notes", ""),
            bill.get("filename", ""),
            bill.get("upload_time", "").strftime("%Y-%m-%d %H:%M:%S") if isinstance(bill.get("upload_time"), datetime) else bill.get("upload_time", ""),
        ])

    output.seek(0)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=bills_export_{timestamp}.csv"},
    )
