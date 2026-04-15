import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------
class EventCreate(BaseModel):
    club_id: uuid.UUID
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: str = Field(..., min_length=2, max_length=255)
    max_attendees: Optional[int] = Field(None, ge=1)


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    max_attendees: Optional[int] = Field(None, ge=1)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------
class EventOut(BaseModel):
    id: uuid.UUID
    club_id: uuid.UUID
    club_name: str = ""
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: str
    qr_token: str
    qr_image_base64: Optional[str] = None
    max_attendees: Optional[int] = None
    attendance_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
