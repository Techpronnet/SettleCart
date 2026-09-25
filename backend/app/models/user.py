from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from app.models.base import Base, TimestampMixin, generate_uuid
from app.models.enums import UserRole

class User(TimestampMixin, Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Relationships
    businesses: Mapped[list["Business"]] = relationship(back_populates="owner", lazy="selectin")
    orders: Mapped[list["Order"]] = relationship(back_populates="customer", lazy="selectin")
    delivery_tasks: Mapped[list["DeliveryTask"]] = relationship(back_populates="rider", lazy="selectin")
    wallet: Mapped["Wallet | None"] = relationship(back_populates="user", uselist=False, lazy="selectin")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", lazy="selectin", cascade="all, delete-orphan")

