from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserRegister, UserUpdate
from app.utils.security import hash_password, verify_password, create_access_token


def register_user(db: Session, data: UserRegister) -> User:
    """Create a new student account."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role,
        interests=data.interests,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> dict:
    """Validate credentials and return a JWT token."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


def update_user_profile(db: Session, user: User, data: UserUpdate) -> User:
    """Update current user's profile fields."""
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.interests is not None:
        user.interests = data.interests
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user
