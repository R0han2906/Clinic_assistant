import pytest
import hmac
import hashlib
from fastapi.testclient import TestClient
from app.app import create_app
from app.core.config import settings
from app.shared.middleware.whatsapp_security import verify_whatsapp_signature
from app.services import (
    get_patient_service,
    get_availability_service,
    get_booking_service,
    get_patient_request_service
)
from app.services.whatsapp_service import WhatsAppConversationService

app = create_app()

@pytest.fixture
def client():
    return TestClient(app)

def test_whatsapp_webhook_verification_challenge_success(client):
    """Verifies GET challenge returns hub.challenge when token matches."""
    params = {
        "hub.mode": "subscribe",
        "hub.challenge": "test_challenge_code_12345",
        "hub.verify_token": settings.WHATSAPP_VERIFY_TOKEN
    }
    response = client.get("/api/v1/webhooks/whatsapp", params=params)
    assert response.status_code == 200
    assert response.text == "test_challenge_code_12345"

def test_whatsapp_webhook_verification_challenge_invalid_token(client):
    """Verifies GET challenge returns 403 Forbidden when token is wrong."""
    params = {
        "hub.mode": "subscribe",
        "hub.challenge": "test_challenge_code_12345",
        "hub.verify_token": "wrong_token"
    }
    response = client.get("/api/v1/webhooks/whatsapp", params=params)
    assert response.status_code == 403

def test_verify_whatsapp_signature_helper():
    """Verifies HMAC SHA256 calculation matching."""
    body = b'{"object":"whatsapp_business_account"}'
    secret = "my_app_secret_123"

    mac = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    valid_header = f"sha256={mac}"

    assert verify_whatsapp_signature(body, valid_header, secret) is True
    assert verify_whatsapp_signature(body, "sha256=invalid", secret) is False
    assert verify_whatsapp_signature(body, None, secret) is False

from unittest.mock import MagicMock
from app.models.availability import AvailableSlot
from app.models.appointment import AppointmentResponse, AppointmentStatus

def test_whatsapp_conversation_service_multi_step_flow():
    """Tests full conversation state machine from welcome to booking via domain services."""
    av_service = get_availability_service()
    av_service.calculate_available_slots = MagicMock(return_value=[
        AvailableSlot(
            date="2026-09-10",
            start_time="10:00",
            end_time="10:30",
            dentist_id="DOC-000001",
            dentist_name="Dr. Ananya Rao"
        )
    ])

    booking_svc = get_booking_service()
    booking_svc.book_appointment = MagicMock(return_value=AppointmentResponse(
        appointment_id="APT-999999",
        patient_id="PAT-000001",
        dentist_id="DOC-000001",
        dentist_name="Dr. Ananya Rao",
        date="2026-09-10",
        start_time="10:00",
        end_time="10:30",
        status=AppointmentStatus.CONFIRMED,
        created_at="2026-09-06T00:00:00Z",
        updated_at="2026-09-06T00:00:00Z"
    ))

    conv_service = WhatsAppConversationService(
        patient_service=get_patient_service(),
        availability_service=av_service,
        booking_service=booking_svc,
        patient_request_service=get_patient_request_service()
    )

    phone = "+919988776655"

    # Step 1: Incoming "Hi" -> WELCOME state
    res1 = conv_service.process_incoming_message(phone, "Hi", user_name="Test Patient")
    assert res1["status"] == "success"
    assert res1["state"] == "WELCOME"

    # Step 2: User clicks "Book Appointment"
    res2 = conv_service.process_incoming_message(phone, "btn_book")
    assert res2["status"] == "success"
    assert res2["state"] == "SELECT_DENTIST"

    # Step 3: User picks "DOC-ANY"
    res3 = conv_service.process_incoming_message(phone, "DOC-ANY")
    assert res3["status"] == "success"
    assert res3["state"] == "SELECT_DATE"

    # Step 4: User selects date "2026-09-10"
    res4 = conv_service.process_incoming_message(phone, "2026-09-10")
    assert res4["status"] == "success"
    assert res4["state"] == "SELECT_SLOT"

    # Step 5: User selects slot "10:00-10:30" -> Executes Booking
    res5 = conv_service.process_incoming_message(phone, "10:00-10:30")
    assert res5["status"] == "success"
    assert res5["action"] in ["booked", "request_created"]

def test_whatsapp_conversation_cancellation():
    """Tests cancellation intent via conversation state machine."""
    conv_service = WhatsAppConversationService(
        patient_service=get_patient_service(),
        availability_service=get_availability_service(),
        booking_service=get_booking_service(),
        patient_request_service=get_patient_request_service()
    )

    phone = "+919988776644"

    res = conv_service.process_incoming_message(phone, "cancel")
    assert res["status"] == "success"
    assert res["state"] == "CANCEL_VIEW"

def test_whatsapp_conversation_human_handoff():
    """Tests receptionist human handoff escalation."""
    conv_service = WhatsAppConversationService(
        patient_service=get_patient_service(),
        availability_service=get_availability_service(),
        booking_service=get_booking_service(),
        patient_request_service=get_patient_request_service()
    )

    phone = "+919988776633"

    res = conv_service.process_incoming_message(phone, "staff")
    assert res["status"] == "success"
    assert res["state"] == "HUMAN_HANDOFF"

def test_post_whatsapp_webhook_payload_receiving(client):
    """Tests POST /api/v1/webhooks/whatsapp endpoint receiving Meta webhook JSON."""
    payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "123456789",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "15550555555",
                                "phone_number_id": "100000000"
                            },
                            "contacts": [
                                {
                                    "profile": {"name": "Webhook Tester"},
                                    "wa_id": "919876543210"
                                }
                            ],
                            "messages": [
                                {
                                    "from": "919876543210",
                                    "id": "wamid.HBgLOTE5ODc2NTQzMjEwFQIAERgSQjE2RjU0",
                                    "timestamp": "1725600000",
                                    "text": {"body": "Hello"},
                                    "type": "text"
                                }
                            ]
                        },
                        "field": "messages"
                    }
                ]
            }
        ]
    }

    response = client.post("/api/v1/webhooks/whatsapp", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["processed"] == 1
