from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_roles
from app.models.user import User
from app.schemas.attendance import CheckInRequest, AttendanceOut, ScanCheckInResponse
from app.services import attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/scan-checkin/", response_model=ScanCheckInResponse, status_code=201)
def scan_check_in(
    data: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("club_admin", "super_admin")),
):
    """Admin scans a student's QR code to mark attendance."""
    record = attendance_service.scan_check_in(db, data.qr_token, current_user)
    student = db.query(User).filter(User.id == record.user_id).first()
    event = record.event
    return {
        "id": record.id,
        "event_id": record.event_id,
        "event_title": event.title if event else "",
        "user_id": record.user_id,
        "user_name": student.full_name if student else "",
        "checked_in_at": record.checked_in_at,
        "message": f"✅ {student.full_name if student else 'Student'} checked in successfully!",
    }


@router.get("/event/{event_id}", response_model=list[AttendanceOut])
def event_attendance(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("club_admin", "super_admin")),
):
    """List attendance for an event (admin only)."""
    return attendance_service.get_event_attendance(db, event_id, current_user)


@router.get("/my/", response_model=list[AttendanceOut])
def my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's attendance history."""
    return attendance_service.get_my_attendance(db, current_user)
