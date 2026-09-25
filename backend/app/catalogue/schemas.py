from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    sort_order: int = 0

class CategoryCreateRequest(CategoryBase):
    pass

class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None

class CategoryResponse(CategoryBase):
    id: UUID
    store_id: UUID
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal = Field(gt=0)
    compare_at_price: Optional[Decimal] = None
    sku: Optional[str] = None
    category_id: Optional[UUID] = None
    track_inventory: bool = False
    inventory_count: int = 0
    images: Optional[List[str]] = None
    is_published: bool = True


class ProductCreateRequest(ProductBase):
    pass

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    compare_at_price: Optional[Decimal] = None
    sku: Optional[str] = None
    category_id: Optional[UUID] = None
    track_inventory: Optional[bool] = None
    inventory_count: Optional[int] = None
    images: Optional[List[str]] = None
    is_published: Optional[bool] = None

class ProductResponse(ProductBase):
    id: UUID
    store_id: UUID
    slug: str
    is_published: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    size: int
