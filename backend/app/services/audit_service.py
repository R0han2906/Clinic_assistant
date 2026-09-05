from datetime import datetime
from app.repositories.base import BaseClinicRepository
from app.models.audit import AuditLogEntry

class AuditService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def record_event(self, entity_type: str, entity_id: str, action: str, details: str, staff_id: str = "staff_reception") -> None:
        entry = AuditLogEntry(
            timestamp=datetime.now().isoformat(),
            staff_id=staff_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            details=details
        )
        self.repository.log_audit_event(entry)
