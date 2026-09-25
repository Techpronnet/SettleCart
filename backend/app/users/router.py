from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.dependencies import get_db, get_current_user, require_role
from app.users.schemas import UserResponse, UserUpdateRequest, UserListResponse
from app.users.service import UserService
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdateRequest, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    user = await UserService.update_profile(db, current_user, data)
    await db.commit()
    return user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.ADMIN))
):
    return await UserService.get_by_id(db, user_id)

@router.get("/", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.ADMIN))
):
    users, total = await UserService.list_users(db, page, size)
    return UserListResponse(users=users, total=total, page=page, size=size)
