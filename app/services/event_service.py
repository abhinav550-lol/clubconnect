from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.event import Event
from app.models.club import Club
from app.models.attendance import Attendance
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate
from app.utils.qr import generate_qr_token, generate_qr_image_base64


def list_events(
    db: Session, skip: int = 0, limit: int = 20, club_id: UUID | None = None
) -> list[dict]:
    """Return paginated list of events."""
    query = db.query(Event)
    if club_id:
        query = query.filter(Event.club_id == club_id)
    events = query.order_by(Event.start_time.desc()).offset(skip).limit(limit).all()
    result = []
    for e in events:
        club = db.query(Club).filter(Club.id == e.club_id).first()
        att_count = (
            db.query(func.count(Attendance.id))
            .filter(Attendance.event_id == e.id)
            .scalar()
        )
        result.append(
            {
                "id": e.id,
                "club_id": e.club_id,
                "club_name": club.name if club else "",
                "title": e.title,
                "description": e.description,
                "start_time": e.start_time,
                "end_time": e.end_time,
                "location": e.location,
                "qr_token": e.qr_token,
                "max_attendees": e.max_attendees,
                "attendance_count": att_count,
                "created_at": e.created_at,
            }
        )
    return result


def get_event(db: Session, event_id: UUID) -> dict:
    """Get event detail with QR image."""
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    club = db.query(Club).filter(Club.id == e.club_id).first()
    att_count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.event_id == e.id)
        .scalar()
    )
    return {
        "id": e.id,
        "club_id": e.club_id,
        "club_name": club.name if club else "",
        "title": e.title,
        "description": e.description,
        "start_time": e.start_time,
        "end_time": e.end_time,
        "location": e.location,
        "qr_token": e.qr_token,
        "qr_image_base64": generate_qr_image_base64(e.qr_token),
        "max_attendees": e.max_attendees,
        "attendance_count": att_count,
        "created_at": e.created_at,
    }


def create_event(db: Session, data: EventCreate, user: User) -> Event:
    """Create a new event. Club admin or super_admin only."""
    club = db.query(Club).filter(Club.id == data.club_id, Club.is_active == True).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if str(club.admin_id) != str(user.id) and user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to create events for this club")
    if data.start_time >= data.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")

    event = Event(
        club_id=data.club_id,
        title=data.title,
        description=data.description,
        start_time=data.start_time,
        end_time=data.end_time,
        location=data.location,
        qr_token=generate_qr_token(),
        max_attendees=data.max_attendees,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(db: Session, event_id: UUID, data: EventUpdate, user: User) -> Event:
    """Update event details."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    club = db.query(Club).filter(Club.id == event.club_id).first()
    if str(club.admin_id) != str(user.id) and user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: UUID, user: User) -> None:
    """Delete an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    club = db.query(Club).filter(Club.id == event.club_id).first()
    if str(club.admin_id) != str(user.id) and user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(event)
    db.commit()
