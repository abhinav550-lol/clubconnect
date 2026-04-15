from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.club import Club
from app.models.club_member import ClubMember
from app.models.user import User
from app.schemas.club import ClubCreate, ClubUpdate


def list_clubs(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    category: str | None = None,
    search: str | None = None,
) -> list[dict]:
    """Return paginated list of active clubs with member counts."""
    query = db.query(Club).filter(Club.is_active == True)
    if category:
        query = query.filter(Club.category == category)
    if search:
        query = query.filter(Club.name.ilike(f"%{search}%"))
    clubs = query.offset(skip).limit(limit).all()
    result = []
    for club in clubs:
        member_count = (
            db.query(func.count(ClubMember.id))
            .filter(ClubMember.club_id == club.id)
            .scalar()
        )
        club_dict = {
            "id": club.id,
            "name": club.name,
            "description": club.description,
            "category": club.category,
            "admin_id": club.admin_id,
            "tags": club.tags,
            "is_active": club.is_active,
            "created_at": club.created_at,
            "member_count": member_count,
        }
        result.append(club_dict)
    return result


def get_club(db: Session, club_id: UUID) -> Club:
    """Get a single club by ID."""
    club = db.query(Club).filter(Club.id == club_id, Club.is_active == True).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club


def create_club(db: Session, data: ClubCreate, admin: User) -> Club:
    """Create a new club. The creator becomes its admin."""
    existing = db.query(Club).filter(Club.name == data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Club name already exists",
        )
    club = Club(
        name=data.name,
        description=data.description,
        category=data.category,
        admin_id=admin.id,
        tags=data.tags,
    )
    db.add(club)
    db.commit()
    db.refresh(club)

    # Auto-add admin as a lead member
    membership = ClubMember(user_id=admin.id, club_id=club.id, role="lead")
    db.add(membership)
    db.commit()

    return club


def update_club(db: Session, club_id: UUID, data: ClubUpdate, user: User) -> Club:
    """Update club details. Only the club admin or super_admin can update."""
    club = get_club(db, club_id)
    if str(club.admin_id) != str(user.id) and user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this club")
    if data.name is not None:
        club.name = data.name
    if data.description is not None:
        club.description = data.description
    if data.category is not None:
        club.category = data.category
    if data.tags is not None:
        club.tags = data.tags
    db.commit()
    db.refresh(club)
    return club


def delete_club(db: Session, club_id: UUID, user: User) -> None:
    """Soft-delete a club."""
    club = get_club(db, club_id)
    if str(club.admin_id) != str(user.id) and user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this club")
    club.is_active = False
    db.commit()


def get_club_members(db: Session, club_id: UUID) -> list[dict]:
    """List all members of a club."""
    get_club(db, club_id)  # ensure club exists
    members = db.query(ClubMember).filter(ClubMember.club_id == club_id).all()
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        result.append(
            {
                "id": m.id,
                "user_id": m.user_id,
                "user_email": user.email if user else "",
                "user_name": user.full_name if user else "",
                "role": m.role,
                "joined_at": m.joined_at,
            }
        )
    return result
