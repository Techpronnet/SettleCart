from sqlalchemy import String, Boolean, Text, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime
from app.models.base import Base, TimestampMixin, generate_uuid
from app.models.enums import KYCStatus

class Business(TimestampMixin, Base):
    __tablename__ = "businesses"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_type: Mapped[str] = mapped_column(String(100), nullable=False)
    kyc_status: Mapped[KYCStatus] = mapped_column(SAEnum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    cac_document_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    government_id_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    kyc_submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    kyc_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    owner: Mapped["User"] = relationship(back_populates="businesses", lazy="selectin")
    stores: Mapped[list["Store"]] = relationship(back_populates="business", lazy="selectin")
