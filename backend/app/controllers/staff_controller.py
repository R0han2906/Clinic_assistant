from typing import List
from fastapi import APIRouter, Depends, Query, status
from app.models.staff import StaffMember, StaffCreate, StaffUpdate
from app.services import get_staff_service, StaffService

router = APIRouter(prefix="/staff", tags=["Staff Management"])

@router.get("", response_model=List[StaffMember])
def list_staff(
    active_only: bool = Query(False, description="Filter only active staff members"),
    service: StaffService = Depends(get_staff_service)
):
    """Lists clinic staff members (receptionists, managers, assistants)."""
    return service.list_staff(active_only=active_only)

@router.get("/{staff_id}", response_model=StaffMember)
def get_staff(
    staff_id: str,
    service: StaffService = Depends(get_staff_service)
):
    """Returns details for a staff member."""
    return service.get_staff(staff_id)

@router.post("", response_model=StaffMember, status_code=status.HTTP_201_CREATED)
def create_staff(
    staff_data: StaffCreate,
    service: StaffService = Depends(get_staff_service)
):
    """Adds a new staff member to the clinic."""
    return service.create_staff(staff_data)

@router.patch("/{staff_id}", response_model=StaffMember)
def update_staff(
    staff_id: str,
    updates: StaffUpdate,
    service: StaffService = Depends(get_staff_service)
):
    """Updates staff role, department, phone, status, etc."""
    return service.update_staff(staff_id, updates)

@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(
    staff_id: str,
    service: StaffService = Depends(get_staff_service)
):
    """Deactivates a staff member."""
    service.delete_staff(staff_id)
    return None
