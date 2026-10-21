import logging

from fastapi import APIRouter, Depends, FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.limiter import limiter
from app.db.session import get_db
from app.routers import auth, catalog, mentor, profile, progress, resume, simulation, tests

logger = logging.getLogger("career_path_api")

app = FastAPI(
    title="Career Path Simulator API",
    description="Placement-centric career simulation and skill verification platform for Indian engineering students.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Attach rate limiter to FastAPI state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]


# Global unhandled exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Capture unexpected internal exceptions with sanitized logging (no PII or secrets)."""
    logger.error(
        f"Unhandled error on {request.method} {request.url.path}: {type(exc).__name__} - {str(exc)}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again or contact support.",
            "type": type(exc).__name__,
        },
    )


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Router
api_v1_router = APIRouter(prefix="/api/v1")

# Mount Routers
api_v1_router.include_router(auth.router)
api_v1_router.include_router(catalog.router)
api_v1_router.include_router(profile.router)
api_v1_router.include_router(simulation.router)
api_v1_router.include_router(tests.router)
api_v1_router.include_router(resume.router)
api_v1_router.include_router(progress.router)
api_v1_router.include_router(mentor.router)


@api_v1_router.get("/health", tags=["Health"])
def api_v1_health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify backend service readiness and database connectivity."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "Career Path Simulator API",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
        "database": db_status,
    }


app.include_router(api_v1_router)


@app.get("/health", tags=["Health"])
def root_health_check(db: Session = Depends(get_db)):
    """Root-level health check endpoint for cloud load balancers and deployment runtimes."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "Career Path Simulator API",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
        "database": db_status,
    }


@app.get("/", tags=["Root"])
def root_redirect():
    """Root redirect with status and documentation link."""
    return {
        "message": "Welcome to Career Path Simulator API",
        "documentation": "/docs",
        "health": "/health",
    }
