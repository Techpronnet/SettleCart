from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
from typing import Optional
from app.models.enums import UserRole

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    admin_secret: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one numerical digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one alphabetical character")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str
