import hmac
import hashlib
from typing import Optional

def verify_whatsapp_signature(
    raw_body: bytes,
    signature_header: Optional[str],
    app_secret: Optional[str]
) -> bool:
    """
    Verifies that incoming webhook requests originated from Meta Cloud API
    by comparing the X-Hub-Signature-256 header against the calculated HMAC SHA256.
    """
    if not app_secret:
        # Dev mode / no secret configured
        return True

    if not signature_header:
        return False

    # Signature format: sha256=HEX_DIGEST
    parts = signature_header.split("=")
    if len(parts) != 2 or parts[0].lower() != "sha256":
        return False

    expected_sig = parts[1]
    mac = hmac.new(
        key=app_secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    )
    calculated_sig = mac.hexdigest()

    return hmac.compare_digest(calculated_sig.lower(), expected_sig.lower())
