from typing import List
from fastapi import APIRouter, Depends, Path, status
from app.models.dentist import DentistCreate, DentistResponse
from app.models.availability import WorkingScheduleItem, LeaveItem, LeaveCreate, ScheduleUpdate
from app.services import get_dentist_service, DentistService

router = APIRouter(prefix="/dentists", tags=["Dentists"])

@router.get("", response_model=List[DentistResponse])
def list_dentists(
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Returns all active dentists in the clinic."""
    return dentist_service.list_active_dentists()

@router.get("/{dentist_id}", response_model=DentistResponse)
def get_dentist(
    dentist_id: str,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Returns full profile for a specific dentist (e.g. DOC-000001)."""
    return dentist_service.get_dentist_by_id(dentist_id)

@router.post("", response_model=DentistResponse, status_code=status.HTTP_201_CREATED)
def create_dentist(
    dentist_in: DentistCreate,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Registers a new dentist in the clinic."""
    return dentist_service.add_dentist(dentist_in)

@router.get("/{dentist_id}/schedule", response_model=List[WorkingScheduleItem])
def get_dentist_schedule(
    dentist_id: str,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Returns the full weekly working schedule for a dentist (0=Monday … 6=Sunday)."""
    return dentist_service.get_schedule(dentist_id)

@router.put("/{dentist_id}/schedule/{day_of_week}", response_model=WorkingScheduleItem)
def update_dentist_schedule_day(
    dentist_id: str,
    day_of_week: int = Path(..., ge=0, le=6, description="0=Monday … 6=Sunday"),
    schedule_update: ScheduleUpdate = ...,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Updates the working hours and break time for a dentist on a specific day."""
    return dentist_service.update_day_schedule(dentist_id, day_of_week, schedule_update)

@router.get("/{dentist_id}/leaves", response_model=List[LeaveItem])
def get_dentist_leaves(
    dentist_id: str,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Returns all registered leave/block periods for a dentist."""
    return dentist_service.get_leaves(dentist_id)

@router.post("/{dentist_id}/leaves", response_model=LeaveItem, status_code=status.HTTP_201_CREATED)
def add_dentist_leave(
    dentist_id: str,
    leave_data: LeaveCreate,
    dentist_service: DentistService = Depends(get_dentist_service)
):
    """Registers a leave or holiday block for a dentist."""
    return dentist_service.add_leave(dentist_id, leave_data)
