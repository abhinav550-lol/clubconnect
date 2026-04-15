from sqlalchemy.orm import Session

from app.models.user import User
from app.ai.recommender import MockRecommender
from app.ai.chatbot import GroqChatbot


_recommender = MockRecommender()
_chatbot = GroqChatbot()


def get_recommendations(db: Session, user: User) -> list[dict]:
    """Get AI-powered club recommendations for a user."""
    return _recommender.recommend(db, user)


def chat(message: str, user: User) -> str:
    """Get a chatbot response via Groq + Llama 3."""
    return _chatbot.respond(message, user)
