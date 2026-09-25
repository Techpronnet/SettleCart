from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.models.enums import UserRole
from app.auth.schemas import RegisterRequest, TokenResponse
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.exceptions import ConflictException, UnauthorizedException, ForbiddenException

class AuthService:
    @staticmethod
    async def register(db: AsyncSession, data: RegisterRequest) -> User:
        stmt = select(User).where(User.email == data.email)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise ConflictException("Email already registered")
        
        if data.role == UserRole.ADMIN:
            stmt_count = select(func.count()).select_from(User).where(User.role == UserRole.ADMIN)
            admin_count = await db.scalar(stmt_count) or 0
            if admin_count > 0:
                if not data.admin_secret or data.admin_secret != settings.ADMIN_REGISTRATION_SECRET:
                    raise ForbiddenException("Public administrator registration is disabled. Valid admin key required.")

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=data.role
        )
        db.add(user)
        await db.flush()
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> User:
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid credentials")
        
        return user

    @staticmethod
    def create_tokens(user: User) -> TokenResponse:
        access_token = create_access_token(subject=str(user.id), role=user.role.value)
        refresh_token = create_refresh_token(subject=str(user.id))
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
