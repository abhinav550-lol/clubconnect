from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_roles
from app.models.user import User
from app.schemas.club import ClubCreate, ClubUpdate, ClubOut, ClubMemberOut
from app.services import club_service
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/clubs", tags=["Clubs"])


@router.get("/", response_model=list[ClubOut])
def list_clubs(
    pagination: PaginationParams = Depends(),
    category: str | None = Query(None),
    search: str | None = Query(None),
    admin_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List active clubs with optional category filter and search."""
    return club_service.list_clubs(
        db, skip=pagination.skip, limit=pagination.limit,
        category=category, search=search, admin_id=admin_id,
    )


@router.post("/", response_model=ClubOut, status_code=201)
def create_club(
    data: ClubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("club_admin", "super_admin")),
):
    """Create a new club (club_admin or super_admin)."""
    return club_service.create_club(db, data, current_user)


@router.get("/{club_id}", response_model=ClubOut)
def get_club(
    club_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get club details by ID."""
    club = club_service.get_club(db, club_id)
    return club


@router.put("/{club_id}", response_model=ClubOut)
def update_club(
    club_id: UUID,
    data: ClubUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update club details (owner or super_admin)."""
    return club_service.update_club(db, club_id, data, current_user)


@router.delete("/{club_id}", status_code=204)
def delete_club(
    club_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a club (owner or super_admin)."""
    club_service.delete_club(db, club_id, current_user)


@router.get("/{club_id}/members", response_model=list[ClubMemberOut])
def list_members(
    club_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List all members of a club."""
    return club_service.get_club_members(db, club_id)
