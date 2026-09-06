from typing import Optional
from pydantic import BaseModel, Field

class StaffMember(BaseModel):
    staff_id: str = Field(..., description="Unique staff code e.g. STF-000001")
    username: Optional[str] = None
    full_name: str = Field(..., description="Full name of staff member")
    role: str = Field("Staff", description="Role e.g. Clinic Manager, Head Receptionist, Dental Assistant")
    department: str = Field("General", description="Department e.g. Administration, Front Desk, Nursing")
    phone: Optional[str] = None
    email: Optional[str] = None
    initials: Optional[str] = None
    status: str = Field("Active", description="Active | Off | On Leave")
    is_active: bool = True
    created_at: Optional[str] = None

class StaffCreate(BaseModel):
    full_name: str
    role: str = "Staff"
    department: str = "General"
    phone: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    initials: Optional[str] = None
    status: str = "Active"

class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    initials: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None

StaffResponse = StaffMember
