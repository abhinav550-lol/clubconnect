from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_roles
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventOut
from app.schemas.attendance import TicketOut
from app.services import event_service
from app.utils.pagination import PaginationParams
from app.utils.qr import generate_user_event_token, generate_qr_image_base64
from app.models.event import Event
from fastapi import HTTPException

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("/", response_model=list[EventOut])
def list_events(
    pagination: PaginationParams = Depends(),
    club_id: UUID | None = Query(None),
    admin_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List events with optional club filter."""
    return event_service.list_events(
        db, skip=pagination.skip, limit=pagination.limit,
        club_id=club_id, admin_id=admin_id,
    )


@router.post("/", response_model=EventOut, status_code=201)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("club_admin", "super_admin")),
):
    """Create a new event for a club."""
    return event_service.create_event(db, data, current_user)


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get event details with QR code image."""
    return event_service.get_event(db, event_id)


@router.get("/{event_id}/my-ticket/", response_model=TicketOut)
def get_my_ticket(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's personal QR ticket for an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    token = generate_user_event_token(str(event.id), str(current_user.id))
    return {
        "event_id": str(event.id),
        "event_title": event.title,
        "user_id": str(current_user.id),
        "user_name": current_user.full_name,
        "qr_token": token,
        "qr_image_base64": generate_qr_image_base64(token),
    }


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: UUID,
    data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update event details (club admin or super_admin)."""
    return event_service.update_event(db, event_id, data, current_user)


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an event (club admin or super_admin)."""
    event_service.delete_event(db, event_id, current_user)
