import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.models.patient_request import PatientRequestCreate
from app.infrastructure.whatsapp.whatsapp_interface import WhatsAppAdapterInterface

logger = logging.getLogger(__name__)

class MetaWhatsAppClient(WhatsAppAdapterInterface):
    """
    Concrete implementation of Meta WhatsApp Business Cloud API client (Phase 9).
    Supports outbound message dispatching (text, interactive buttons, interactive lists)
    and includes a mock mode when live credentials are not provided.
    """

    def __init__(
        self,
        access_token: Optional[str] = None,
        phone_number_id: Optional[str] = None,
        api_url: Optional[str] = None
    ):
        self.access_token = access_token or settings.WHATSAPP_ACCESS_TOKEN
        self.phone_number_id = phone_number_id or settings.WHATSAPP_PHONE_NUMBER_ID
        self.api_url = api_url or settings.WHATSAPP_API_URL
        self.sent_messages_log: List[Dict[str, Any]] = []

    def _is_live_config(self) -> bool:
        return bool(self.access_token and self.phone_number_id)

    def _send_payload(self, payload: Dict[str, Any]) -> bool:
        """Helper to send JSON payload to Meta Cloud API endpoint or log in mock mode."""
        self.sent_messages_log.append(payload)

        if not self._is_live_config():
            logger.info(f"[WhatsApp Mock Client] Outbound message logged: {json.dumps(payload)}")
            return True

        endpoint = f"{self.api_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as response:
                return response.status in [200, 201]
        except Exception as e:
            logger.error(f"[WhatsApp Client Error] Failed to send payload to Meta: {e}")
            return False

    def parse_incoming_webhook(self, payload: Dict[str, Any]) -> Optional[PatientRequestCreate]:
        """
        Parses an incoming Meta Cloud API webhook event into a PatientRequestCreate domain model.
        """
        try:
            entries = payload.get("entry", [])
            if not entries:
                return None
            changes = entries[0].get("changes", [])
            if not changes:
                return None
            value = changes[0].get("value", {})
            messages = value.get("messages", [])
            contacts = value.get("contacts", [])

            if not messages:
                return None

            msg = messages[0]
            from_phone = msg.get("from", "")
            profile_name = contacts[0].get("profile", {}).get("name", "WhatsApp User") if contacts else "WhatsApp User"

            text_body = ""
            if msg.get("type") == "text":
                text_body = msg.get("text", {}).get("body", "")
            elif msg.get("type") == "interactive":
                interactive = msg.get("interactive", {})
                if interactive.get("type") == "button_reply":
                    text_body = interactive.get("button_reply", {}).get("title", "")
                elif interactive.get("type") == "list_reply":
                    text_body = interactive.get("list_reply", {}).get("title", "")

            return PatientRequestCreate(
                patient_name=profile_name,
                patient_phone=from_phone,
                preferred_date="",
                preferred_start_time="",
                preferred_end_time="",
                dentist_id="DOC-ANY",
                reason=text_body or "WhatsApp Intake Request"
            )
        except Exception as e:
            logger.error(f"Error parsing incoming WhatsApp webhook: {e}")
            return None

    def send_text(self, phone: str, text: str) -> bool:
        """Sends a standard text message to the specified phone number."""
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "text",
            "text": {"preview_url": False, "body": text}
        }
        return self._send_payload(payload)

    def send_interactive_buttons(self, phone: str, body_text: str, buttons: List[Dict[str, str]]) -> bool:
        """
        Sends an interactive quick-reply button message.
        buttons format: [{"id": "btn_1", "title": "Book Appointment"}]
        """
        formatted_buttons = []
        for btn in buttons[:3]:  # WhatsApp limits quick reply buttons to 3
            formatted_buttons.append({
                "type": "reply",
                "reply": {
                    "id": btn.get("id", "btn"),
                    "title": btn.get("title", "Option")[:20]  # Max 20 chars title
                }
            })

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": body_text},
                "action": {"buttons": formatted_buttons}
            }
        }
        return self._send_payload(payload)

    def send_interactive_list(self, phone: str, body_text: str, button_text: str, sections: List[Dict[str, Any]]) -> bool:
        """Sends an interactive list message (e.g. for slot picker)."""
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "interactive",
            "interactive": {
                "type": "list",
                "body": {"text": body_text},
                "action": {
                    "button": button_text[:20],
                    "sections": sections
                }
            }
        }
        return self._send_payload(payload)

    def send_confirmation(self, phone: str, appointment_details: Dict[str, Any]) -> bool:
        """Sends a structured appointment confirmation message."""
        apt_id = appointment_details.get("appointment_id", "N/A")
        date = appointment_details.get("date", "N/A")
        start_time = appointment_details.get("start_time", "N/A")
        end_time = appointment_details.get("end_time", "N/A")
        dentist = appointment_details.get("dentist_name", "Assigned Dentist")

        text = (
            f"✅ *Appointment Confirmed!*\n\n"
            f"📅 Date: {date}\n"
            f"⏰ Time: {start_time} - {end_time}\n"
            f"👨‍⚕️ Dentist: {dentist}\n"
            f"🆔 Booking Ref: {apt_id}\n\n"
            f"Thank you for choosing {settings.CLINIC_NAME}. Reply 'CANCEL' if you need to manage your appointment."
        )
        return self.send_text(phone, text)

    def send_reminder(self, phone: str, reminder_message: str) -> bool:
        """Sends a reminder message."""
        return self.send_text(phone, f"🔔 *Clinic Reminder*\n\n{reminder_message}")
