from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.user import User
from app.models.enums import UserRole, OrderStatus
from app.admin.schemas import DashboardStats, KYCReviewRequest, KYCReviewResponse, AdminCreateUserRequest
from app.admin.service import AdminService
from app.orders.schemas import OrderListResponse
from app.users.schemas import UserResponse
from app.core.config import settings

router = APIRouter(tags=["admin"])

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    data: AdminCreateUserRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.ADMIN))
):
    from app.auth.service import AuthService
    from app.auth.schemas import RegisterRequest
    reg_data = RegisterRequest(
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        phone=data.phone,
        role=data.role,
        admin_secret=settings.ADMIN_REGISTRATION_SECRET
    )
    user = await AuthService.register(db, reg_data)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCE))
):
    return await AdminService.get_dashboard_stats(db)

@router.get("/kyc/pending")
async def list_pending_kyc(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ADMIN))
):
    businesses, total = await AdminService.list_pending_kyc(db, page, size)
    return {"businesses": businesses, "total": total, "page": page, "size": size}

@router.post("/kyc/review", response_model=KYCReviewResponse)
async def review_kyc(
    data: KYCReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ADMIN))
):
    return await AdminService.review_kyc(db, data)

@router.get("/orders", response_model=OrderListResponse)
async def list_all_orders(
    status: Optional[OrderStatus] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCE))
):
    orders, total = await AdminService.list_all_orders(db, page, size, status)
    return OrderListResponse(orders=orders, total=total, page=page, size=size)

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ADMIN))
):
    from sqlalchemy import select, func
    from app.models.user import User as UserModel
    stmt = select(UserModel).order_by(UserModel.created_at.desc()).offset((page-1)*size).limit(size)
    count_stmt = select(func.count()).select_from(UserModel)
    
    total = await db.scalar(count_stmt)
    result = await db.execute(stmt)
    return {"users": result.scalars().all(), "total": total, "page": page, "size": size}

@router.get("/businesses")
async def list_businesses(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCE))
):
    from sqlalchemy import select, func
    from app.models.business import Business
    stmt = select(Business).order_by(Business.created_at.desc()).offset((page-1)*size).limit(size)
    count_stmt = select(func.count()).select_from(Business)
    
    total = await db.scalar(count_stmt)
    result = await db.execute(stmt)
    return {"businesses": result.scalars().all(), "total": total, "page": page, "size": size}

@router.get("/stores")
async def list_stores(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ADMIN, UserRole.FINANCE))
):
    from sqlalchemy import select, func
    from app.models.store import Store
    stmt = select(Store).order_by(Store.created_at.desc()).offset((page-1)*size).limit(size)
    count_stmt = select(func.count()).select_from(Store)
    
    total = await db.scalar(count_stmt)
    result = await db.execute(stmt)
    return {"stores": result.scalars().all(), "total": total, "page": page, "size": size}
