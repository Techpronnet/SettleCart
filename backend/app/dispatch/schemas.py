from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from app.models.enums import DeliveryTaskStatus

class DeliveryTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    vendor_order_id: UUID
    rider_id: Optional[UUID] = None
    status: DeliveryTaskStatus
    pickup_address: str
    pickup_city: str
    pickup_phone: str
    dropoff_address: str
    dropoff_city: str
    dropoff_phone: str
    delivery_fee: Decimal
    dispatch_earnings: Decimal
    assigned_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class DeliveryTaskDetailResponse(DeliveryTaskResponse):
    order_number: Optional[str] = None
    store_name: Optional[str] = None
    rider_name: Optional[str] = None
    rider_phone: Optional[str] = None

class CustomerVerificationCodeResponse(BaseModel):
    """
    Delivered securely ONLY to the authenticated customer or administrative reviewer.
    The assigned dispatch rider must never receive this response payload.
    """
    delivery_task_id: UUID
    order_id: UUID
    vendor_order_id: UUID
    verification_code: str
    expires_at: datetime
    is_verified: bool
    instructions: str = "Provide this 6-digit verification code to the dispatch rider upon physical package inspection."

class AssignRiderRequest(BaseModel):
    rider_id: UUID

class VerifyDeliveryCodeRequest(BaseModel):
    """
    Submitted by the assigned dispatch rider at the handover point.
    """
    code: str = Field(..., min_length=4, max_length=10, description="Customer-provided delivery verification code")

class ReportDeliveryFailureRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255, description="Root operational cause of delivery failure")
    notes: Optional[str] = None

class DeliveryTaskListResponse(BaseModel):
    tasks: List[DeliveryTaskResponse]
    total: int
    page: int
    size: int

class UpdateRiderLocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Current GPS latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Current GPS longitude")
    heading: Optional[float] = Field(None, ge=0.0, le=360.0, description="Compass heading in degrees")
    speed: Optional[float] = Field(None, ge=0.0, description="Current travel speed")

class RiderLocationResponse(BaseModel):
    task_id: UUID
    latitude: float
    longitude: float
    heading: Optional[float] = None
    speed: Optional[float] = None
    updated_at: str

