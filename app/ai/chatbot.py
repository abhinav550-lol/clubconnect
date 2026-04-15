import os
import logging

from groq import Groq

from app.ai.base import ChatbotBase
from app.models.user import User

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are ClubConnect AI — a helpful, friendly, and enthusiastic campus assistant \
for a college club platform called "ClubConnect AI".

Your job is to help students and club admins with:
- Finding and recommending clubs based on interests
- Explaining how to apply to clubs
- Answering questions about events, attendance, and QR check-ins
- Helping club admins manage clubs, review applications, and create events
- General campus life advice

Guidelines:
- Keep responses concise (2-4 sentences) unless the user asks for detail.
- Use a warm, encouraging tone with occasional emoji.
- If you don't know something specific about the platform, admit it honestly.
- Never make up club names, event details, or data you don't have.
- You can reference platform features: club browsing, applications, events, \
  QR attendance, analytics dashboard, and AI recommendations.
"""


class GroqChatbot(ChatbotBase):
    """Chatbot powered by Groq (Llama 3) for natural conversations."""

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.warning("GROQ_API_KEY not set — chatbot will use fallback responses")
        self._client = Groq(api_key=api_key) if api_key else None
        self._model = os.getenv("GROQ_MODEL", "llama3-70b-8192")

    def respond(self, message: str, user: User) -> str:
        if not self._client:
            return self._fallback(message, user)

        try:
            user_context = f"User: {user.full_name} | Role: {user.role}"
            if user.interests:
                user_context += f" | Interests: {', '.join(user.interests)}"

            completion = self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "system", "content": f"Current user context: {user_context}"},
                    {"role": "user", "content": message},
                ],
                temperature=0.7,
                max_tokens=512,
                top_p=1,
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return self._fallback(message, user)

    @staticmethod
    def _fallback(message: str, user: User) -> str:
        """Keyword-based fallback when Groq is unavailable."""
        msg = message.lower()
        if "club" in msg:
            return "You can browse all available clubs on the Explore Clubs page. Use the search and category filters to find ones that match your interests! 🏛️"
        if "event" in msg:
            return "Check out the Events page to see what's happening on campus. You can filter by club and view event details including QR codes for attendance! 📅"
        if "apply" in msg or "application" in msg:
            return "To apply to a club, visit the club's detail page and click 'Apply Now'. Write a brief statement about why you'd like to join — the club admin will review it! ✉️"
        if "recommend" in msg:
            return "I can recommend clubs based on your interests! Make sure your profile has interests set, then check the AI Recommendations section on your dashboard. 🎯"
        return (
            f"Hi {user.full_name.split(' ')[0]}! I'm the ClubConnect AI assistant. "
            "I can help you with clubs, events, applications, recommendations, "
            "and attendance tracking. What would you like to know? 🤖"
        )


# Also keep MockChatbot available for testing
class MockChatbot(ChatbotBase):
    """Keyword-based chatbot — used only as a test fallback."""

    def respond(self, message: str, user: User) -> str:
        return GroqChatbot._fallback(message, user)
