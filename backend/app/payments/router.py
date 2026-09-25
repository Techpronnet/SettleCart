from fastapi import APIRouter, Depends, Request, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional, List
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.payment import PaymentTransaction
from app.payments.schemas import (
    InitializePaymentRequest,
    InitializePaymentResponse,
    PaymentTransactionResponse,
)
from app.payments.service import PaymentService
from app.core.exceptions import UnauthorizedException
from app.core.config import settings
from app.core.limiter import limiter

router = APIRouter()

@router.post("/initialize", response_model=InitializePaymentResponse)
@limiter.limit(settings.RATE_LIMIT_PAYMENT_INIT)
async def initialize_payment(
    request: Request,
    data: InitializePaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Initiates payment checkout via Paystack for an order.
    Returns authorization URL and unique tracking reference.
    """
    return await PaymentService.initialize_payment(
        db, order_id=data.order_id, current_user=current_user, callback_url=data.callback_url
    )

@router.get("/verify/{reference}", response_model=PaymentTransactionResponse)
async def verify_payment(
    reference: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verifies payment status for a reference against Paystack and internal records.
    """
    return await PaymentService.verify_payment_by_reference(db, reference=reference)

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Secure Paystack Webhook Handler:
    Validates HMAC SHA512 signature using the configured Paystack secret key.
    Processes 'charge.success' idempotently to confirm order payments.
    """
    raw_body = await request.body()

    # Verify signature
    is_valid = PaymentService.verify_webhook_signature(raw_body, x_paystack_signature)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Paystack webhook signature"
        )

    event_payload = await request.json()
    event_name = event_payload.get("event")
    event_data = event_payload.get("data", {})

    if event_name and event_data:
        await PaymentService.process_webhook_event(db, event_name=event_name, event_data=event_data)

    return {"status": "success", "message": "Webhook processed successfully"}

@router.get("/order/{order_id}", response_model=List[PaymentTransactionResponse])
async def get_order_payments(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists all payment transaction attempts for a given order."""
    stmt = (
        select(PaymentTransaction)
        .where(PaymentTransaction.order_id == order_id)
        .order_by(PaymentTransaction.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
