from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse, RecommendationOut
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/recommendations", response_model=list[RecommendationOut])
def recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-powered club recommendations based on user interests."""
    return ai_service.get_recommendations(db, current_user)


@router.post("/chat", response_model=ChatResponse)
def chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI chatbot."""
    reply = ai_service.chat(data.message, current_user)
    return ChatResponse(reply=reply)
