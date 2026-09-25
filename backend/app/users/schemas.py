from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.enums import UserRole

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    phone: Optional[str]
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    size: int
