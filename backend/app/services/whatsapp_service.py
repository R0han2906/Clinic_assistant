import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from app.core.config import settings
from app.models.patient import PatientCreate
from app.models.appointment import AppointmentCreate, AppointmentStatus
from app.models.patient_request import PatientRequestCreate
from app.services.patient_service import PatientService
from app.services.availability_service import AvailabilityService
from app.services.booking_service import BookingService
from app.services.patient_request_service import PatientRequestService
from app.infrastructure.whatsapp.whatsapp_client import MetaWhatsAppClient

logger = logging.getLogger(__name__)

# Global in-memory session cache for WhatsApp conversation state per phone number
WHATSAPP_SESSIONS: Dict[str, Dict[str, Any]] = {}

class WhatsAppConversationService:
    """
    Core WhatsApp conversation state machine (Phase 9).
    Translates WhatsApp user messages into domain actions using
    AvailabilityService, BookingService, PatientService, and PatientRequestService.
    """

    def __init__(
        self,
        patient_service: PatientService,
        availability_service: AvailabilityService,
        booking_service: BookingService,
        patient_request_service: PatientRequestService,
        whatsapp_client: Optional[MetaWhatsAppClient] = None
    ):
        self.patient_service = patient_service
        self.availability_service = availability_service
        self.booking_service = booking_service
        self.patient_request_service = patient_request_service
        self.client = whatsapp_client or MetaWhatsAppClient()

    def _get_session(self, phone: str) -> Dict[str, Any]:
        """Retrieves or initializes session state for a phone number."""
        if phone not in WHATSAPP_SESSIONS:
            WHATSAPP_SESSIONS[phone] = {
                "state": "WELCOME",
                "patient_id": None,
                "patient_name": None,
                "selected_dentist_id": "DOC-ANY",
                "selected_date": None,
                "selected_slot": None,
                "created_at": datetime.now().isoformat()
            }
        return WHATSAPP_SESSIONS[phone]

    def _reset_session(self, phone: str):
        """Resets session state to WELCOME."""
        if phone in WHATSAPP_SESSIONS:
            del WHATSAPP_SESSIONS[phone]

    def process_incoming_message(self, phone: str, text: str, user_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Main entrypoint processing incoming patient text or interactive selection.
        Returns a dict summarizing the action taken and new state.
        """
        clean_text = (text or "").strip()
        lower_text = clean_text.lower()
        session = self._get_session(phone)

        if user_name and not session.get("patient_name"):
            session["patient_name"] = user_name

        # Resolve or create patient
        patient = self.patient_service.search_patients(phone)
        if patient:
            session["patient_id"] = patient[0].patient_id
            session["patient_name"] = patient[0].full_name

        # Global command overrides
        if lower_text in ["hi", "hello", "start", "menu", "restart"]:
            session["state"] = "WELCOME"
            return self._handle_welcome(phone, session)

        if lower_text in ["cancel", "cancel appointment", "my appointments"]:
            session["state"] = "CANCEL_VIEW"
            return self._handle_cancel_view(phone, session)

        if lower_text in ["staff", "help", "human", "receptionist", "talk to staff"]:
            session["state"] = "HUMAN_HANDOFF"
            return self._handle_human_handoff(phone, session)

        state = session.get("state", "WELCOME")

        if state == "WELCOME":
            if "book" in lower_text or clean_text == "btn_book":
                session["state"] = "SELECT_DENTIST"
                return self._handle_select_dentist(phone, session)
            elif "cancel" in lower_text or clean_text == "btn_cancel":
                session["state"] = "CANCEL_VIEW"
                return self._handle_cancel_view(phone, session)
            elif "staff" in lower_text or clean_text == "btn_staff":
                session["state"] = "HUMAN_HANDOFF"
                return self._handle_human_handoff(phone, session)
            else:
                return self._handle_welcome(phone, session)

        elif state == "SELECT_DENTIST":
            if clean_text.startswith("DOC-") or "any" in lower_text or clean_text == "btn_any_doc":
                session["selected_dentist_id"] = clean_text if clean_text.startswith("DOC-") else "DOC-ANY"
                session["state"] = "SELECT_DATE"
                return self._handle_select_date(phone, session)
            else:
                session["selected_dentist_id"] = "DOC-ANY"
                session["state"] = "SELECT_DATE"
                return self._handle_select_date(phone, session)

        elif state == "SELECT_DATE":
            # Expect YYYY-MM-DD or option selection
            target_date = clean_text if len(clean_text) == 10 and clean_text.count("-") == 2 else (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            session["selected_date"] = target_date
            session["state"] = "SELECT_SLOT"
            return self._handle_select_slot(phone, session)

        elif state == "SELECT_SLOT":
            # Format expected: "HH:MM-HH:MM" e.g. "10:00-10:30"
            if "-" in clean_text:
                parts = clean_text.split("-")
                start_t, end_t = parts[0].strip(), parts[1].strip()
                session["selected_slot"] = {"start_time": start_t, "end_time": end_t}
                return self._execute_booking(phone, session)
            else:
                # Default first available slot
                return self._execute_booking(phone, session)

        elif state == "CANCEL_VIEW":
            # If user sent an appointment code APT-XXXXXX
            if clean_text.upper().startswith("APT-"):
                try:
                    apt = self.booking_service.cancel_appointment(clean_text.upper(), reason="Cancelled via WhatsApp")
                    self.client.send_text(phone, f"✅ Appointment *{apt.appointment_id}* has been successfully cancelled.")
                    self._reset_session(phone)
                    return {"status": "success", "action": "cancelled", "appointment_id": apt.appointment_id}
                except Exception as e:
                    self.client.send_text(phone, f"⚠️ Unable to cancel appointment: {e}")
                    return {"status": "error", "message": str(e)}
            else:
                self.client.send_text(phone, "Please provide the Appointment ID (e.g. `APT-000001`) to cancel, or type `MENU` to return to the main menu.")
                return {"status": "in_progress", "action": "awaiting_apt_id"}

        else:
            return self._handle_welcome(phone, session)

    def _handle_welcome(self, phone: str, session: Dict[str, Any]) -> Dict[str, Any]:
        patient_name = session.get("patient_name") or "there"
        welcome_text = f"👋 Hello {patient_name}! Welcome to *{settings.CLINIC_NAME}* WhatsApp Assistant.\n\nHow can we help you today?"
        buttons = [
            {"id": "btn_book", "title": "📅 Book Appointment"},
            {"id": "btn_cancel", "title": "❌ Cancel/View Apt"},
            {"id": "btn_staff", "title": "💬 Talk to Staff"}
        ]
        self.client.send_interactive_buttons(phone, welcome_text, buttons)
        return {"status": "success", "state": "WELCOME"}

    def _handle_select_dentist(self, phone: str, session: Dict[str, Any]) -> Dict[str, Any]:
        text = "👨‍⚕️ *Select Preferred Dentist*\n\nPlease choose a practitioner or select 'Any Available Dentist'."
        buttons = [
            {"id": "btn_any_doc", "title": "🩺 Any Available"},
            {"id": "DOC-000001", "title": "Dr. Ananya Rao"},
            {"id": "DOC-000002", "title": "Dr. Rahul Mehta"}
        ]
        self.client.send_interactive_buttons(phone, text, buttons)
        return {"status": "success", "state": "SELECT_DENTIST"}

    def _handle_select_date(self, phone: str, session: Dict[str, Any]) -> Dict[str, Any]:
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        text = f"📅 *Select Preferred Date*\n\nTomorrow is *{tomorrow}*. Reply with date (`YYYY-MM-DD`) or choose below:"
        buttons = [
            {"id": tomorrow, "title": f"Tomorrow ({tomorrow})"},
            {"id": day_after, "title": f"Day After ({day_after})"}
        ]
        self.client.send_interactive_buttons(phone, text, buttons)
        return {"status": "success", "state": "SELECT_DATE"}

    def _handle_select_slot(self, phone: str, session: Dict[str, Any]) -> Dict[str, Any]:
        target_date = session.get("selected_date") or (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        dentist_id = session.get("selected_dentist_id") or "DOC-ANY"

        slots = self.availability_service.calculate_available_slots(
            target_date_str=target_date,
            dentist_id=dentist_id
        )

        if not slots:
            self.client.send_text(
                phone,
                f"😔 Sorry, no available slots on *{target_date}* for the selected dentist. Reply with another date (`YYYY-MM-DD`) or type `MENU`."
            )
            session["state"] = "SELECT_DATE"
            return {"status": "no_slots", "date": target_date}

        # Build slot picker list
        sections = [{
            "title": "Available Times",
            "rows": [
                {
                    "id": f"{s.start_time}-{s.end_time}",
                    "title": f"{s.start_time} - {s.end_time}",
                    "description": f"With {s.dentist_name}"
                }
                for s in slots[:5]
            ]
        }]
        self.client.send_interactive_list(
            phone=phone,
            body_text=f"⏰ Select an available slot for *{target_date}*:",
            button_text="View Slots",
            sections=sections
        )
        return {"status": "success", "state": "SELECT_SLOT", "slot_count": len(slots)}

    def _execute_booking(self, phone: str, session: Dict[str, Any]) -> Dict[str, Any]:
        # Ensure patient exists in system
        patient_name = session.get("patient_name") or "WhatsApp Patient"
        patient_id = session.get("patient_id")

        if not patient_id:
            try:
                new_pat = self.patient_service.register_patient(PatientCreate(
                    full_name=patient_name,
                    phone=phone,
                    dob_or_age="Unknown",
                    force_create=True
                ))
                patient_id = new_pat.patient_id
                session["patient_id"] = patient_id
            except Exception as e:
                logger.warning(f"Error creating patient during WhatsApp booking: {e}")
                # Search by phone as fallback
                existing = self.patient_service.search_patients(phone)
                if existing:
                    patient_id = existing[0].patient_id

        target_date = session.get("selected_date") or (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        slot = session.get("selected_slot") or {"start_time": "10:00", "end_time": "10:30"}
        dentist_id = session.get("selected_dentist_id") or "DOC-ANY"

        if dentist_id == "DOC-ANY" or not dentist_id:
            try:
                any_doc = self.availability_service.find_any_available_dentist(target_date, slot["start_time"], slot["end_time"])
                if isinstance(any_doc, dict) and any_doc.get("dentist_id"):
                    dentist_id = any_doc["dentist_id"]
                elif hasattr(any_doc, "dentist_id"):
                    dentist_id = getattr(any_doc, "dentist_id")
                else:
                    dentist_id = "DOC-000001"
            except Exception:
                dentist_id = "DOC-000001"

        try:
            apt_data = AppointmentCreate(
                patient_id=patient_id or "PAT-000001",
                dentist_id=dentist_id,
                date=target_date,
                start_time=slot["start_time"],
                end_time=slot["end_time"],
                status=AppointmentStatus.CONFIRMED,
                reason="Booked via WhatsApp Cloud API"
            )
            confirmed_apt = self.booking_service.book_appointment(apt_data)

            self.client.send_confirmation(phone, {
                "appointment_id": confirmed_apt.appointment_id,
                "date": confirmed_apt.date,
                "start_time": confirmed_apt.start_time,
                "end_time": confirmed_apt.end_time,
                "dentist_name": confirmed_apt.dentist_name
            })
            self._reset_session(phone)
            return {"status": "success", "action": "booked", "appointment_id": confirmed_apt.appointment_id}

        except Exception as e:
            logger.error(f"Failed to complete direct booking via WhatsApp: {e}")
            # Fallback to PatientRequest queue
            try:
                req_data = PatientRequestCreate(
                    patient_name=patient_name,
                    patient_phone=phone,
                    preferred_date=target_date,
                    preferred_start_time=slot["start_time"],
                    preferred_end_time=slot["end_time"],
                    dentist_id=dentist_id,
                    reason="WhatsApp Intake Fallback Request"
                )
                p_req = self.patient_request_service.create_request(req_data)
                self.client.send_text(
                    phone,
                    f"📋 Your appointment request (*{p_req.request_id}*) has been recorded!\n"
                    f"Our receptionist will confirm your slot shortly via call or WhatsApp."
                )
                self._reset_session(phone)
                return {"status": "success", "action": "request_created", "request_id": p_req.request_id}
            except Exception as req_err:
                self.client.send_text(phone, f"⚠️ Could not complete request: {req_err}")
                return {"status": "error", "message": str(req_err)}

    def _handle_cancel_view(self, phone: str, session: Dict[str, Any]) -> Dict[str, Any]:
        patient_id = session.get("patient_id")
        appointments = []
        if patient_id:
            try:
                appointments = self.booking_service.list_patient_appointments(patient_id)
            except Exception:
                pass

        if not appointments:
            self.client.send_text(
                phone,
                "📋 You currently have no active registered appointments.\n\n"
                "If you have an Appointment ID (e.g. `APT-000001`), reply with the ID to cancel it, or reply `MENU`."
            )
        else:
            apt_lines = [f"• *{a.appointment_id}*: {a.date} at {a.start_time} ({a.status.value})" for a in appointments[:3]]
            summary = "\n".join(apt_lines)
            self.client.send_text(
                phone,
                f"📋 *Your Registered Appointments*:\n\n{summary}\n\n"
                f"Reply with the Appointment ID (e.g. `{appointments[0].appointment_id}`) to cancel it."
            )
        return {"status": "success", "state": "CANCEL_VIEW"}

    def _handle_human_handoff(self, phone: str, session: Dict[str, Any]) -> Dict[str, Any]:
        # Create high priority patient request for staff inbox
        try:
            self.patient_request_service.create_request(PatientRequestCreate(
                patient_name=session.get("patient_name") or "WhatsApp User",
                patient_phone=phone,
                preferred_date=datetime.now().strftime("%Y-%m-%d"),
                preferred_start_time="09:00",
                preferred_end_time="17:00",
                dentist_id="DOC-ANY",
                reason="[HUMAN HANDOFF] Patient requested receptionist support via WhatsApp"
            ))
        except Exception:
            pass

        self.client.send_text(
            phone,
            f"📞 *Receptionist Alerted*\n\n"
            f"A front-desk staff member at *{settings.CLINIC_NAME}* has been notified and will message or call you shortly.\n\n"
            f"You can also reach our clinic directly at +91 98765 43210. Type `MENU` anytime to restart."
        )
        self._reset_session(phone)
        return {"status": "success", "state": "HUMAN_HANDOFF"}
