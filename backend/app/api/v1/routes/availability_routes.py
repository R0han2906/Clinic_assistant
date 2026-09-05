from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.models.availability import AvailableSlot
from app.services import get_availability_service, AvailabilityService
from app.controllers.availability_controller import AvailabilityController

router = APIRouter(prefix="/availability", tags=["Availability"])

@router.get("/slots", response_model=List[AvailableSlot])
def get_available_slots(
    date: str = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    dentist_id: Optional[str] = Query(None, description="Filter to a specific dentist"),
    duration: int = Query(30, description="Slot duration in minutes (default 30)"),
    availability_service: AvailabilityService = Depends(get_availability_service)
):
    """
    Returns all free bookable appointment slots for a given date.
    Subtracts non-working days, break windows, approved leaves, and booked appointments.
    """
    return AvailabilityController.get_available_slots(
        date=date,
        dentist_id=dentist_id,
        duration=duration,
        availability_service=availability_service
    )
