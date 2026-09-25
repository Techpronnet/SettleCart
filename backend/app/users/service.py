from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from app.models.user import User
from app.users.schemas import UserUpdateRequest
from app.core.exceptions import NotFoundException

class UserService:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: UUID) -> User:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundException("User not found")
        return user

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_profile(db: AsyncSession, user: User, data: UserUpdateRequest) -> User:
        if data.full_name is not None:
            user.full_name = data.full_name
        if data.phone is not None:
            user.phone = data.phone
        await db.flush()
        return user

    @staticmethod
    async def list_users(db: AsyncSession, page: int, size: int) -> tuple[list[User], int]:
        count_stmt = select(func.count()).select_from(User)
        count_result = await db.execute(count_stmt)
        total = count_result.scalar_one()
        
        offset = (page - 1) * size
        stmt = select(User).offset(offset).limit(size)
        result = await db.execute(stmt)
        users = list(result.scalars().all())
        
        return users, total
