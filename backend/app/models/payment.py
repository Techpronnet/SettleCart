from sqlalchemy import String, ForeignKey, Numeric, DateTime, JSON, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, Any
from app.models.base import Base, TimestampMixin, generate_uuid
from app.models.enums import PaymentStatus

class PaymentTransaction(TimestampMixin, Base):
    __tablename__ = "payment_transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    reference: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="NGN", nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(50), default="paystack", nullable=False)
    provider_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    channel: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    authorization_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    access_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    raw_response: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationship
    order: Mapped["Order"] = relationship(back_populates="payments", lazy="selectin")

