from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.enums import OrderStatus, VendorOrderStatus

class CartItem(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1)

class CreateOrderRequest(BaseModel):
    items: List[CartItem]
    delivery_address: str
    delivery_city: str
    delivery_phone: str
    notes: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: UUID
    vendor_order_id: UUID
    product_id: UUID
    product_name: str
    product_price: Decimal
    quantity: int
    subtotal: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VendorOrderResponse(BaseModel):
    id: UUID
    order_id: UUID
    store_id: UUID
    status: VendorOrderStatus
    subtotal: Decimal
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]
    store_name: Optional[str] = None # Will be populated if possible

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    customer_id: UUID
    status: OrderStatus
    subtotal: Decimal
    delivery_fee: Decimal
    platform_fee: Decimal
    total: Decimal
    delivery_address: str
    delivery_city: str
    delivery_phone: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    vendor_orders: List[VendorOrderResponse]

    model_config = ConfigDict(from_attributes=True)

class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    size: int

class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus

class UpdateVendorOrderStatusRequest(BaseModel):
    status: VendorOrderStatus
