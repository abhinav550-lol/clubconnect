from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.attendance import Attendance
from app.models.event import Event
from app.models.user import User
from app.utils.qr import verify_user_event_token


def scan_check_in(db: Session, token: str, admin: User) -> Attendance:
    """Admin scans a student's QR code to mark attendance.

    The token is an HMAC-signed ``event_id:user_id:sig`` string.
    """
    result = verify_user_event_token(token)
    if not result:
        raise HTTPException(status_code=400, detail="Invalid or tampered QR token")

    event_id_str, user_id_str = result

    # Validate event
    event = db.query(Event).filter(Event.id == event_id_str).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Validate student
    student = db.query(User).filter(User.id == user_id_str).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check capacity
    if event.max_attendees:
        current_count = (
            db.query(func.count(Attendance.id))
            .filter(Attendance.event_id == event.id)
            .scalar()
        )
        if current_count >= event.max_attendees:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Event is at full capacity",
            )

    # Prevent duplicate check-in
    existing = (
        db.query(Attendance)
        .filter(Attendance.event_id == event.id, Attendance.user_id == student.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This student is already checked in",
        )

    record = Attendance(
        event_id=event.id,
        user_id=student.id,
        qr_token_used=token,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_event_attendance(db: Session, event_id: UUID, admin: User) -> list[dict]:
    """List attendance for a specific event (admin only)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    records = db.query(Attendance).filter(Attendance.event_id == event_id).all()
    result = []
    for r in records:
        user = db.query(User).filter(User.id == r.user_id).first()
        result.append(
            {
                "id": r.id,
                "event_id": r.event_id,
                "event_title": event.title,
                "user_id": r.user_id,
                "user_name": user.full_name if user else "",
                "checked_in_at": r.checked_in_at,
            }
        )
    return result


def get_my_attendance(db: Session, user: User) -> list[dict]:
    """List current user's attendance history."""
    records = db.query(Attendance).filter(Attendance.user_id == user.id).all()
    result = []
    for r in records:
        event = db.query(Event).filter(Event.id == r.event_id).first()
        result.append(
            {
                "id": r.id,
                "event_id": r.event_id,
                "event_title": event.title if event else "",
                "user_id": r.user_id,
                "user_name": user.full_name,
                "checked_in_at": r.checked_in_at,
            }
        )
    return result
