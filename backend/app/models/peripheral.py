from typing import Optional
from pydantic import BaseModel, Field


class PeripheralResponse(BaseModel):
    peripheral_id: str = Field(..., description="Unique asset code e.g. PER-000001")
    name: str
    category: str = "Equipment"
    location: str = ""
    condition: str = "Good"
    serial_no: Optional[str] = None
    last_service: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PeripheralCreate(BaseModel):
    name: str
    category: str = "Equipment"
    location: str = ""
    condition: str = "Good"
    serial_no: Optional[str] = None
    last_service: Optional[str] = None


class PeripheralUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    condition: Optional[str] = None
    serial_no: Optional[str] = None
    last_service: Optional[str] = None
