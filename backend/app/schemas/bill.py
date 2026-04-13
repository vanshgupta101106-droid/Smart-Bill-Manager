from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class BillBase(BaseModel):
    amount: Optional[float] = 0.0
    category: Optional[str] = "Others"
    company: Optional[str] = "Unknown"
    date: Optional[str] = None
    notes: Optional[str] = None

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

    model_config = {
        "populate_by_name": True
    }
