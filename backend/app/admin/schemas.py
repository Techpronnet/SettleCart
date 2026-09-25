from pydantic import BaseModel, ConfigDict, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.enums import KYCStatus, UserRole

class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER

class DashboardStats(BaseModel):
    total_users: int
    total_businesses: int
    total_stores: int
    total_orders: int
    total_products: int
    pending_kyc: int

class KYCReviewRequest(BaseModel):
    business_id: UUID
    decision: KYCStatus
    notes: Optional[str] = None

class KYCReviewResponse(BaseModel):
    business_id: UUID
    kyc_status: KYCStatus
    reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)
