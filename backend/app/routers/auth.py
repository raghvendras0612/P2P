from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.limiter import limiter
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.session import get_db
from app.models.catalog import CareerPath, UserSelectedPath
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserRead,
)
from app.schemas.catalog import CareerPathRead
from app.services.auth_service import authenticate_user, register_student

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=(settings.ENVIRONMENT == "production"),
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(
    request: Request,
    response: Response,
    reg_data: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Register a new student account and create their full profile in an atomic operation."""
    user = register_student(db, reg_data)

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("15/minute")
def login(
    request: Request,
    response: Response,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate with email and password to receive a JWT access token."""
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: Request,
    response: Response,
    payload_body: Optional[RefreshTokenRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token"),
    db: Session = Depends(get_db),
):
    """Refresh an access token using the httpOnly cookie or fallback body parameter."""
    token = refresh_token_cookie
    if not token and payload_body and payload_body.refresh_token:
        token = payload_body.refresh_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing.",
        )

    claims = decode_token(token)
    if not claims or claims.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id = int(claims.get("sub", 0))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
        )

    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    _set_refresh_cookie(response, new_refresh_token)

    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/logout")
def logout(response: Response):
    """Log out the student by invalidating and clearing the refresh token cookie."""
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")
    return {"message": "Successfully logged out."}


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the currently authenticated user with their profile and active career path summary."""
    active_selection = (
        db.query(UserSelectedPath)
        .filter(
            UserSelectedPath.user_id == current_user.id,
            UserSelectedPath.is_active.is_(True),
        )
        .order_by(UserSelectedPath.selected_at.desc())
        .first()
    )
    selected_path = None
    if active_selection:
        cp = db.query(CareerPath).filter(CareerPath.id == active_selection.career_path_id).first()
        if cp:
            selected_path = CareerPathRead.model_validate(cp)

    return {
        "user": UserRead.model_validate(current_user),
        "profile": {
            "full_name": current_user.profile.full_name if current_user.profile else None,
            "college": current_user.profile.college if current_user.profile else None,
            "branch": current_user.profile.branch if current_user.profile else None,
            "year_of_study": current_user.profile.year_of_study if current_user.profile else None,
            "cgpa": float(current_user.profile.cgpa) if current_user.profile else None,
        },
        "selected_path": selected_path,
    }
