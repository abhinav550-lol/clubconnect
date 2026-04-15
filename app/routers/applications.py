from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_roles
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationReview, ApplicationOut
from app.services import application_service

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/", response_model=ApplicationOut, status_code=201)
def submit_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
):
    """Submit an application to join a club (students only)."""
    return application_service.submit_application(db, data, current_user)


@router.get("/my", response_model=list[ApplicationOut])
def my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all applications submitted by the current user."""
    return application_service.get_my_applications(db, current_user)


@router.get("/club/{club_id}", response_model=list[ApplicationOut])
def club_applications(
    club_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("club_admin", "super_admin")),
):
    """Get all applications for a specific club (club admin)."""
    return application_service.get_club_applications(db, club_id, current_user)


@router.put("/{application_id}/review", response_model=ApplicationOut)
def review_application(
    application_id: UUID,
    data: ApplicationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("club_admin", "super_admin")),
):
    """Accept or reject an application (club admin)."""
    return application_service.review_application(db, application_id, data, current_user)
