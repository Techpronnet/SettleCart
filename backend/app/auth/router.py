from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db, get_current_user
from app.auth.schemas import RegisterRequest, TokenResponse, RefreshRequest
from app.auth.service import AuthService
from app.users.schemas import UserResponse
from app.models.user import User
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException
from app.core.config import settings
from app.core.limiter import limiter
from uuid import UUID

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT_REGISTER)
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.register(db, data)
    await db.commit()
    return AuthService.create_tokens(user)

@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await AuthService.authenticate(db, form_data.username, form_data.password)
    return AuthService.create_tokens(user)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token)
    except Exception:
        raise UnauthorizedException("Invalid refresh token")
        
    user_id = payload.get("sub")
    token_type = payload.get("type")
    if not user_id or token_type != "refresh":
        raise UnauthorizedException("Invalid token type: expected refresh token")
        
    from app.users.service import UserService
    user = await UserService.get_by_id(db, UUID(user_id))
    return AuthService.create_tokens(user)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
