import random
from uuid import UUID
from typing import Tuple, List, Optional
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.order import Order, VendorOrder, OrderItem
from app.models.catalogue import Product
from app.models.enums import OrderStatus, VendorOrderStatus, UserRole
from app.orders.schemas import (
    CreateOrderRequest, UpdateOrderStatusRequest, UpdateVendorOrderStatusRequest,
    DisputeOrderRequest, ResolveDisputeRequest
)
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException, ForbiddenException

ALLOWED_ORDER_TRANSITIONS = {
    OrderStatus.CREATED: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
    OrderStatus.PAYMENT_PENDING: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
    OrderStatus.PAYMENT_CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.REFUND_PENDING, OrderStatus.DISPUTED],
    OrderStatus.PROCESSING: [OrderStatus.PARTIALLY_READY, OrderStatus.READY_FOR_PICKUP, OrderStatus.DISPUTED],
    OrderStatus.PARTIALLY_READY: [OrderStatus.READY_FOR_PICKUP, OrderStatus.DISPUTED],
    OrderStatus.READY_FOR_PICKUP: [OrderStatus.DISPATCH_ASSIGNED, OrderStatus.DISPUTED],
    OrderStatus.DISPATCH_ASSIGNED: [OrderStatus.PICKED_UP, OrderStatus.DISPUTED],
    OrderStatus.PICKED_UP: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DISPUTED],
    OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.DISPUTED],
    OrderStatus.DELIVERED: [OrderStatus.SETTLED, OrderStatus.DISPUTED],
    OrderStatus.PAYMENT_FAILED: [],
    OrderStatus.CANCELLED: [],
    OrderStatus.REFUND_PENDING: [OrderStatus.REFUNDED],
    OrderStatus.REFUNDED: [],
    OrderStatus.DISPUTED: [OrderStatus.DELIVERED, OrderStatus.SETTLED, OrderStatus.REFUND_PENDING, OrderStatus.REFUNDED],
    OrderStatus.SETTLED: [OrderStatus.DISPUTED],
}

ALLOWED_VENDOR_ORDER_TRANSITIONS = {
    VendorOrderStatus.PENDING: [VendorOrderStatus.ACCEPTED, VendorOrderStatus.REJECTED, VendorOrderStatus.CANCELLED],
    VendorOrderStatus.ACCEPTED: [VendorOrderStatus.PREPARING, VendorOrderStatus.CANCELLED],
    VendorOrderStatus.PREPARING: [VendorOrderStatus.READY_FOR_PICKUP, VendorOrderStatus.CANCELLED],
    VendorOrderStatus.READY_FOR_PICKUP: [VendorOrderStatus.PICKED_UP, VendorOrderStatus.CANCELLED],
    VendorOrderStatus.PICKED_UP: [VendorOrderStatus.DELIVERED, VendorOrderStatus.CANCELLED],
    VendorOrderStatus.DELIVERED: [VendorOrderStatus.SETTLED, VendorOrderStatus.CANCELLED],
    VendorOrderStatus.REJECTED: [],
    VendorOrderStatus.SETTLED: [],
    VendorOrderStatus.CANCELLED: [],
}

