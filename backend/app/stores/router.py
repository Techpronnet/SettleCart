from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional
from app.core.dependencies import get_db, get_current_user, require_role
from app.stores.schemas import (
    StoreCreateRequest, StoreUpdateRequest, 
    StoreResponse, StoreListResponse
)
from app.stores.service import StoreService
from app.models.user import User
from app.models.enums import UserRole
from app.core.exceptions import ForbiddenException, NotFoundException
from sqlalchemy import select
from app.models.business import Business

router = APIRouter()

async def _verify_store_ownership(db: AsyncSession, store_id: UUID, user_id: UUID):
    store = await StoreService.get_by_id(db, store_id)
    stmt = select(Business).where(Business.id == store.business_id)
    result = await db.execute(stmt)
    business = result.scalar_one_or_none()
    
    if not business or business.owner_id != user_id:
        raise ForbiddenException("You don't own this store")
    return store

@router.post("/", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    data: StoreCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.VENDOR, UserRole.ADMIN))
):
    store = await StoreService.create(db, data, current_user.id)
    await db.commit()
    await db.refresh(store)
    return store

@router.get("/public", response_model=StoreListResponse)
async def list_published_stores(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    city: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stores, total = await StoreService.list_published(db, page, size, city)
    return StoreListResponse(stores=stores, total=total, page=page, size=size)

@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    store = await StoreService.get_by_id(db, store_id)
    if store.is_published:
        return store
        
    if not current_user:
        raise NotFoundException("Store not found")
        
    if current_user.role == UserRole.ADMIN:
        return store
        
    await _verify_store_ownership(db, store_id, current_user.id)
    return store

@router.get("/slug/{slug}", response_model=StoreResponse)
async def get_store_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    store = await StoreService.get_by_slug(db, slug)
    if not store.is_published:
        raise NotFoundException("Store not found")
    return store

@router.patch("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: UUID,
    data: StoreUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    store = await _verify_store_ownership(db, store_id, current_user.id)
    updated = await StoreService.update(db, store, data)
    await db.commit()
    await db.refresh(updated)
    return updated

@router.post("/{store_id}/publish", response_model=StoreResponse)
async def publish_store(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    store = await _verify_store_ownership(db, store_id, current_user.id)
    updated = await StoreService.publish(db, store)
    await db.commit()
    await db.refresh(updated)
    return updated

@router.post("/{store_id}/unpublish", response_model=StoreResponse)
async def unpublish_store(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    store = await _verify_store_ownership(db, store_id, current_user.id)
    updated = await StoreService.unpublish(db, store)
    await db.commit()
    await db.refresh(updated)
    return updated
