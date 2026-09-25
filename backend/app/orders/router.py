from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.user import User
from app.models.enums import UserRole
from app.models.store import Store
from app.models.business import Business
from app.orders.schemas import (
    CreateOrderRequest, OrderResponse, OrderListResponse, VendorOrderResponse,
    UpdateOrderStatusRequest, UpdateVendorOrderStatusRequest
)
from app.orders.service import OrderService

router = APIRouter(tags=["orders"])

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

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await OrderService.create_order(db, user.id, data)

@router.get("/", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role == UserRole.ADMIN:
        from app.admin.service import AdminService
        orders, total = await AdminService.list_all_orders(db, page, size)
    else:
        orders, total = await OrderService.list_customer_orders(db, user.id, page, size)
        
    return OrderListResponse(orders=orders, total=total, page=page, size=size)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    order = await OrderService.get_order(db, order_id)
    
    if user.role == UserRole.ADMIN:
        return order
        
    if order.customer_id == user.id:
        return order
        
    # Check if user owns any store involved in the order
    for vendor_order in order.vendor_orders:
        try:
            await check_store_ownership(db, vendor_order.store_id, user)
            return order
        except ForbiddenException:
            pass
            
    raise ForbiddenException("You are not authorized to view this order")

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    data: UpdateOrderStatusRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ADMIN))
):
    order = await OrderService.get_order(db, order_id)
    return await OrderService.update_order_status(db, order, data.status)

@router.get("/vendor/{store_id}", response_model=List[VendorOrderResponse])
async def list_vendor_orders(
    store_id: UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    await check_store_ownership(db, store_id, user)
    vendor_orders, _ = await OrderService.list_vendor_orders(db, store_id, page, size)
    return vendor_orders

@router.patch("/vendor-orders/{vendor_order_id}/status", response_model=VendorOrderResponse)
async def update_vendor_order_status(
    vendor_order_id: UUID,
    data: UpdateVendorOrderStatusRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    from app.models.order import VendorOrder
    stmt = select(VendorOrder).where(VendorOrder.id == vendor_order_id)
    result = await db.execute(stmt)
    vendor_order = result.scalar_one_or_none()
    
    if not vendor_order:
        raise NotFoundException("Vendor order not found")
        
    await check_store_ownership(db, vendor_order.store_id, user)
    return await OrderService.update_vendor_order_status(db, vendor_order, data.status)
