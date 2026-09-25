from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional, Any, Dict
from app.models.enums import PaymentStatus

class InitializePaymentRequest(BaseModel):
    order_id: UUID
    callback_url: Optional[str] = None

class InitializePaymentResponse(BaseModel):
    transaction_id: UUID
    reference: str
    authorization_url: str
    access_code: Optional[str] = None
    amount: Decimal
    currency: str = "NGN"

class PaymentTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    reference: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    provider: str
    provider_reference: Optional[str] = None
    channel: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class PaystackWebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]

