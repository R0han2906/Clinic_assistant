from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.models.patient_request import PatientRequestCreate

class WhatsAppAdapterInterface(ABC):
    """
    Abstract boundary for WhatsApp Business API integration (Phase 9).
    Translates raw incoming webhook events into canonical PatientRequestCreate
    domain models, and provides outbound message dispatch.
    """

    @abstractmethod
    def parse_incoming_webhook(self, payload: Dict[str, Any]) -> Optional[PatientRequestCreate]:
        """
        Parses an incoming Meta Cloud API or BSP webhook payload into
        a standardized PatientRequestCreate model.
        """
        pass

    @abstractmethod
    def send_confirmation(self, phone: str, appointment_details: Dict[str, Any]) -> bool:
        """Sends an appointment confirmation message/template to the patient."""
        pass

    @abstractmethod
    def send_reminder(self, phone: str, reminder_message: str) -> bool:
        """Sends a payment or appointment reminder message to the patient."""
        pass
