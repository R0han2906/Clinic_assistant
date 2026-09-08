import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from fastapi.responses import PlainTextResponse

from app.core.config import settings
from app.shared.middleware.whatsapp_security import verify_whatsapp_signature
from app.services import get_whatsapp_service, WhatsAppConversationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/whatsapp", tags=["WhatsApp Webhook"])

@router.get("", response_class=PlainTextResponse)
def verify_whatsapp_webhook_challenge(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    Verification challenge endpoint required by Meta WhatsApp Cloud API.
    Checks hub.mode == 'subscribe' and hub.verify_token == settings.WHATSAPP_VERIFY_TOKEN,
    returning hub.challenge if valid.
    """
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        logger.info("[WhatsApp Webhook] Verification challenge successful.")
        return PlainTextResponse(content=hub_challenge or "")
    
    logger.warning(f"[WhatsApp Webhook] Invalid verify token received: '{hub_verify_token}'")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification failed: Invalid verify token"
    )

@router.post("")
async def receive_whatsapp_webhook_event(
    request: Request,
    whatsapp_service: WhatsAppConversationService = Depends(get_whatsapp_service)
):
    """
    Receiver endpoint for Meta WhatsApp Cloud API webhook events.
    Verifies HMAC SHA256 signature and processes incoming messages.
    """
    raw_body = await request.body()
    signature_header = request.headers.get("X-Hub-Signature-256")

    # Verify HMAC signature if app secret configured
    if settings.WHATSAPP_APP_SECRET and signature_header:
        if not verify_whatsapp_signature(raw_body, signature_header, settings.WHATSAPP_APP_SECRET):
            logger.warning("[WhatsApp Webhook] Signature verification failed.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    # Process entry changes
    entries = payload.get("entry", [])
    processed_count = 0

    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            contacts = value.get("contacts", [])

            user_name = contacts[0].get("profile", {}).get("name") if contacts else None

            for msg in messages:
                from_phone = msg.get("from", "")
                text_body = ""
                if msg.get("type") == "text":
                    text_body = msg.get("text", {}).get("body", "")
                elif msg.get("type") == "interactive":
                    interactive = msg.get("interactive", {})
                    if interactive.get("type") == "button_reply":
                        text_body = interactive.get("button_reply", {}).get("id") or interactive.get("button_reply", {}).get("title", "")
                    elif interactive.get("type") == "list_reply":
                        text_body = interactive.get("list_reply", {}).get("id") or interactive.get("list_reply", {}).get("title", "")

                if from_phone and text_body:
                    whatsapp_service.process_incoming_message(
                        phone=from_phone,
                        text=text_body,
                        user_name=user_name
                    )
                    processed_count += 1

    return {"status": "ok", "processed": processed_count}
