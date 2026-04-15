import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------
class ClubCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=2, max_length=100)
    tags: Optional[list[str]] = None


class ClubUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------
class ClubOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: str
    admin_id: uuid.UUID
    tags: Optional[list[str]] = None
    is_active: bool
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class ClubMemberOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_email: str
    user_name: str
    role: str
    joined_at: datetime
