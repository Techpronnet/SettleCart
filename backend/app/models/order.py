from sqlalchemy import String, Text, ForeignKey, Integer, Numeric, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from decimal import Decimal
from app.models.base import Base, TimestampMixin, generate_uuid
from app.models.enums import OrderStatus, VendorOrderStatus

class Order(TimestampMixin, Base):
    __tablename__ = "orders"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    order_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus), default=OrderStatus.CREATED, nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    platform_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    delivery_city: Mapped[str] = mapped_column(String(100), nullable=False)
    delivery_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationships
    customer: Mapped["User"] = relationship(back_populates="orders", lazy="selectin")
    vendor_orders: Mapped[list["VendorOrder"]] = relationship(back_populates="order", lazy="selectin", cascade="all, delete-orphan")
    delivery_tasks: Mapped[list["DeliveryTask"]] = relationship(back_populates="order", lazy="selectin")
    payments: Mapped[list["PaymentTransaction"]] = relationship(back_populates="order", lazy="selectin", cascade="all, delete-orphan")


class VendorOrder(TimestampMixin, Base):
    __tablename__ = "vendor_orders"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    store_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stores.id"), nullable=False, index=True)
    status: Mapped[VendorOrderStatus] = mapped_column(SAEnum(VendorOrderStatus), default=VendorOrderStatus.PENDING, nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Relationships
    order: Mapped["Order"] = relationship(back_populates="vendor_orders", lazy="selectin")
    store: Mapped["Store"] = relationship(back_populates="vendor_orders", lazy="selectin")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="vendor_order", lazy="selectin", cascade="all, delete-orphan")
    delivery_task: Mapped["DeliveryTask | None"] = relationship(back_populates="vendor_order", uselist=False, lazy="selectin")


class OrderItem(TimestampMixin, Base):
    __tablename__ = "order_items"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    vendor_order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendor_orders.id"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Relationships
    vendor_order: Mapped["VendorOrder"] = relationship(back_populates="items", lazy="selectin")
    product: Mapped["Product"] = relationship(back_populates="order_items", lazy="selectin")
