from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.orm import Session

from app.models.user import User


class RecommenderBase(ABC):
    """Abstract interface for club recommendation engines.

    Implement this interface to swap the mock recommender with a real ML model.
    """

    @abstractmethod
    def recommend(self, db: Session, user: User) -> list[dict[str, Any]]:
        """Return a ranked list of club recommendation dicts.

        Each dict should have: club_id, club_name, category, match_score, reason.
        """
        ...


class ChatbotBase(ABC):
    """Abstract interface for the chatbot engine.

    Implement this interface to swap the mock chatbot with an LLM-based one.
    """

    @abstractmethod
    def respond(self, message: str, user: User) -> str:
        """Return a text response to the user's message."""
        ...
