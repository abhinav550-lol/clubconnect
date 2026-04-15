from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.user import User
from app.models.club import Club
from app.models.club_member import ClubMember
from app.models.event import Event
from app.models.application import Application
from app.models.attendance import Attendance


def get_overview(db: Session) -> dict:
    """Platform-wide statistics (super admin)."""
    return {
        "total_users": db.query(func.count(User.id)).scalar(),
        "total_clubs": db.query(func.count(Club.id)).filter(Club.is_active == True).scalar(),
        "total_events": db.query(func.count(Event.id)).scalar(),
        "total_applications": db.query(func.count(Application.id)).scalar(),
        "pending_applications": (
            db.query(func.count(Application.id))
            .filter(Application.status == "pending")
            .scalar()
        ),
        "total_attendance_records": db.query(func.count(Attendance.id)).scalar(),
    }


def get_club_stats(db: Session, club_id: UUID, user: User) -> dict:
    """Club-level statistics (club admin)."""
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if str(club.admin_id) != str(user.id) and user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    member_count = (
        db.query(func.count(ClubMember.id))
        .filter(ClubMember.club_id == club_id)
        .scalar()
    )
    event_count = (
        db.query(func.count(Event.id)).filter(Event.club_id == club_id).scalar()
    )
    application_count = (
        db.query(func.count(Application.id))
        .filter(Application.club_id == club_id)
        .scalar()
    )
    # Total attendance across all club events
    event_ids = [
        e.id for e in db.query(Event.id).filter(Event.club_id == club_id).all()
    ]
    total_attendance = 0
    if event_ids:
        total_attendance = (
            db.query(func.count(Attendance.id))
            .filter(Attendance.event_id.in_(event_ids))
            .scalar()
        )

    return {
        "club_name": club.name,
        "member_count": member_count,
        "event_count": event_count,
        "application_count": application_count,
        "total_attendance": total_attendance,
    }


def get_student_stats(db: Session, user: User) -> dict:
    """Personal engagement statistics for a student."""
    return {
        "clubs_joined": (
            db.query(func.count(ClubMember.id))
            .filter(ClubMember.user_id == user.id)
            .scalar()
        ),
        "events_attended": (
            db.query(func.count(Attendance.id))
            .filter(Attendance.user_id == user.id)
            .scalar()
        ),
        "applications_submitted": (
            db.query(func.count(Application.id))
            .filter(Application.user_id == user.id)
            .scalar()
        ),
    }
