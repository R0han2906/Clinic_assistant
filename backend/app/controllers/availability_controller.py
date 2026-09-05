from typing import List, Optional
from app.models.availability import AvailableSlot
from app.services.availability_service import AvailabilityService

class AvailabilityController:
    """Controller for computing free bookable appointment slots."""

    @staticmethod
    def get_available_slots(
        date: str,
        dentist_id: Optional[str],
        duration: int,
        availability_service: AvailabilityService
    ) -> List[AvailableSlot]:
        return availability_service.calculate_available_slots(
            target_date_str=date,
            dentist_id=dentist_id,
            slot_duration_minutes=duration
        )
