from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.user import User
from app.models.enums import UserRole
from app.models.store import Store
from app.models.business import Business
from app.catalogue.schemas import (
    CategoryCreateRequest, CategoryUpdateRequest, CategoryResponse,
    ProductCreateRequest, ProductUpdateRequest, ProductResponse, ProductListResponse
)
from app.catalogue.service import CatalogueService

router = APIRouter(tags=["catalogue"])

async def check_store_ownership(db: AsyncSession, store_id: UUID, user: User) -> None:
    if user.role == UserRole.ADMIN:
        return
        
    stmt = select(Store, Business).join(Business, Store.business_id == Business.id).where(Store.id == store_id)
    result = await db.execute(stmt)
    row = result.first()
    
    if not row:
        raise NotFoundException("Store not found")
        
    store, business = row
    if business.owner_id != user.id:
        raise ForbiddenException("You do not own this store")

@router.post("/stores/{store_id}/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    store_id: UUID,
    data: CategoryCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    await check_store_ownership(db, store_id, user)
    return await CatalogueService.create_category(db, store_id, data)

@router.get("/stores/{store_id}/categories", response_model=List[CategoryResponse])
async def list_categories(store_id: UUID, db: AsyncSession = Depends(get_db)):
    return await CatalogueService.list_categories(db, store_id)

@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    data: CategoryUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    category = await CatalogueService.get_category(db, category_id)
    await check_store_ownership(db, category.store_id, user)
    return await CatalogueService.update_category(db, category, data)

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    category = await CatalogueService.get_category(db, category_id)
    await check_store_ownership(db, category.store_id, user)
    await CatalogueService.delete_category(db, category)

@router.post("/stores/{store_id}/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    store_id: UUID,
    data: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    await check_store_ownership(db, store_id, user)
    return await CatalogueService.create_product(db, store_id, data)

@router.get("/stores/{store_id}/products", response_model=ProductListResponse)
async def list_products(
    store_id: UUID,
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    products, total = await CatalogueService.list_products(db, store_id, page, size, category_id, search)
    return ProductListResponse(products=products, total=total, page=page, size=size)

@router.get("/products/search", response_model=ProductListResponse)
async def search_products(
    query: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    products, total = await CatalogueService.search_products(db, query, page, size)
    return ProductListResponse(products=products, total=total, page=page, size=size)

@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    return await CatalogueService.get_product(db, product_id)

@router.patch("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    data: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    product = await CatalogueService.get_product(db, product_id)
    await check_store_ownership(db, product.store_id, user)
    return await CatalogueService.update_product(db, product, data)

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    product = await CatalogueService.get_product(db, product_id)
    await check_store_ownership(db, product.store_id, user)
    await CatalogueService.delete_product(db, product)
