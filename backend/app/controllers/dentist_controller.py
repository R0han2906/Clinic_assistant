from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from app.models.dentist import DentistCreate, DentistResponse
from app.models.availability import (
    AvailableSlot, WorkingScheduleItem, LeaveItem, LeaveCreate, ScheduleUpdate
)
from app.services import (
    get_dentist_service, get_availability_service,
    DentistService, AvailabilityService
)

router = APIRouter(tags=["Dentists & Availability"])

# =========================================================================
# DENTIST CRUD
# =========================================================================

@router.get("/dentists", response_model=List[DentistResponse])
def list_dentists(
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Returns all active dentists in the clinic."""
    return dentist_service.list_active_dentists()


@router.get("/dentists/{dentist_id}", response_model=DentistResponse)
def get_dentist(
    dentist_id: str,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Returns full profile for a specific dentist (e.g. DOC-000001)."""
    return dentist_service.get_dentist_by_id(dentist_id)


@router.post("/dentists", response_model=DentistResponse, status_code=status.HTTP_201_CREATED)
def create_dentist(
    dentist_in: DentistCreate,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Registers a new dentist in the clinic."""
    return dentist_service.add_dentist(dentist_in)


# =========================================================================
# DENTIST SCHEDULE (Weekly Timetable)
# =========================================================================

@router.get("/dentists/{dentist_id}/schedule", response_model=List[WorkingScheduleItem])
def get_dentist_schedule(
    dentist_id: str,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """
    Returns the full weekly working schedule for a dentist.
    Each entry covers one day of the week (0=Monday … 6=Sunday),
    including working hours and break times.
    """
    return dentist_service.get_schedule(dentist_id)


@router.put(
    "/dentists/{dentist_id}/schedule/{day_of_week}",
    response_model=WorkingScheduleItem
)
def update_dentist_schedule_day(
    dentist_id: str,
    day_of_week: int = Path(..., ge=0, le=6, description="0=Monday … 6=Sunday"),
    schedule_update: ScheduleUpdate = ...,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """
    Updates the working hours and break time for a dentist on a specific day.
    Set `is_working_day: false` to mark the dentist as off on that day.

    Example: Change Dr. Jenkins to start at 08:00 on Mondays (day_of_week=0).
    """
    return dentist_service.update_day_schedule(dentist_id, day_of_week, schedule_update)


# =========================================================================
# DENTIST LEAVES (Blocked Days)
# =========================================================================

@router.get("/dentists/{dentist_id}/leaves", response_model=List[LeaveItem])
def get_dentist_leaves(
    dentist_id: str,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """
    Returns all registered leave/block periods for a dentist.
    These dates are automatically excluded from available slot calculations.
    """
    return dentist_service.get_leaves(dentist_id)


@router.post(
    "/dentists/{dentist_id}/leaves",
    response_model=LeaveItem,
    status_code=status.HTTP_201_CREATED
)
def add_dentist_leave(
    dentist_id: str,
    leave_data: LeaveCreate,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """
    Registers a leave or holiday block for a dentist.

    Once created, `GET /api/availability/slots` will return **zero slots**
    for this dentist on any date within the leave range.

    Example body:
    ```json
    {
      "start_date": "2026-09-15",
      "end_date":   "2026-09-17",
      "reason":     "Medical Conference"
    }
    ```
    """
    return dentist_service.add_leave(dentist_id, leave_data)


# =========================================================================
# AVAILABLE SLOTS (Computed Availability)
# =========================================================================

@router.get("/availability/slots", response_model=List[AvailableSlot])
def get_available_slots(
    date: str = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    dentist_id: Optional[str] = Query(None, description="Filter to a specific dentist"),
    duration: int = Query(30, description="Slot duration in minutes (default 30)"),
    availability_service: AvailabilityService = Depends(get_availability_service)
):
    """
    Returns all bookable appointment slots for a given date.

    The calculation subtracts:
    - Non-working days (schedule)
    - Break/lunch windows
    - Approved leave periods
    - Already confirmed/pending/rescheduled appointments

    Returns an empty list if the dentist is on leave or has no schedule for that day.
    """
    return availability_service.calculate_available_slots(
        target_date_str=date,
        dentist_id=dentist_id,
        slot_duration_minutes=duration
    )
