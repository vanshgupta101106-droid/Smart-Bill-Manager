from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class BillBase(BaseModel):
    amount: Optional[float] = 0.0
    category: Optional[str] = "Others"
    company: Optional[str] = "Unknown"
    date: Optional[str] = None
    notes: Optional[str] = None
    user_id: str = "default_user"


class BillCreate(BillBase):
    pass


class BillUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    company: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None


class BillResponse(BillBase):
    id: str = Field(alias="_id")
    filename: Optional[str] = None
    file_url: Optional[str] = None
    upload_time: datetime
    ocr_text: Optional[str] = None
    ocr_confidence: Optional[str] = None

    model_config = {
        "populate_by_name": True
    }


class AnalyticsResponse(BaseModel):
    total_bills: int
    total_amount: float
    average_amount: float
    category_breakdown: dict
    monthly_spending: dict
    top_merchants: List[dict]
    highest_bill: Optional[dict] = None
    lowest_bill: Optional[dict] = None
