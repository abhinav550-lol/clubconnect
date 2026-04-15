from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


class RecommendationOut(BaseModel):
    club_id: str
    club_name: str
    category: str
    match_score: float
    reason: str
