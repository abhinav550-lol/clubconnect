# ClubConnect AI — Backend

AI-powered college club management platform built with **FastAPI**, **PostgreSQL**, and **SQLAlchemy**.

## Features

- 🔐 **JWT Authentication** with role-based access (student, club_admin, super_admin)
- 🏛️ **Club Management** — create, update, soft-delete, member listing
- 📝 **Applications** — submit, review (accept/reject), auto-add members
- 📅 **Events** — CRUD with auto-generated QR codes for attendance
- 📸 **QR Attendance** — scan-to-check-in with capacity + duplicate protection
- 🤖 **AI Recommendations** — pluggable recommender (mock → ML ready)
- 💬 **AI Chatbot** — pluggable chatbot (mock → LLM ready)
- 📊 **Analytics** — platform, club, and student-level statistics

## Tech Stack

| Layer       | Technology                   |
|-------------|------------------------------|
| Framework   | FastAPI + Uvicorn            |
| Database    | PostgreSQL                   |
| ORM         | SQLAlchemy 2.0               |
| Migrations  | Alembic                      |
| Auth        | JWT (python-jose + passlib)  |
| Validation  | Pydantic v2                  |
| QR Codes    | qrcode + Pillow              |

## Quick Start

### 1. Prerequisites
- Python 3.11+
- PostgreSQL running locally

### 2. Clone & Install

```bash
cd ClubConnectAI
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY
```

### 4. Create Database

```sql
CREATE DATABASE clubconnect;
```

### 5. Run Migrations

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### 6. Start the Server

```bash
uvicorn app.main:app --reload --port 8000
```

### 7. Explore the API

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

## Project Structure

```
ClubConnectAI/
├── alembic/              # Database migrations
├── app/
│   ├── ai/               # Pluggable AI modules (recommender, chatbot)
│   ├── models/            # SQLAlchemy ORM models
│   ├── routers/           # FastAPI route handlers
│   ├── schemas/           # Pydantic request/response schemas
│   ├── services/          # Business logic layer
│   ├── utils/             # Security, QR, pagination helpers
│   ├── config.py          # App settings (pydantic-settings)
│   ├── database.py        # Engine & session factory
│   ├── dependencies.py    # Shared DI (auth, DB session)
│   └── main.py            # FastAPI app entry point
├── .env.example
├── alembic.ini
├── requirements.txt
└── README.md
```

## API Endpoints

| Module       | Endpoint                           | Method | Auth          |
|--------------|------------------------------------|--------|---------------|
| **Auth**     | `/api/v1/auth/register`            | POST   | Public        |
|              | `/api/v1/auth/login`               | POST   | Public        |
|              | `/api/v1/auth/me`                  | GET    | JWT           |
|              | `/api/v1/auth/me`                  | PUT    | JWT           |
| **Clubs**    | `/api/v1/clubs`                    | GET    | JWT           |
|              | `/api/v1/clubs`                    | POST   | Admin+        |
|              | `/api/v1/clubs/{id}`               | GET    | JWT           |
|              | `/api/v1/clubs/{id}`               | PUT    | Owner/Super   |
|              | `/api/v1/clubs/{id}`               | DELETE | Owner/Super   |
|              | `/api/v1/clubs/{id}/members`       | GET    | JWT           |
| **Apps**     | `/api/v1/applications`             | POST   | Student       |
|              | `/api/v1/applications/my`          | GET    | JWT           |
|              | `/api/v1/applications/club/{id}`   | GET    | Club Admin    |
|              | `/api/v1/applications/{id}/review` | PUT    | Club Admin    |
| **Events**   | `/api/v1/events`                   | GET    | JWT           |
|              | `/api/v1/events`                   | POST   | Admin+        |
|              | `/api/v1/events/{id}`              | GET    | JWT           |
|              | `/api/v1/events/{id}`              | PUT    | Owner/Super   |
|              | `/api/v1/events/{id}`              | DELETE | Owner/Super   |
| **Attend.**  | `/api/v1/attendance/check-in`      | POST   | JWT           |
|              | `/api/v1/attendance/event/{id}`    | GET    | Admin+        |
|              | `/api/v1/attendance/my`            | GET    | JWT           |
| **AI**       | `/api/v1/ai/recommendations`       | GET    | JWT           |
|              | `/api/v1/ai/chat`                  | POST   | JWT           |
| **Analytics**| `/api/v1/analytics/overview`       | GET    | Super Admin   |
|              | `/api/v1/analytics/club/{id}`      | GET    | Club Admin    |
|              | `/api/v1/analytics/my`             | GET    | JWT           |

## Extending AI Modules

The AI system uses an abstract interface pattern:

```python
# Implement RecommenderBase for a real ML model
from app.ai.base import RecommenderBase

class MLRecommender(RecommenderBase):
    def recommend(self, db, user):
        # Your ML logic here
        ...

# Swap in ai_service.py:
_recommender = MLRecommender()
```

Same pattern for the chatbot via `ChatbotBase`.

## License

MIT



Create PostgreSQL database: CREATE DATABASE clubconnect;
Run migrations: alembic revision --autogenerate -m "initial" && alembic upgrade head
Start server: uvicorn app.main:app --reload --port 8000
Open http://localhost:8000/docs to test
