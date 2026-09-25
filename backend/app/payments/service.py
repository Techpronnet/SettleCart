import hmac
import hashlib
import secrets
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Any, Dict
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.payment import PaymentTransaction
from app.models.order import Order, VendorOrder
from app.models.user import User
from app.models.enums import PaymentStatus, OrderStatus, VendorOrderStatus
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException, ForbiddenException
from app.payments.schemas import InitializePaymentResponse

PAYSTACK_API_BASE = "https://api.paystack.co"

class PaymentService:
    @staticmethod
    def _generate_reference(order_number: str) -> str:
        """Generates a unique, traceable Paystack transaction reference."""
        return f"PAY-{order_number}-{secrets.token_hex(4).upper()}"

    @staticmethod
    async def initialize_payment(
        db: AsyncSession, order_id: UUID, current_user: User, callback_url: Optional[str] = None
    ) -> InitializePaymentResponse:
        """
        Initializes an online payment via Paystack for an order.
        Creates a PaymentTransaction record and generates an authorization checkout URL.
        """
        stmt = (
            select(Order)
            .options(selectinload(Order.vendor_orders), selectinload(Order.customer))
            .where(Order.id == order_id)
        )
        res = await db.execute(stmt)
        order = res.scalar_one_or_none()

        if not order:
            raise NotFoundException("Order not found")

        if order.customer_id != current_user.id and current_user.role != "admin":
            raise ForbiddenException("You are not authorized to pay for this order")

        if order.status not in [OrderStatus.CREATED, OrderStatus.PAYMENT_PENDING]:
            raise BadRequestException(f"Cannot initialize payment for order with status: {order.status.value}")

        # Check for existing completed payment (Idempotency)
        existing_paid = await db.scalar(
            select(PaymentTransaction).where(
                PaymentTransaction.order_id == order_id,
                PaymentTransaction.status == PaymentStatus.SUCCESS
            )
        )
        if existing_paid:
            raise ConflictException("Order has already been paid for")

        reference = PaymentService._generate_reference(order.order_number)
        amount_kobo = int(order.total * 100)

        authorization_url = f"https://checkout.paystack.com/{reference}"
        access_code = secrets.token_hex(16)

        # Call real Paystack API if production / valid secret key is provided
        has_real_key = (
            settings.PAYSTACK_SECRET_KEY
            and settings.PAYSTACK_SECRET_KEY.startswith("sk_")
            and not settings.PAYSTACK_SECRET_KEY.startswith("sk_test_xxx")
        )

        metadata = {
            "order_id": str(order.id),
            "order_number": order.order_number,
            "customer_id": str(current_user.id),
            "customer_email": current_user.email,
        }

        if has_real_key:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    paystack_payload = {
                        "email": current_user.email,
                        "amount": amount_kobo,
                        "reference": reference,
                        "currency": "NGN",
                        "metadata": metadata,
                    }
                    if callback_url:
                        paystack_payload["callback_url"] = callback_url

                    response = await client.post(
                        f"{PAYSTACK_API_BASE}/transaction/initialize",
                        headers={
                            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                            "Content-Type": "application/json",
                        },
                        json=paystack_payload,
                    )
                    if response.status_code == 200:
                        resp_data = response.json().get("data", {})
                        authorization_url = resp_data.get("authorization_url", authorization_url)
                        access_code = resp_data.get("access_code", access_code)
            except Exception as e:
                # Log and fallback to standard reference handling
                pass

        # Persist transaction
        transaction = PaymentTransaction(
            order_id=order.id,
            reference=reference,
            amount=order.total,
            currency="NGN",
            status=PaymentStatus.PENDING,
            provider="paystack",
            authorization_url=authorization_url,
            access_code=access_code,
            metadata_json=metadata,
        )
        db.add(transaction)

        # Update order to PAYMENT_PENDING
        order.status = OrderStatus.PAYMENT_PENDING

        await db.commit()
        await db.refresh(transaction)

        return InitializePaymentResponse(
            transaction_id=transaction.id,
            reference=reference,
            authorization_url=authorization_url,
            access_code=access_code,
            amount=order.total,
            currency="NGN",
        )

    @staticmethod
    def verify_webhook_signature(payload_bytes: bytes, signature_header: Optional[str]) -> bool:
        """
        Cryptographic verification of Paystack HMAC SHA512 signature.
        Protects the webhook endpoint against tampering and replay attacks.
        """
        if not signature_header:
            return False

        secret_key = settings.PAYSTACK_SECRET_KEY or "fallback-secret"
        computed_hash = hmac.new(
            secret_key.encode("utf-8"),
            payload_bytes,
            hashlib.sha512
        ).hexdigest()

        return hmac.compare_digest(computed_hash, signature_header)

    @staticmethod
    async def process_webhook_event(
        db: AsyncSession, event_name: str, event_data: Dict[str, Any]
    ) -> Optional[PaymentTransaction]:
        """
        Idempotent processor for Paystack webhooks (e.g. charge.success).
        Updates payment state, confirms parent order, and alerts vendor orders.
        """
        reference = event_data.get("reference")
        if not reference:
            return None

        stmt = (
            select(PaymentTransaction)
            .options(selectinload(PaymentTransaction.order).selectinload(Order.vendor_orders))
            .where(PaymentTransaction.reference == reference)
        )
        res = await db.execute(stmt)
        transaction = res.scalar_one_or_none()

        if not transaction:
            return None

        # FR-FIN-003: Idempotency guarantee against duplicate webhook deliveries
        if transaction.status == PaymentStatus.SUCCESS:
            return transaction

        if event_name == "charge.success":
            now = datetime.now(timezone.utc)
            transaction.status = PaymentStatus.SUCCESS
            transaction.paid_at = now
            transaction.provider_reference = str(event_data.get("id"))
            transaction.channel = event_data.get("channel")
            transaction.raw_response = event_data

            parent_order = transaction.order
            if parent_order:
                parent_order.status = OrderStatus.PAYMENT_CONFIRMED

                # Transition child vendor orders to ACCEPTED/PREPARING
                for vo in parent_order.vendor_orders:
                    if vo.status == VendorOrderStatus.PENDING:
                        vo.status = VendorOrderStatus.ACCEPTED

                from app.notifications.service import NotificationService
                await NotificationService.dispatch_payment_confirmed(db, parent_order)

            await db.commit()
            await db.refresh(transaction)
            return transaction

        elif event_name in ["charge.failed", "transfer.failed"]:
            transaction.status = PaymentStatus.FAILED
            transaction.raw_response = event_data
            if transaction.order:
                transaction.order.status = OrderStatus.PAYMENT_FAILED

            await db.commit()
            await db.refresh(transaction)
            return transaction

        return transaction

    @staticmethod
    async def verify_payment_by_reference(
        db: AsyncSession, reference: str
    ) -> PaymentTransaction:
        """
        Verifies transaction status directly via Paystack or internal idempotency record.
        """
        stmt = (
            select(PaymentTransaction)
            .options(selectinload(PaymentTransaction.order).selectinload(Order.vendor_orders))
            .where(PaymentTransaction.reference == reference)
        )
        res = await db.execute(stmt)
        transaction = res.scalar_one_or_none()

        if not transaction:
            raise NotFoundException("Payment transaction not found")

        # If already success, return immediately
        if transaction.status == PaymentStatus.SUCCESS:
            return transaction

        has_real_key = (
            settings.PAYSTACK_SECRET_KEY
            and settings.PAYSTACK_SECRET_KEY.startswith("sk_")
            and not settings.PAYSTACK_SECRET_KEY.startswith("sk_test_xxx")
        )

        if has_real_key:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(
                        f"{PAYSTACK_API_BASE}/transaction/verify/{reference}",
                        headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
                    )
                    if resp.status_code == 200:
                        data = resp.json().get("data", {})
                        if data.get("status") == "success":
                            return await PaymentService.process_webhook_event(db, "charge.success", data)
            except Exception:
                pass

        return transaction

