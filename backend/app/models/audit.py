from typing import Optional
from pydantic import BaseModel, Field

class AuditLogEntry(BaseModel):
    log_id: Optional[str] = None
    timestamp: str
    staff_id: str = "staff_system"
    entity_type: str = Field(..., description="e.g. PATIENT, APPOINTMENT, VISIT")
    entity_id: str = Field(..., description="Target entity ID")
    action: str = Field(..., description="e.g. CREATE, UPDATE, RESCHEDULE, CANCEL")
    details: str = Field(..., description="JSON or text summary of change")
