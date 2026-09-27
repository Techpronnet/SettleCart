from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.dependencies import get_db, get_current_user, require_role
from app.businesses.schemas import (
    BusinessCreateRequest, BusinessUpdateRequest, 
    BusinessResponse, BusinessListResponse
)
from app.businesses.service import BusinessService
from app.models.user import User
from app.models.enums import UserRole
from app.core.exceptions import ForbiddenException

router = APIRouter()

@router.post("", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def create_business(
    data: BusinessCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    business = await BusinessService.create(db, current_user.id, data)
    await db.commit()
    await db.refresh(business)
    return business

@router.get("", response_model=list[BusinessResponse])
@router.get("/", response_model=list[BusinessResponse])
async def list_own_businesses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await BusinessService.get_by_owner(db, current_user.id)

@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(
    business_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    business = await BusinessService.get_by_id(db, business_id)
    if business.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise ForbiddenException("You do not have access to this business")
    return business

@router.patch("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: UUID,
    data: BusinessUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    business = await BusinessService.get_by_id(db, business_id)
    if business.owner_id != current_user.id:
        raise ForbiddenException("You can only update your own business")
    updated = await BusinessService.update(db, business, data)
    await db.commit()
    await db.refresh(updated)
    return updated

@router.post("/{business_id}/kyc/submit", response_model=BusinessResponse)
async def submit_kyc(
    business_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    business = await BusinessService.get_by_id(db, business_id)
    if business.owner_id != current_user.id:
        raise ForbiddenException("You can only submit KYC for your own business")
    updated = await BusinessService.submit_kyc(db, business)
    await db.commit()
    await db.refresh(updated)
    return updated
