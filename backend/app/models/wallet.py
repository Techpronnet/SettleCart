from sqlalchemy import String, ForeignKey, Numeric, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional
from app.models.base import Base, TimestampMixin, generate_uuid
from app.models.enums import LedgerEntryType, LedgerCategory, BalanceType, WithdrawalStatus

class Wallet(TimestampMixin, Base):
    __tablename__ = "wallets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), default="NGN", nullable=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="wallet", lazy="selectin")
    ledger_entries: Mapped[list["LedgerEntry"]] = relationship(back_populates="wallet", lazy="selectin", cascade="all, delete-orphan")
    withdrawals: Mapped[list["WithdrawalRequest"]] = relationship(back_populates="wallet", lazy="selectin", cascade="all, delete-orphan")

class LedgerEntry(Base):
    """
    Immutable, append-only financial ledger entry (SRS §10.3).
    All account balances (pending vs available) are derived dynamically from these records.
    """
    __tablename__ = "ledger_entries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    wallet_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("wallets.id"), nullable=False, index=True)
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("orders.id"), nullable=True, index=True)
    vendor_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("vendor_orders.id"), nullable=True, index=True)
    delivery_task_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("delivery_tasks.id"), nullable=True, index=True)

    entry_type: Mapped[LedgerEntryType] = mapped_column(SAEnum(LedgerEntryType), nullable=False)
    category: Mapped[LedgerCategory] = mapped_column(SAEnum(LedgerCategory), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    balance_type: Mapped[BalanceType] = mapped_column(SAEnum(BalanceType), default=BalanceType.AVAILABLE, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    reference: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    wallet: Mapped["Wallet"] = relationship(back_populates="ledger_entries", lazy="selectin")
    order: Mapped[Optional["Order"]] = relationship(lazy="selectin")
    vendor_order: Mapped[Optional["VendorOrder"]] = relationship(lazy="selectin")
    delivery_task: Mapped[Optional["DeliveryTask"]] = relationship(lazy="selectin")

class WithdrawalRequest(TimestampMixin, Base):
    __tablename__ = "withdrawal_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    wallet_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("wallets.id"), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(100), nullable=False)
    account_number: Mapped[str] = mapped_column(String(20), nullable=False)
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bank_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[WithdrawalStatus] = mapped_column(SAEnum(WithdrawalStatus), default=WithdrawalStatus.PENDING, nullable=False, index=True)
    reference: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    wallet: Mapped["Wallet"] = relationship(back_populates="withdrawals", lazy="selectin")
    reviewer: Mapped[Optional["User"]] = relationship(lazy="selectin")

