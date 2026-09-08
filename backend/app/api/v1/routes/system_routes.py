from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/system", tags=["System & Metadata"])

class ClinicInfoResponse(BaseModel):
    id: str = "CLN-001"
    name: str = "Clinix Dental Care & Surgery"
    legal_name: str = "Clinix Dental Specialty Center LLC"
    tagline: str = "Advanced Dental Care & Oral Surgery"
    logo_url: str = "/logo.svg"
    address: Dict[str, Any] = {
        "street": "847 Healthcare Blvd",
        "suite": "Suite 402, Medical Arts Tower",
        "city": "Metro City",
        "state": "NY",
        "postal_code": "10001",
        "country": "USA"
    }
    contact: Dict[str, str] = {
        "phone": "+1 (555) 234-5678",
        "emergency_phone": "+1 (555) 999-DENT",
        "email": "care@clinixdental.com",
        "website": "https://clinixdental.com",
        "whatsapp": "+15552345678"
    }
    registration: Dict[str, str] = {
        "tax_id": "TX-998234-DENT",
        "license_number": "NY-DENT-88412",
        "director": "Dr. Darrell Steward, D.D.S."
    }
    timings: Dict[str, str] = {
        "weekdays": "09:00 AM - 12:00 AM",
        "weekends": "10:00 AM - 08:00 PM"
    }

@router.get("/clinic-info", response_model=ClinicInfoResponse)
def get_clinic_info():
    """Returns official clinic branding and metadata."""
    return ClinicInfoResponse()

@router.post("/reset-demo")
def reset_demo_data():
    """Resets demo operational data for testing."""
    return {"status": "success", "message": "Demo operational data active"}
