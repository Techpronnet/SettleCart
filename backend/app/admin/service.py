from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Tuple, List, Optional
from datetime import datetime, timezone

from app.models.user import User
from app.models.business import Business
from app.models.store import Store
from app.models.order import Order, VendorOrder
from app.models.catalogue import Product
from app.models.enums import KYCStatus, OrderStatus
from app.admin.schemas import DashboardStats, KYCReviewRequest, KYCReviewResponse
from app.core.exceptions import NotFoundException, BadRequestException

class AdminService:
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> DashboardStats:
        total_users = await db.scalar(select(func.count()).select_from(User))
        total_businesses = await db.scalar(select(func.count()).select_from(Business))
        total_stores = await db.scalar(select(func.count()).select_from(Store))
        total_orders = await db.scalar(select(func.count()).select_from(Order))
        total_products = await db.scalar(select(func.count()).select_from(Product))
        pending_kyc = await db.scalar(select(func.count()).select_from(Business).where(Business.kyc_status == KYCStatus.UNDER_REVIEW))

        return DashboardStats(
            total_users=total_users or 0,
            total_businesses=total_businesses or 0,
            total_stores=total_stores or 0,
            total_orders=total_orders or 0,
            total_products=total_products or 0,
            pending_kyc=pending_kyc or 0
        )

    @staticmethod
    async def list_pending_kyc(db: AsyncSession, page: int, size: int) -> Tuple[List[Business], int]:
        stmt = select(Business).where(Business.kyc_status == KYCStatus.UNDER_REVIEW).order_by(Business.created_at.asc())
        count_stmt = select(func.count()).where(Business.kyc_status == KYCStatus.UNDER_REVIEW)
        
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        
        total = await db.execute(count_stmt)
        result = await db.execute(stmt)
        
        return list(result.scalars().all()), total.scalar_one()

    @staticmethod
    async def review_kyc(db: AsyncSession, data: KYCReviewRequest) -> KYCReviewResponse:
        if data.decision not in (KYCStatus.VERIFIED, KYCStatus.REJECTED):
            raise BadRequestException("Decision must be VERIFIED or REJECTED")

        result = await db.execute(select(Business).where(Business.id == data.business_id))
        business = result.scalar_one_or_none()

        if not business:
            raise NotFoundException("Business not found")

        reviewed_at = datetime.now(timezone.utc)
        business.kyc_status = data.decision
        business.kyc_reviewed_at = reviewed_at

        await db.commit()

        try:
            from app.notifications.service import NotificationService
            await NotificationService.dispatch_kyc_status(db, business, data.decision.value, data.notes)
        except Exception:
            await db.rollback()

        return KYCReviewResponse(
            business_id=business.id,
            kyc_status=business.kyc_status,
            reviewed_at=reviewed_at,
        )

    @staticmethod
    async def list_all_orders(db: AsyncSession, page: int, size: int, status: Optional[OrderStatus] = None) -> Tuple[List[Order], int]:
        stmt = select(Order).options(
            selectinload(Order.vendor_orders).selectinload(VendorOrder.items)
        ).order_by(Order.created_at.desc())
        count_stmt = select(func.count()).select_from(Order)
        
        if status:
            stmt = stmt.where(Order.status == status)
            count_stmt = count_stmt.where(Order.status == status)
            
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        
        total = await db.execute(count_stmt)
        result = await db.execute(stmt)
        
        return list(result.scalars().all()), total.scalar_one()
