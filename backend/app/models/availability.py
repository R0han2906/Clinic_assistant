from typing import Optional, List
from pydantic import BaseModel, Field


class WorkingScheduleItem(BaseModel):
    availability_id: Optional[str] = None
    dentist_id: str
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str = Field(..., description="HH:MM e.g. 09:00")
    end_time: str = Field(..., description="HH:MM e.g. 17:00")
    break_start: Optional[str] = Field(None, description="HH:MM e.g. 13:00")
    break_end: Optional[str] = Field(None, description="HH:MM e.g. 14:00")
    is_working_day: bool = Field(True, description="Whether dentist works on this day")


class ScheduleUpdate(BaseModel):
    """Payload for updating a single day's working schedule."""
    start_time: str = Field(..., description="New start time HH:MM e.g. 09:00")
    end_time: str = Field(..., description="New end time HH:MM e.g. 17:00")
    break_start: Optional[str] = Field(None, description="Break start HH:MM — null to remove")
    break_end: Optional[str] = Field(None, description="Break end HH:MM — null to remove")
    is_working_day: bool = Field(True, description="Set false to mark this day as off")


class LeaveCreate(BaseModel):
    """Payload for blocking a dentist for a date range (leave / holiday)."""
    start_date: str = Field(..., description="Leave start date YYYY-MM-DD")
    end_date: str = Field(..., description="Leave end date YYYY-MM-DD (inclusive)")
    reason: Optional[str] = Field(None, description="Reason e.g. Conference, Sick leave")


class LeaveItem(BaseModel):
    leave_id: Optional[str] = None
    dentist_id: str
    start_date: str = Field(..., description="YYYY-MM-DD")
    end_date: str = Field(..., description="YYYY-MM-DD")
    reason: Optional[str] = Field(None, description="Reason for leave/block")
    created_at: Optional[str] = None


class AvailableSlot(BaseModel):
    dentist_id: str
    dentist_name: str
    date: str = Field(..., description="YYYY-MM-DD")
    start_time: str = Field(..., description="HH:MM")
    end_time: str = Field(..., description="HH:MM")
    duration_minutes: int = 30
    is_available: bool = True


class AvailabilityQuery(BaseModel):
    date: str = Field(..., description="Date to query availability (YYYY-MM-DD)")
    dentist_id: Optional[str] = Field(None, description="Optional specific dentist filter")