class OrderService:
    @staticmethod
    async def create_order(db: AsyncSession, customer_id: UUID, data: CreateOrderRequest) -> Order:
        product_ids = [item.product_id for item in data.items]
        
        result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
        products = {p.id: p for p in result.scalars().all()}
        
        store_items = {}
        for item in data.items:
            product = products.get(item.product_id)
            if not product:
                raise NotFoundException(f"Product {item.product_id} not found")
            if not product.is_published or not product.is_active:
                raise BadRequestException(f"Product {product.name} is not available")
                
            if product.track_inventory and product.inventory_count < item.quantity:
                raise ConflictException(f"Insufficient inventory for {product.name}")
                
            store_id = product.store_id
            if store_id not in store_items:
                store_items[store_id] = []
            store_items[store_id].append((product, item.quantity))
            
        order_number = f"ORD-{random.randint(100000, 999999)}"
        
        # In a real app, fee calculation would be more complex
        delivery_fee = Decimal('5.00')
        platform_fee = Decimal('2.00')
        order_subtotal = Decimal('0.00')
        
        order = Order(
            order_number=order_number,
            customer_id=customer_id,
            status=OrderStatus.CREATED,
            subtotal=Decimal('0.00'), # Will update below
            delivery_fee=delivery_fee,
            platform_fee=platform_fee,
            total=Decimal('0.00'),
            delivery_address=data.delivery_address,
            delivery_city=data.delivery_city,
            delivery_phone=data.delivery_phone,
            notes=data.notes
        )
        db.add(order)
        await db.flush()
        
        for store_id, items in store_items.items():
            vendor_subtotal = Decimal('0.00')
            vendor_order = VendorOrder(
                order_id=order.id,
                store_id=store_id,
                status=VendorOrderStatus.PENDING,
                subtotal=Decimal('0.00')
            )
            db.add(vendor_order)
            await db.flush()
            
            for product, quantity in items:
                subtotal = product.price * quantity
                vendor_subtotal += subtotal
                
                order_item = OrderItem(
                    vendor_order_id=vendor_order.id,
                    product_id=product.id,
                    product_name=product.name,
                    product_price=product.price,
                    quantity=quantity,
                    subtotal=subtotal
                )
                db.add(order_item)
                
                if product.track_inventory:
                    product.inventory_count -= quantity
                    
            vendor_order.subtotal = vendor_subtotal
            order_subtotal += vendor_subtotal
            
        order.subtotal = order_subtotal
        order.total = order_subtotal + delivery_fee + platform_fee
        
        await db.commit()
        await db.refresh(order, ['vendor_orders'])
        return await OrderService.get_order(db, order.id)

    @staticmethod
    async def get_order(db: AsyncSession, order_id: UUID) -> Order:
        stmt = select(Order).options(
            selectinload(Order.vendor_orders).selectinload(VendorOrder.items)
        ).where(Order.id == order_id)
        
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundException("Order not found")
        return order

    @staticmethod
    async def get_order_by_number(db: AsyncSession, order_number: str) -> Order:
        stmt = select(Order).options(
            selectinload(Order.vendor_orders).selectinload(VendorOrder.items)
        ).where(Order.order_number == order_number)
        
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundException("Order not found")
        return order

    @staticmethod
    async def list_customer_orders(db: AsyncSession, customer_id: UUID, page: int, size: int) -> Tuple[List[Order], int]:
        stmt = select(Order).options(
            selectinload(Order.vendor_orders).selectinload(VendorOrder.items)
        ).where(Order.customer_id == customer_id).order_by(Order.created_at.desc())
        
        count_stmt = select(func.count()).where(Order.customer_id == customer_id)
        
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        
        total = await db.execute(count_stmt)
        result = await db.execute(stmt)
        
        return list(result.scalars().all()), total.scalar_one()

    @staticmethod
    async def list_vendor_orders(db: AsyncSession, store_id: UUID, page: int, size: int) -> Tuple[List[VendorOrder], int]:
        stmt = select(VendorOrder).options(
            selectinload(VendorOrder.items)
        ).where(VendorOrder.store_id == store_id).order_by(VendorOrder.created_at.desc())
        
        count_stmt = select(func.count()).where(VendorOrder.store_id == store_id)
        
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        
        total = await db.execute(count_stmt)
        result = await db.execute(stmt)
        
        return list(result.scalars().all()), total.scalar_one()

    @staticmethod
    async def update_order_status(db: AsyncSession, order: Order, new_status: OrderStatus) -> Order:
        if new_status not in ALLOWED_ORDER_TRANSITIONS.get(order.status, []):
            raise BadRequestException(f"Cannot transition order from {order.status} to {new_status}")
            
        old_status = order.status
        order.status = new_status
        await db.commit()
        await db.refresh(order)

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=order.id,
                event_type="ORDER_STATUS_CHANGED",
                data={
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "old_status": old_status.value,
                    "new_status": new_status.value,
                },
            )
        except Exception:
            pass

        return order

    @staticmethod
    async def update_vendor_order_status(db: AsyncSession, vendor_order: VendorOrder, new_status: VendorOrderStatus) -> VendorOrder:
        if new_status not in ALLOWED_VENDOR_ORDER_TRANSITIONS.get(vendor_order.status, []):
            raise BadRequestException(f"Cannot transition vendor order from {vendor_order.status} to {new_status}")
            
        old_status = vendor_order.status
        vendor_order.status = new_status
        await db.commit()
        await db.refresh(vendor_order)

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=vendor_order.order_id,
                event_type="VENDOR_ORDER_STATUS_CHANGED",
                data={
                    "vendor_order_id": str(vendor_order.id),
                    "store_id": str(vendor_order.store_id),
                    "old_status": old_status.value,
                    "new_status": new_status.value,
                },
            )
        except Exception:
            pass

        return vendor_order

    @staticmethod
    async def dispute_order(db: AsyncSession, order_id: UUID, user: User, data: DisputeOrderRequest) -> Order:
        """
        Customer dispute submission: transitions eligible order to DISPUTED status,
        appends dispute reason and statement to order record, and broadcasts real-time telemetry.
        """
        order = await OrderService.get_order(db, order_id)
        if order.customer_id != user.id and user.role != UserRole.ADMIN:
            raise ForbiddenException("Only the customer who placed this order can raise a dispute")

        disputable_statuses = [
            OrderStatus.PAYMENT_CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.PARTIALLY_READY,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.DISPATCH_ASSIGNED,
            OrderStatus.PICKED_UP,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.DELIVERED,
            OrderStatus.SETTLED,
        ]
        if order.status not in disputable_statuses:
            raise BadRequestException(f"Order cannot be disputed in status '{order.status.value}'")

        from datetime import datetime, timezone
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        dispute_note = f"\n[DISPUTE ({now_str}) - {data.reason}]: {data.details}"
        order.notes = (order.notes or "") + dispute_note
        order.status = OrderStatus.DISPUTED

        await db.commit()
        await db.refresh(order)

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=order.id,
                event_type="ORDER_DISPUTED",
                data={
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "reason": data.reason,
                    "new_status": OrderStatus.DISPUTED.value,
                },
            )
        except Exception:
            pass

        return order

    @staticmethod
    async def resolve_dispute(db: AsyncSession, order_id: UUID, admin_user: User, data: ResolveDisputeRequest) -> Order:
        """
        Administrative dispute mediation:
        - 'refund': Marks order REFUNDED and vendor orders CANCELLED.
        - 'dismiss': Restores order to DELIVERED so settlement can proceed.
        """
        order = await OrderService.get_order(db, order_id)
        if order.status != OrderStatus.DISPUTED:
            raise BadRequestException(f"Order is not in DISPUTED status (current: {order.status.value})")

        from datetime import datetime, timezone
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        action = data.action.lower()

        if action == "refund":
            resolution_text = data.resolution_notes or "Dispute resolved with full refund approved."
            order.notes = (order.notes or "") + f"\n[DISPUTE RESOLUTION ({now_str}) - REFUND]: {resolution_text}"
            order.status = OrderStatus.REFUNDED

            for vo in order.vendor_orders:
                vo.status = VendorOrderStatus.CANCELLED

        elif action == "dismiss":
            resolution_text = data.resolution_notes or "Dispute investigated and dismissed. Order restored."
            order.notes = (order.notes or "") + f"\n[DISPUTE RESOLUTION ({now_str}) - DISMISSED]: {resolution_text}"
            order.status = OrderStatus.DELIVERED

        else:
            raise BadRequestException("Invalid dispute resolution action; must be 'refund' or 'dismiss'")

        await db.commit()
        await db.refresh(order)

        try:
            from app.realtime.pubsub import RealtimePubSubService
            await RealtimePubSubService.publish_order_event(
                order_id=order.id,
                event_type="ORDER_STATUS_CHANGED",
                data={
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "new_status": order.status.value,
                    "resolution": action,
                },
            )
        except Exception:
            pass

        return order

