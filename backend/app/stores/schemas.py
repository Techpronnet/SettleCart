from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class StoreCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    business_id: UUID

class StoreUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None

class StoreResponse(BaseModel):
    id: UUID
    business_id: UUID
    name: str
    slug: str
    description: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    logo_url: Optional[str]
    banner_url: Optional[str] = None
    is_published: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class StoreListResponse(BaseModel):
    stores: list[StoreResponse]
    total: int
    page: int
    size: int

from app.catalogue.schemas import ProductResponse

class ShowcaseResponse(BaseModel):
    stores: list[StoreResponse]
    products: list[ProductResponse]

