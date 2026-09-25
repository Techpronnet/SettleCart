import logging
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.models.notification import Notification
from app.models.enums import NotificationChannel, NotificationEventType
from app.models.user import User
from app.models.order import Order
from app.models.delivery import DeliveryTask
from app.models.business import Business
from app.models.wallet import WithdrawalRequest
from app.core.exceptions import NotFoundException, ForbiddenException
from app.tasks.email import send_email_notification
from app.tasks.sms import send_sms_notification
import app.tasks.templates as templates

logger = logging.getLogger(__name__)

def safe_dispatch_task(task_func, *args, **kwargs):
    """Dispatches a Celery task asynchronously with fallback for isolated/test environments."""
    try:
        task_func.delay(*args, **kwargs)
    except Exception as exc:
        logger.debug("Celery broker unavailable or test mode: %s. Executing task synchronously.", exc)
        try:
            task_func(*args, **kwargs)
        except Exception as inner:
            logger.error("Failed executing task %s: %s", task_func, inner)

class NotificationService:
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: UUID,
        title: str,
        message: str,
        channel: NotificationChannel = NotificationChannel.IN_APP,
        event_type: NotificationEventType = NotificationEventType.GENERAL,
        data: Optional[dict[str, Any]] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            channel=channel,
            event_type=event_type,
            data=data or {},
            is_read=False,
        )
        db.add(notification)
        await db.flush()
        return notification

    @staticmethod
    async def list_user_notifications(
        db: AsyncSession,
        user_id: UUID,
        is_read: Optional[bool] = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Notification], int, int]:
        query = select(Notification).where(Notification.user_id == user_id)
        if is_read is not None:
            query = query.where(Notification.is_read == is_read)

        query = query.order_by(Notification.created_at.desc()).offset((page - 1) * size).limit(size)
        result = await db.execute(query)
        notifications = list(result.scalars().all())

        # Total matching
        count_stmt = select(func.count()).select_from(Notification).where(Notification.user_id == user_id)
        if is_read is not None:
            count_stmt = count_stmt.where(Notification.is_read == is_read)
        total = (await db.scalar(count_stmt)) or 0

        # Unread count
        unread_stmt = select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id, Notification.is_read == False
        )
        unread_count = (await db.scalar(unread_stmt)) or 0

        return notifications, total, unread_count

    @staticmethod
    async def get_unread_count(db: AsyncSession, user_id: UUID) -> int:
        stmt = select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id, Notification.is_read == False
        )
        return (await db.scalar(stmt)) or 0

    @staticmethod
    async def mark_as_read(db: AsyncSession, notification_id: UUID, user_id: UUID) -> Notification:
        stmt = select(Notification).where(Notification.id == notification_id)
        res = await db.execute(stmt)
        notification = res.scalar_one_or_none()

        if not notification:
            raise NotFoundException("Notification not found")
        if notification.user_id != user_id:
            raise ForbiddenException("You cannot access this notification")

        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await db.flush()
        return notification

    @staticmethod
    async def mark_all_read(db: AsyncSession, user_id: UUID) -> int:
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        result = await db.execute(stmt)
        await db.flush()
        return result.rowcount

    # ---------------------------------------------------------
    # Lifecycle Domain Event Dispatchers
    # ---------------------------------------------------------

    @staticmethod
    async def dispatch_payment_confirmed(db: AsyncSession, order: Order):
        """Sends order confirmation to the customer and alerts each vendor."""
        # 1. Customer notification
        stmt = select(User).where(User.id == order.customer_id)
        cust = (await db.execute(stmt)).scalar_one_or_none()
        if cust:
            tmpl = templates.order_confirmed_template(
                customer_name=cust.full_name,
                order_number=order.order_number,
                total_amount=float(order.total),
            )
            # In-App
            await NotificationService.create_notification(
                db,
                user_id=cust.id,
                title=tmpl["subject"],
                message=tmpl["sms"],
                channel=NotificationChannel.IN_APP,
                event_type=NotificationEventType.PAYMENT_CONFIRMED,
                data={"order_id": str(order.id), "order_number": order.order_number},
            )
            # Email & SMS
            if cust.email:
                safe_dispatch_task(send_email_notification, cust.email, tmpl["subject"], tmpl["html"])
            if cust.phone:
                safe_dispatch_task(send_sms_notification, cust.phone, tmpl["sms"])

        # 2. Vendors notifications
        for vo in order.vendor_orders:
            if vo.store and vo.store.business:
                vendor_owner_id = vo.store.business.owner_id
                vendor_stmt = select(User).where(User.id == vendor_owner_id)
                vendor_user = (await db.execute(vendor_stmt)).scalar_one_or_none()
                if vendor_user:
                    tmpl_vo = templates.vendor_order_template(
                        store_name=vo.store.name,
                        order_number=order.order_number,
                        subtotal=float(vo.subtotal),
                    )
                    await NotificationService.create_notification(
                        db,
                        user_id=vendor_user.id,
                        title=tmpl_vo["subject"],
                        message=tmpl_vo["sms"],
                        channel=NotificationChannel.IN_APP,
                        event_type=NotificationEventType.VENDOR_ORDER_ASSIGNED,
                        data={"vendor_order_id": str(vo.id), "order_id": str(order.id)},
                    )
                    if vendor_user.email:
                        safe_dispatch_task(send_email_notification, vendor_user.email, tmpl_vo["subject"], tmpl_vo["html"])
                    if vendor_user.phone:
                        safe_dispatch_task(send_sms_notification, vendor_user.phone, tmpl_vo["sms"])

    @staticmethod
    async def dispatch_delivery_otp(db: AsyncSession, task: DeliveryTask, otp_code: str):
        """Sends secure 6-digit delivery verification code strictly to the customer."""
        if not task.order:
            return
        stmt = select(User).where(User.id == task.order.customer_id)
        cust = (await db.execute(stmt)).scalar_one_or_none()
        if not cust:
            return

        store_name = task.vendor_order.store.name if task.vendor_order and task.vendor_order.store else None
        tmpl = templates.delivery_otp_template(
            customer_name=cust.full_name,
            order_number=task.order.order_number,
            otp_code=otp_code,
            store_name=store_name,
        )

        await NotificationService.create_notification(
            db,
            user_id=cust.id,
            title=tmpl["subject"],
            message=tmpl["sms"],
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEventType.DELIVERY_OTP_GENERATED,
            data={"task_id": str(task.id), "order_id": str(task.order_id)},
        )

        if cust.email:
            safe_dispatch_task(send_email_notification, cust.email, tmpl["subject"], tmpl["html"])
        if cust.phone:
            safe_dispatch_task(send_sms_notification, cust.phone, tmpl["sms"])

    @staticmethod
    async def dispatch_rider_assigned(db: AsyncSession, task: DeliveryTask):
        """Notifies the assigned dispatch rider of the new delivery task."""
        if not task.rider_id:
            return
        stmt = select(User).where(User.id == task.rider_id)
        rider = (await db.execute(stmt)).scalar_one_or_none()
        if not rider:
            return

        order_num = task.order.order_number if task.order else str(task.order_id)[:8]
        tmpl = templates.rider_assigned_template(
            rider_name=rider.full_name,
            order_number=order_num,
            pickup_address=f"{task.pickup_address}, {task.pickup_city}",
            dropoff_address=f"{task.dropoff_address}, {task.dropoff_city}",
            earnings=float(task.dispatch_earnings),
        )

        await NotificationService.create_notification(
            db,
            user_id=rider.id,
            title=tmpl["subject"],
            message=tmpl["sms"],
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEventType.DISPATCH_ASSIGNED,
            data={"task_id": str(task.id), "order_id": str(task.order_id)},
        )

        if rider.email:
            safe_dispatch_task(send_email_notification, rider.email, tmpl["subject"], tmpl["html"])
        if rider.phone:
            safe_dispatch_task(send_sms_notification, rider.phone, tmpl["sms"])

    @staticmethod
    async def dispatch_delivery_completed(db: AsyncSession, task: DeliveryTask):
        """Notifies customer and vendor that delivery has been verified and completed."""
        if not task.order:
            return
        # Customer
        stmt = select(User).where(User.id == task.order.customer_id)
        cust = (await db.execute(stmt)).scalar_one_or_none()
        if cust:
            tmpl = templates.delivery_completed_template(
                customer_name=cust.full_name,
                order_number=task.order.order_number,
            )
            await NotificationService.create_notification(
                db,
                user_id=cust.id,
                title=tmpl["subject"],
                message=tmpl["sms"],
                channel=NotificationChannel.IN_APP,
                event_type=NotificationEventType.DELIVERY_COMPLETED,
                data={"task_id": str(task.id), "order_id": str(task.order_id)},
            )
            if cust.email:
                safe_dispatch_task(send_email_notification, cust.email, tmpl["subject"], tmpl["html"])

    @staticmethod
    async def dispatch_settlement_credit(
        db: AsyncSession, user_id: UUID, amount: float, reference: str, account_role: str
    ):
        """Notifies vendor or dispatch rider of automated wallet settlement credit."""
        stmt = select(User).where(User.id == user_id)
        user = (await db.execute(stmt)).scalar_one_or_none()
        if not user:
            return

        tmpl = templates.settlement_credited_template(
            recipient_name=user.full_name,
            amount=amount,
            reference=reference,
            account_role=account_role,
        )

        await NotificationService.create_notification(
            db,
            user_id=user.id,
            title=tmpl["subject"],
            message=tmpl["sms"],
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEventType.SETTLEMENT_CREDITED,
            data={"amount": amount, "reference": reference},
        )

        if user.email:
            safe_dispatch_task(send_email_notification, user.email, tmpl["subject"], tmpl["html"])
        if user.phone:
            safe_dispatch_task(send_sms_notification, user.phone, tmpl["sms"])

    @staticmethod
    async def dispatch_kyc_status(db: AsyncSession, business: Business, status: str, notes: Optional[str] = None):
        """Notifies business owner of administrative KYC verification review."""
        stmt = select(User).where(User.id == business.owner_id)
        owner = (await db.execute(stmt)).scalar_one_or_none()
        if not owner:
            return

        tmpl = templates.kyc_status_template(business_name=business.name, status=status, notes=notes)

        await NotificationService.create_notification(
            db,
            user_id=owner.id,
            title=tmpl["subject"],
            message=tmpl["sms"],
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEventType.KYC_REVIEWED,
            data={"business_id": str(business.id), "status": status},
        )

        if owner.email:
            safe_dispatch_task(send_email_notification, owner.email, tmpl["subject"], tmpl["html"])

    @staticmethod
    async def dispatch_withdrawal_review(
        db: AsyncSession, withdrawal: WithdrawalRequest, action: str, reason: Optional[str] = None
    ):
        """Notifies user of withdrawal request review outcome."""
        if not withdrawal.wallet or not withdrawal.wallet.user_id:
            return
        stmt = select(User).where(User.id == withdrawal.wallet.user_id)
        user = (await db.execute(stmt)).scalar_one_or_none()
        if not user:
            return

        tmpl = templates.withdrawal_reviewed_template(
            user_name=user.full_name,
            amount=float(withdrawal.amount),
            status=action,
            reason=reason,
        )

        await NotificationService.create_notification(
            db,
            user_id=user.id,
            title=tmpl["subject"],
            message=tmpl["sms"],
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEventType.WITHDRAWAL_PROCESSED,
            data={"withdrawal_id": str(withdrawal.id), "status": action},
        )

        if user.email:
            safe_dispatch_task(send_email_notification, user.email, tmpl["subject"], tmpl["html"])
