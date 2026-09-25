from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.enums import KYCStatus

class BusinessCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    business_type: str

class BusinessUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    business_type: Optional[str] = None
    tax_id: Optional[str] = None

class BusinessResponse(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    description: Optional[str]
    business_type: str
    kyc_status: KYCStatus
    cac_document_url: Optional[str] = None
    government_id_url: Optional[str] = None
    tax_id: Optional[str] = None
    kyc_submitted_at: Optional[datetime]
    kyc_reviewed_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class BusinessListResponse(BaseModel):
    businesses: list[BusinessResponse]
    total: int
    page: int
    size: int
