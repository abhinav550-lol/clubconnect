import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Text, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(
        SAEnum("student", "club_admin", "super_admin", name="user_role"),
        nullable=False,
        default="student",
    )
    interests: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    clubs_owned = relationship("Club", back_populates="admin", lazy="selectin")
    applications = relationship("Application", back_populates="user", lazy="selectin")
    memberships = relationship("ClubMember", back_populates="user", lazy="selectin")
    attendances = relationship("Attendance", back_populates="user", lazy="selectin")
