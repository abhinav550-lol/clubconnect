from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, clubs, applications, events, attendance, ai, analytics

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered college club management platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers — all mounted under /api/v1
# ---------------------------------------------------------------------------
API_V1 = "/api/v1"

app.include_router(auth.router, prefix=API_V1)
app.include_router(clubs.router, prefix=API_V1)
app.include_router(applications.router, prefix=API_V1)
app.include_router(events.router, prefix=API_V1)
app.include_router(attendance.router, prefix=API_V1)
app.include_router(ai.router, prefix=API_V1)
app.include_router(analytics.router, prefix=API_V1)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}
