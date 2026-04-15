import uuid
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: Literal["student", "club_admin"] = "student"
    interests: Optional[list[str]] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    interests: Optional[list[str]] = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------
class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    interests: Optional[list[str]] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
