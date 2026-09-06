from typing import Optional
from pydantic import BaseModel, Field

class SaleResponse(BaseModel):
    sale_id: str = Field(..., description="Unique sale ID e.g. SAL-000001")
    appointment_id: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: str
    treatment_name: str
    amount: float
    status: str = Field("Pending", description="Paid | Pending | Overdue")
    payment_method: str = "Cash"
    bill_number: Optional[str] = None
    sale_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class SaleCreate(BaseModel):
    patient_name: str
    treatment_name: str
    amount: float
    payment_method: str = "Cash"
    appointment_id: Optional[str] = None
    patient_id: Optional[str] = None
    status: str = "Pending"
    bill_number: Optional[str] = None
    sale_date: Optional[str] = None
    notes: Optional[str] = None

class SaleUpdate(BaseModel):
    patient_name: Optional[str] = None
    treatment_name: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    bill_number: Optional[str] = None
    sale_date: Optional[str] = None
    notes: Optional[str] = None

class SaleStatusUpdate(BaseModel):
    status: str = Field(..., description="Paid | Pending | Overdue")

class SaleSummary(BaseModel):
    total_paid: float = 0.0
    total_pending: float = 0.0
    total_overdue: float = 0.0
    count_paid: int = 0
    count_pending: int = 0
    count_overdue: int = 0

class PaymentMethodResponse(BaseModel):
    method_id: str
    name: str
    type: Optional[str] = None
    enabled: bool = True
    processing_fee: str = "None"
    created_at: Optional[str] = None

class PaymentMethodUpdate(BaseModel):
    enabled: Optional[bool] = None
    processing_fee: Optional[str] = None
