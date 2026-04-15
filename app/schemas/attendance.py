import uuid
from datetime import datetime

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------
class CheckInRequest(BaseModel):
    qr_token: str


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------
class AttendanceOut(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    event_title: str = ""
    user_id: uuid.UUID
    user_name: str = ""
    checked_in_at: datetime

    model_config = {"from_attributes": True}


class ScanCheckInResponse(AttendanceOut):
    """Extended response after admin scans a student QR."""
    message: str = ""


class TicketOut(BaseModel):
    """Student's personal event ticket with QR code."""
    event_id: str
    event_title: str
    user_id: str
    user_name: str
    qr_token: str
    qr_image_base64: str
