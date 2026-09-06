from typing import Optional
from pydantic import BaseModel, Field

class PurchaseResponse(BaseModel):
    purchase_id: str = Field(..., description="Unique PO number e.g. PO-000001")
    vendor_id: Optional[str] = None
    vendor_name: str
    items: str
    amount: float
    status: str = Field("Ordered", description="Ordered | Pending | Received")
    order_date: Optional[str] = None
    received_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PurchaseCreate(BaseModel):
    vendor_name: str
    items: str
    amount: float
    vendor_id: Optional[str] = None
    status: str = "Ordered"
    order_date: Optional[str] = None
    notes: Optional[str] = None

class PurchaseUpdate(BaseModel):
    vendor_name: Optional[str] = None
    items: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    order_date: Optional[str] = None
    received_date: Optional[str] = None
    notes: Optional[str] = None

class PurchaseStatusUpdate(BaseModel):
    status: str = Field(..., description="Ordered | Pending | Received")
    received_date: Optional[str] = None

class VendorResponse(BaseModel):
    vendor_id: str
    name: str
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[str] = None

class VendorCreate(BaseModel):
    name: str
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
