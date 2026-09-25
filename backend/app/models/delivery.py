from sqlalchemy import String, Text, ForeignKey, Integer, Numeric, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from decimal import Decimal
from datetime import datetime
from app.models.base import Base, TimestampMixin, generate_uuid
from app.models.enums import DeliveryTaskStatus

class DeliveryTask(TimestampMixin, Base):
    __tablename__ = "delivery_tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    vendor_order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendor_orders.id"), unique=True, nullable=False, index=True)
    rider_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    status: Mapped[DeliveryTaskStatus] = mapped_column(SAEnum(DeliveryTaskStatus), default=DeliveryTaskStatus.PENDING, nullable=False, index=True)

    # Pickup Details (Store / Vendor Location)
    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)
    pickup_city: Mapped[str] = mapped_column(String(100), nullable=False)
    pickup_phone: Mapped[str] = mapped_column(String(20), nullable=False)

    # Dropoff Details (Customer Delivery Location)
    dropoff_address: Mapped[str] = mapped_column(Text, nullable=False)
    dropoff_city: Mapped[str] = mapped_column(String(100), nullable=False)
    dropoff_phone: Mapped[str] = mapped_column(String(20), nullable=False)

    # Financials
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    dispatch_earnings: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)

    # SRS v1.1 Delivery Verification Code (Customer-provided OTP)
    verification_code: Mapped[str] = mapped_column(String(10), nullable=False)
    verification_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_verification_attempts: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    verification_code_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    verification_code_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Lifecycle Milestones & Operational Tracking
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    picked_up_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship(back_populates="delivery_tasks", lazy="selectin")
    vendor_order: Mapped["VendorOrder"] = relationship(back_populates="delivery_task", lazy="selectin")
    rider: Mapped["User | None"] = relationship(back_populates="delivery_tasks", lazy="selectin")

