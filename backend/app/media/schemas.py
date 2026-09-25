from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class MediaUploadResponse(BaseModel):
    url: str
    secure_url: str
    public_id: str
    format: str
    resource_type: str
    bytes: int
    width: Optional[int] = None
    height: Optional[int] = None

class PresignedUploadRequest(BaseModel):
    folder: str = "settlecart/general"
    resource_type: str = "image"
    is_private: bool = False

class PresignedUploadResponse(BaseModel):
    timestamp: int
    signature: str
    api_key: str
    cloud_name: str
    folder: str
    upload_url: str
    resource_type: str

class KYCDocumentUploadResponse(BaseModel):
    business_id: UUID
    document_type: str
    public_id: str
    secure_url: str
    message: str

class SignedUrlResponse(BaseModel):
    signed_url: str
    expires_in_seconds: int

