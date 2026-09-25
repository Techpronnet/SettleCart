import secrets
from uuid import UUID
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Tuple, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.delivery import DeliveryTask
from app.models.order import Order, VendorOrder
from app.models.user import User
from app.models.enums import DeliveryTaskStatus, VendorOrderStatus, OrderStatus, UserRole
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException, ForbiddenException
from app.dispatch.schemas import CustomerVerificationCodeResponse

class DispatchService:
    @staticmethod
    def _generate_verification_code() -> str:
        """Generate a cryptographically secure 6-digit numeric OTP code."""
        return f"{secrets.randbelow(900000) + 100000:06d}"

    @staticmethod
    async def create_delivery_task(db: AsyncSession, vendor_order_id: UUID) -> DeliveryTask:
        """
        Creates an operational delivery task when a vendor marks an order READY_FOR_PICKUP.
        Generates the SRS v1.1 delivery verification OTP code.
        """
        stmt = (
            select(VendorOrder)
            .options(
                selectinload(VendorOrder.store),
                selectinload(VendorOrder.order).selectinload(Order.customer),
                selectinload(VendorOrder.delivery_task),
            )
            .where(VendorOrder.id == vendor_order_id)
        )
        result = await db.execute(stmt)
        vendor_order = result.scalar_one_or_none()

        if not vendor_order:
            raise NotFoundException("Vendor order not found")

        if vendor_order.delivery_task:
            return vendor_order.delivery_task

        parent_order = vendor_order.order
        store = vendor_order.store

        # Pickup details from store
        pickup_address = store.address or "Store Pickup Address"
        pickup_city = store.city or "Lagos"
        pickup_phone = store.phone or "N/A"

        # Dropoff details from parent customer checkout
        dropoff_address = parent_order.delivery_address
        dropoff_city = parent_order.delivery_city
        dropoff_phone = parent_order.delivery_phone

        # Delivery fee allocation (pro-rated by subtotal if multiple stores)
        total_order_subtotal = parent_order.subtotal or Decimal("1.00")
        store_ratio = vendor_order.subtotal / total_order_subtotal if total_order_subtotal > 0 else Decimal("1.00")
        allocated_delivery_fee = (parent_order.delivery_fee * store_ratio).quantize(Decimal("0.01"))
        
        # Dispatch rider earnings (85% of delivery fee)
        dispatch_earnings = (allocated_delivery_fee * Decimal("0.85")).quantize(Decimal("0.01"))

        # Generate 6-digit OTP code valid for 24 hours
        otp_code = DispatchService._generate_verification_code()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        task = DeliveryTask(
            order_id=parent_order.id,
            vendor_order_id=vendor_order.id,
            status=DeliveryTaskStatus.PENDING,
            pickup_address=pickup_address,
            pickup_city=pickup_city,
            pickup_phone=pickup_phone,
            dropoff_address=dropoff_address,
            dropoff_city=dropoff_city,
            dropoff_phone=dropoff_phone,
            delivery_fee=allocated_delivery_fee,
            dispatch_earnings=dispatch_earnings,
            verification_code=otp_code,
            verification_attempts=0,
            max_verification_attempts=5,
            verification_code_expires_at=expires_at,
        )

        db.add(task)
        await db.commit()
        await db.refresh(task)
        full_task = await DispatchService.get_task(db, task.id)

        try:
            from app.notifications.service import NotificationService
            await NotificationService.dispatch_delivery_otp(db, full_task, otp_code)
        except Exception:
            pass

        return full_task

    @staticmethod
    async def get_task(db: AsyncSession, task_id: UUID) -> DeliveryTask:
        stmt = (
            select(DeliveryTask)
            .options(
                selectinload(DeliveryTask.order),
                selectinload(DeliveryTask.vendor_order).selectinload(VendorOrder.store),
                selectinload(DeliveryTask.rider),
            )
            .where(DeliveryTask.id == task_id)
        )
        result = await db.execute(stmt)
        task = result.scalar_one_or_none()
        if not task:
            raise NotFoundException("Delivery task not found")
        return task

    @staticmethod
    async def assign_rider(db: AsyncSession, task_id: UUID, rider_id: UUID) -> DeliveryTask:
        task = await DispatchService.get_task(db, task_id)

        if task.status not in [DeliveryTaskStatus.PENDING, DeliveryTaskStatus.ASSIGNED]:
            raise BadRequestException(f"Cannot assign rider to task in {task.status} status")

        # Verify rider validity
        rider_stmt = select(User).where(User.id == rider_id)
        rider_result = await db.execute(rider_stmt)
        rider = rider_result.scalar_one_or_none()

        if not rider:
            raise NotFoundException("Rider account not found")
        if rider.role != UserRole.DISPATCH:
            raise BadRequestException("User does not have DISPATCH rider permissions")
        if not rider.is_active:
            raise BadRequestException("Rider account is inactive")

        task.rider_id = rider_id
        task.rider_id = rider_id
        task.status = DeliveryTaskStatus.ASSIGNED
        task.assigned_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(task)

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=task.order_id,
                event_type="DISPATCH_TASK_UPDATED",
                data={
                    "task_id": str(task.id),
                    "status": task.status.value,
                    "rider_id": str(rider_id),
                    "assigned_at": task.assigned_at.isoformat() if task.assigned_at else None,
                },
            )
        except Exception:
            pass

        try:
            from app.notifications.service import NotificationService
            await NotificationService.dispatch_rider_assigned(db, task)
        except Exception:
            pass

        return task

    @staticmethod
    async def accept_task(db: AsyncSession, task_id: UUID, rider_id: UUID) -> DeliveryTask:
        task = await DispatchService.get_task(db, task_id)

        if task.rider_id != rider_id:
            raise ForbiddenException("You are not the assigned rider for this delivery task")

        if task.status != DeliveryTaskStatus.ASSIGNED:
            raise BadRequestException(f"Cannot accept task in {task.status} status")

        task.status = DeliveryTaskStatus.ACCEPTED
        task.accepted_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(task)

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=task.order_id,
                event_type="DISPATCH_TASK_UPDATED",
                data={
                    "task_id": str(task.id),
                    "status": task.status.value,
                    "accepted_at": task.accepted_at.isoformat() if task.accepted_at else None,
                },
            )
        except Exception:
            pass

        return task

    @staticmethod
    async def confirm_pickup(db: AsyncSession, task_id: UUID, rider_id: UUID) -> DeliveryTask:
        task = await DispatchService.get_task(db, task_id)

        if task.rider_id != rider_id:
            raise ForbiddenException("You are not the assigned rider for this delivery task")

        if task.status not in [DeliveryTaskStatus.ACCEPTED, DeliveryTaskStatus.ASSIGNED]:
            raise BadRequestException(f"Cannot confirm pickup for task in {task.status} status")

        task.status = DeliveryTaskStatus.PICKED_UP
        task.picked_up_at = datetime.now(timezone.utc)

        # Sync vendor order status
        if task.vendor_order:
            task.vendor_order.status = VendorOrderStatus.PICKED_UP

        await db.commit()
        await db.refresh(task)

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=task.order_id,
                event_type="DISPATCH_TASK_UPDATED",
                data={
                    "task_id": str(task.id),
                    "status": task.status.value,
                    "picked_up_at": task.picked_up_at.isoformat() if task.picked_up_at else None,
                },
            )
        except Exception:
            pass

        return task

    @staticmethod
    async def start_delivery(db: AsyncSession, task_id: UUID, rider_id: UUID) -> DeliveryTask:
        task = await DispatchService.get_task(db, task_id)

        if task.rider_id != rider_id:
            raise ForbiddenException("You are not the assigned rider for this delivery task")

        if task.status != DeliveryTaskStatus.PICKED_UP:
            raise BadRequestException(f"Cannot start delivery from {task.status} status; pickup must be confirmed first")

        task.status = DeliveryTaskStatus.IN_TRANSIT
        await db.commit()
        await db.refresh(task)

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=task.order_id,
                event_type="DISPATCH_TASK_UPDATED",
                data={
                    "task_id": str(task.id),
                    "status": task.status.value,
                },
            )
        except Exception:
            pass

        return task

    @staticmethod
    async def verify_and_complete_delivery(
        db: AsyncSession, task_id: UUID, rider_id: UUID, submitted_code: str
    ) -> DeliveryTask:
        """
        SRS v1.1 Handover verification:
        Validates the customer-provided OTP submitted by the dispatch rider.
        On success, transitions delivery task, vendor order, and parent order to DELIVERED.
        """
        task = await DispatchService.get_task(db, task_id)

        if task.rider_id != rider_id:
            raise ForbiddenException("You are not authorized to submit verification for this task")

        if task.status == DeliveryTaskStatus.DELIVERED:
            raise BadRequestException("Delivery has already been verified and completed")

        if task.status not in [DeliveryTaskStatus.IN_TRANSIT, DeliveryTaskStatus.PICKED_UP]:
            raise BadRequestException(f"Cannot verify delivery while task is in {task.status} status")

        # Check maximum verification attempts
        if task.verification_attempts >= task.max_verification_attempts:
            raise ForbiddenException(
                "Maximum verification attempts exceeded. Delivery is locked for administrative review."
            )

        # Check OTP expiration
        now = datetime.now(timezone.utc)
        expires_at = task.verification_code_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now > expires_at:
            raise BadRequestException(
                "Verification code has expired. The customer must request a refreshed verification code."
            )

        # Compare submitted code with stored OTP
        if submitted_code.strip() != task.verification_code.strip():
            task.verification_attempts += 1
            remaining = task.max_verification_attempts - task.verification_attempts
            await db.commit()
            if remaining <= 0:
                raise ForbiddenException("Invalid code. Verification attempts exhausted; order locked for review.")
            raise BadRequestException(f"Invalid verification code. {remaining} attempt(s) remaining.")

        # SUCCESSFUL VERIFICATION
        task.status = DeliveryTaskStatus.DELIVERED
        task.delivered_at = now
        task.verification_code_verified_at = now

        # Update child vendor order status
        if task.vendor_order:
            task.vendor_order.status = VendorOrderStatus.DELIVERED

        # Check parent order: if all vendor orders are delivered, update parent order status
        parent_order_stmt = (
            select(Order)
            .options(selectinload(Order.vendor_orders))
            .where(Order.id == task.order_id)
        )
        order_res = await db.execute(parent_order_stmt)
        parent_order = order_res.scalar_one_or_none()

        if parent_order:
            all_done = all(vo.status == VendorOrderStatus.DELIVERED for vo in parent_order.vendor_orders)
            if all_done:
                parent_order.status = OrderStatus.DELIVERED

        await db.commit()

        # Automatic Settlement Trigger (SRS §10.2 / FR-FIN-001)
        try:
            from app.wallets.service import WalletService
            await WalletService.settle_delivered_vendor_order(db, task.vendor_order_id)
        except Exception:
            pass

        try:
            from app.notifications.service import NotificationService
            await NotificationService.dispatch_delivery_completed(db, task)
        except Exception:
            pass

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=task.order_id,
                event_type="DELIVERY_COMPLETED",
                data={
                    "task_id": str(task.id),
                    "status": task.status.value,
                    "delivered_at": task.delivered_at.isoformat() if task.delivered_at else None,
                },
            )
        except Exception:
            pass

        await db.refresh(task)
        return task


    @staticmethod
    async def report_failure(
        db: AsyncSession, task_id: UUID, rider_id: UUID, reason: str, notes: Optional[str] = None
    ) -> DeliveryTask:
        task = await DispatchService.get_task(db, task_id)

        if task.rider_id != rider_id:
            raise ForbiddenException("You are not authorized to update this delivery task")

        if task.status in [DeliveryTaskStatus.DELIVERED, DeliveryTaskStatus.CANCELLED]:
            raise BadRequestException(f"Cannot mark {task.status} task as failed")

        task.status = DeliveryTaskStatus.FAILED
        task.failed_at = datetime.now(timezone.utc)
        task.failure_reason = reason
        task.notes = notes

        await db.commit()
        await db.refresh(task)

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=task.order_id,
                event_type="DISPATCH_TASK_UPDATED",
                data={
                    "task_id": str(task.id),
                    "status": task.status.value,
                    "failure_reason": task.failure_reason,
                },
            )
        except Exception:
            pass

        return task

    @staticmethod
    async def update_rider_location(
        db: AsyncSession,
        task_id: UUID,
        rider_id: UUID,
        latitude: float,
        longitude: float,
        heading: Optional[float] = None,
        speed: Optional[float] = None,
    ) -> dict[str, Any]:
        """
        Validates rider assignment and streams high-frequency GPS telemetry
        to Redis and connected live tracking listeners.
        """
        task = await DispatchService.get_task(db, task_id)

        if task.rider_id != rider_id:
            raise ForbiddenException("You are not authorized to stream location for this delivery task")

        if task.status not in [DeliveryTaskStatus.ACCEPTED, DeliveryTaskStatus.PICKED_UP, DeliveryTaskStatus.IN_TRANSIT]:
            raise BadRequestException(f"Cannot stream location for delivery task in {task.status} status")

        from app.realtime.pubsub import RealtimePubSubService
        return await RealtimePubSubService.update_rider_location(
            task_id=task.id,
            order_id=task.order_id,
            latitude=latitude,
            longitude=longitude,
            heading=heading,
            speed=speed,
        )

    @staticmethod
    async def get_customer_verification_code(
        db: AsyncSession, task_id: UUID, user: User
    ) -> CustomerVerificationCodeResponse:
        """
        Exposes the verification code ONLY to the customer who placed the order or an Admin.
        Never exposed to dispatch riders.
        """
        task = await DispatchService.get_task(db, task_id)

        is_owner = task.order.customer_id == user.id
        is_admin = user.role == UserRole.ADMIN

        if not (is_owner or is_admin):
            raise ForbiddenException("You do not have permission to view this delivery verification code")

        return CustomerVerificationCodeResponse(
            delivery_task_id=task.id,
            order_id=task.order_id,
            vendor_order_id=task.vendor_order_id,
            verification_code=task.verification_code,
            expires_at=task.verification_code_expires_at,
            is_verified=task.verification_code_verified_at is not None,
        )

    @staticmethod
    async def list_available_tasks(
        db: AsyncSession, city: Optional[str] = None, page: int = 1, size: int = 20
    ) -> Tuple[List[DeliveryTask], int]:
        """Lists unassigned tasks waiting for dispatch pickup."""
        stmt = (
            select(DeliveryTask)
            .options(
                selectinload(DeliveryTask.order),
                selectinload(DeliveryTask.vendor_order).selectinload(VendorOrder.store),
            )
            .where(DeliveryTask.status == DeliveryTaskStatus.PENDING)
        )
        if city:
            stmt = stmt.where(DeliveryTask.pickup_city.ilike(f"%{city}%"))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await db.scalar(count_stmt) or 0

        offset = (page - 1) * size
        stmt = stmt.order_by(DeliveryTask.created_at.desc()).offset(offset).limit(size)
        result = await db.execute(stmt)
        return list(result.scalars().all()), total

    @staticmethod
    async def list_rider_tasks(
        db: AsyncSession, rider_id: UUID, status: Optional[DeliveryTaskStatus] = None, page: int = 1, size: int = 20
    ) -> Tuple[List[DeliveryTask], int]:
        stmt = (
            select(DeliveryTask)
            .options(
                selectinload(DeliveryTask.order),
                selectinload(DeliveryTask.vendor_order).selectinload(VendorOrder.store),
            )
            .where(DeliveryTask.rider_id == rider_id)
        )
        if status:
            stmt = stmt.where(DeliveryTask.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await db.scalar(count_stmt) or 0

        offset = (page - 1) * size
        stmt = stmt.order_by(DeliveryTask.created_at.desc()).offset(offset).limit(size)
        result = await db.execute(stmt)
        return list(result.scalars().all()), total

    @staticmethod
    async def list_all_tasks(
        db: AsyncSession,
        status: Optional[DeliveryTaskStatus] = None,
        city: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[DeliveryTask], int]:
        stmt = (
            select(DeliveryTask)
            .options(
                selectinload(DeliveryTask.order),
                selectinload(DeliveryTask.vendor_order).selectinload(VendorOrder.store),
                selectinload(DeliveryTask.rider),
            )
        )
        if status:
            stmt = stmt.where(DeliveryTask.status == status)
        if city:
            stmt = stmt.where(DeliveryTask.dropoff_city.ilike(f"%{city}%"))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await db.scalar(count_stmt) or 0

        offset = (page - 1) * size
        stmt = stmt.order_by(DeliveryTask.created_at.desc()).offset(offset).limit(size)
        result = await db.execute(stmt)
        return list(result.scalars().all()), total
