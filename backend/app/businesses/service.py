from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from datetime import datetime, timezone
from app.models.business import Business
from app.businesses.schemas import BusinessCreateRequest, BusinessUpdateRequest
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.enums import KYCStatus

class BusinessService:
    @staticmethod
    async def create(db: AsyncSession, owner_id: UUID, data: BusinessCreateRequest) -> Business:
        business = Business(
            owner_id=owner_id,
            name=data.name,
            description=data.description,
            business_type=data.business_type,
            kyc_status=KYCStatus.PENDING,
            is_active=True
        )
        db.add(business)
        await db.flush()
        return business

    @staticmethod
    async def get_by_id(db: AsyncSession, business_id: UUID) -> Business:
        stmt = select(Business).where(Business.id == business_id)
        result = await db.execute(stmt)
        business = result.scalar_one_or_none()
        if not business:
            raise NotFoundException("Business not found")
        return business

    @staticmethod
    async def get_by_owner(db: AsyncSession, owner_id: UUID) -> list[Business]:
        stmt = select(Business).where(Business.owner_id == owner_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def update(db: AsyncSession, business: Business, data: BusinessUpdateRequest) -> Business:
        if data.name is not None:
            business.name = data.name
        if data.description is not None:
            business.description = data.description
        if data.business_type is not None:
            business.business_type = data.business_type
        await db.flush()
        return business

    @staticmethod
    async def submit_kyc(db: AsyncSession, business: Business) -> Business:
        if not business.government_id_url:
            raise BadRequestException("Upload your government ID before submitting for verification")
        business.kyc_status = KYCStatus.UNDER_REVIEW
        business.kyc_submitted_at = datetime.now(timezone.utc)
        await db.flush()
        return business

    @staticmethod
    async def list_all(db: AsyncSession, page: int, size: int) -> tuple[list[Business], int]:
        count_stmt = select(func.count()).select_from(Business)
        count_result = await db.execute(count_stmt)
        total = count_result.scalar_one()
        
        offset = (page - 1) * size
        stmt = select(Business).offset(offset).limit(size)
        result = await db.execute(stmt)
        businesses = list(result.scalars().all())
        
        return businesses, total
