from sqlalchemy import String, Boolean, Text, ForeignKey, Integer, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from decimal import Decimal
from app.models.base import Base, TimestampMixin, generate_uuid

class Category(TimestampMixin, Base):
    __tablename__ = "categories"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    store_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stores.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    store: Mapped["Store"] = relationship(back_populates="categories", lazy="selectin")
    products: Mapped[list["Product"]] = relationship(back_populates="category", lazy="selectin")

class Product(TimestampMixin, Base):
    __tablename__ = "products"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    store_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stores.id"), nullable=False, index=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categories.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True)
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    inventory_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    images: Mapped[list | None] = mapped_column(JSON, default=list, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    store: Mapped["Store"] = relationship(back_populates="products", lazy="selectin")
    category: Mapped["Category | None"] = relationship(back_populates="products", lazy="selectin")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product", lazy="selectin")
