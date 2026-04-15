from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.application import Application
from app.models.club import Club
from app.models.club_member import ClubMember
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationReview


def submit_application(db: Session, data: ApplicationCreate, user: User) -> Application:
    """Student submits an application to a club."""
    # Verify club exists
    club = db.query(Club).filter(Club.id == data.club_id, Club.is_active == True).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    # Check for duplicate application
    existing = (
        db.query(Application)
        .filter(
            Application.user_id == user.id,
            Application.club_id == data.club_id,
            Application.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending application for this club",
        )

    app = Application(
        user_id=user.id,
        club_id=data.club_id,
        statement=data.statement,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def get_my_applications(db: Session, user: User) -> list[dict]:
    """Return all applications for the current student."""
    apps = db.query(Application).filter(Application.user_id == user.id).all()
    result = []
    for a in apps:
        club = db.query(Club).filter(Club.id == a.club_id).first()
        result.append(
            {
                "id": a.id,
                "user_id": a.user_id,
                "club_id": a.club_id,
                "club_name": club.name if club else "",
                "statement": a.statement,
                "status": a.status,
                "review_note": a.review_note,
                "created_at": a.created_at,
                "reviewed_at": a.reviewed_at,
            }
        )
    return result


def get_club_applications(db: Session, club_id: UUID, admin: User) -> list[dict]:
    """Return all applications for a club (admin only)."""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if str(club.admin_id) != str(admin.id) and admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    apps = db.query(Application).filter(Application.club_id == club_id).all()
    result = []
    for a in apps:
        result.append(
            {
                "id": a.id,
                "user_id": a.user_id,
                "club_id": a.club_id,
                "club_name": club.name,
                "statement": a.statement,
                "status": a.status,
                "review_note": a.review_note,
                "created_at": a.created_at,
                "reviewed_at": a.reviewed_at,
            }
        )
    return result


def review_application(
    db: Session, application_id: UUID, data: ApplicationReview, admin: User
) -> Application:
    """Accept or reject an application. Auto-adds member on acceptance."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != "pending":
        raise HTTPException(status_code=400, detail="Application already reviewed")

    club = db.query(Club).filter(Club.id == app.club_id).first()
    if str(club.admin_id) != str(admin.id) and admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    app.status = data.status
    app.review_note = data.review_note
    app.reviewed_at = datetime.now(timezone.utc)

    # Auto-add as member if accepted
    if data.status == "accepted":
        existing_member = (
            db.query(ClubMember)
            .filter(ClubMember.user_id == app.user_id, ClubMember.club_id == app.club_id)
            .first()
        )
        if not existing_member:
            member = ClubMember(user_id=app.user_id, club_id=app.club_id, role="member")
            db.add(member)

    db.commit()
    db.refresh(app)
    return app
