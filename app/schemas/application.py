import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------
class ApplicationCreate(BaseModel):
    club_id: uuid.UUID
    statement: str = Field(..., min_length=10, max_length=2000)


class ApplicationReview(BaseModel):
    status: str = Field(..., pattern="^(accepted|rejected)$")
    review_note: Optional[str] = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------
class ApplicationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    club_id: uuid.UUID
    club_name: str = ""
    statement: str
    status: str
    review_note: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
