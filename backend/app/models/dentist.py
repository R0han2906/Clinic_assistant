from typing import Optional
from pydantic import BaseModel, Field

class DentistBase(BaseModel):
    name: str = Field(..., description="Full name and title of the dentist e.g. Dr. Sarah Jenkins")
    specialty: str = Field("General Dentistry", description="Specialty area")
    phone: Optional[str] = Field(None, description="Contact phone")
    email: Optional[str] = Field(None, description="Contact email")
    color_code: str = Field("#2B6CB0", description="Color badge code for calendar display")
    is_active: bool = Field(True, description="Whether the dentist is currently taking appointments")

class DentistCreate(DentistBase):
    pass

class DentistResponse(DentistBase):
    dentist_id: str
    created_at: str
