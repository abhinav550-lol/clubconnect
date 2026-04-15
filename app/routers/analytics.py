from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_roles
from app.models.user import User
from app.schemas.analytics import OverviewStats, ClubStats, StudentStats
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=OverviewStats)
def overview(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin")),
):
    """Platform-wide statistics (super admin only)."""
    return analytics_service.get_overview(db)


@router.get("/club/{club_id}", response_model=ClubStats)
def club_stats(
    club_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("club_admin", "super_admin")),
):
    """Club-level statistics."""
    return analytics_service.get_club_stats(db, club_id, current_user)


@router.get("/my", response_model=StudentStats)
def my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Personal engagement statistics."""
    return analytics_service.get_student_stats(db, current_user)
