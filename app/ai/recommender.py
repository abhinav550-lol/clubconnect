from typing import Any

from sqlalchemy.orm import Session

from app.ai.base import RecommenderBase
from app.models.user import User
from app.models.club import Club


class MockRecommender(RecommenderBase):
    """Tag-overlap recommender — returns clubs whose tags match user interests.

    Replace this class with a real ML model by implementing ``RecommenderBase``.
    """

    def recommend(self, db: Session, user: User) -> list[dict[str, Any]]:
        user_interests = set(user.interests or [])
        if not user_interests:
            # No interests → return popular clubs
            clubs = db.query(Club).filter(Club.is_active == True).limit(5).all()
            return [
                {
                    "club_id": str(c.id),
                    "club_name": c.name,
                    "category": c.category,
                    "match_score": 0.5,
                    "reason": "Popular club — update your interests for better matches!",
                }
                for c in clubs
            ]

        clubs = db.query(Club).filter(Club.is_active == True).all()
        scored: list[dict[str, Any]] = []
        for club in clubs:
            club_tags = set(club.tags or [])
            overlap = user_interests & club_tags
            if overlap:
                score = round(len(overlap) / max(len(user_interests), 1), 2)
                scored.append(
                    {
                        "club_id": str(club.id),
                        "club_name": club.name,
                        "category": club.category,
                        "match_score": score,
                        "reason": f"Matches your interests: {', '.join(overlap)}",
                    }
                )

        scored.sort(key=lambda x: x["match_score"], reverse=True)
        return scored[:10]
