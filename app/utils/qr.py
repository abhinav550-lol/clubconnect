import io
import base64
import uuid
import hmac
import hashlib
import os

import qrcode


def generate_qr_token() -> str:
    """Generate a unique QR token string."""
    return uuid.uuid4().hex


def generate_qr_image_base64(data: str) -> str:
    """Return a base64-encoded PNG QR code image for the given data string."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


# ── Per-user event ticket tokens ──────────────────────────────────────────

def _get_secret() -> str:
    return os.getenv("SECRET_KEY", "dev-secret-key-not-for-production-use-2024")


def generate_user_event_token(event_id: str, user_id: str) -> str:
    """Generate a deterministic, HMAC-signed token for a user–event pair.

    Format: ``{event_id}:{user_id}:{signature}``
    The signature prevents forging tokens.
    """
    payload = f"{event_id}:{user_id}"
    sig = hmac.new(
        _get_secret().encode(), payload.encode(), hashlib.sha256
    ).hexdigest()[:16]
    return f"{payload}:{sig}"


def verify_user_event_token(token: str) -> tuple[str, str] | None:
    """Verify an HMAC-signed user–event token.

    Returns ``(event_id, user_id)`` on success, ``None`` if invalid.
    """
    parts = token.split(":")
    if len(parts) != 3:
        return None
    event_id, user_id, sig = parts
    expected_sig = hmac.new(
        _get_secret().encode(), f"{event_id}:{user_id}".encode(), hashlib.sha256
    ).hexdigest()[:16]
    if not hmac.compare_digest(sig, expected_sig):
        return None
    return event_id, user_id
