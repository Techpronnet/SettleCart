import string
import random
import re
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Tuple, List, Optional
from app.models.catalogue import Category, Product
from app.catalogue.schemas import CategoryCreateRequest, CategoryUpdateRequest, ProductCreateRequest, ProductUpdateRequest
from app.core.exceptions import NotFoundException, BadRequestException
from app.core.cache import CacheService

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{text}-{suffix}"

class CatalogueService:
    @staticmethod
    async def create_category(db: AsyncSession, store_id: UUID, data: CategoryCreateRequest) -> Category:
        slug = slugify(data.name)
        category = Category(
            store_id=store_id,
            name=data.name,
            slug=slug,
            description=data.description,
            sort_order=data.sort_order
        )
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def get_category(db: AsyncSession, category_id: UUID) -> Category:
        result = await db.execute(select(Category).where(Category.id == category_id, Category.is_active == True))
        category = result.scalar_one_or_none()
        if not category:
            raise NotFoundException("Category not found")
        return category

    @staticmethod
    async def list_categories(db: AsyncSession, store_id: UUID) -> List[Category]:
        result = await db.execute(
            select(Category).where(Category.store_id == store_id, Category.is_active == True)
            .order_by(Category.sort_order, Category.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_category(db: AsyncSession, category: Category, data: CategoryUpdateRequest) -> Category:
        if data.name is not None:
            category.name = data.name
            category.slug = slugify(data.name)
        if data.description is not None:
            category.description = data.description
        if data.sort_order is not None:
            category.sort_order = data.sort_order
            
        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def delete_category(db: AsyncSession, category: Category) -> None:
        category.is_active = False
        await db.commit()

    @staticmethod
    async def create_product(db: AsyncSession, store_id: UUID, data: ProductCreateRequest) -> Product:
        if data.category_id:
            category = await CatalogueService.get_category(db, data.category_id)
            if category.store_id != store_id:
                raise BadRequestException("Category does not belong to this store")

        slug = slugify(data.name)
        product = Product(
            store_id=store_id,
            name=data.name,
            slug=slug,
            description=data.description,
            price=data.price,
            compare_at_price=data.compare_at_price,
            sku=data.sku,
            category_id=data.category_id,
            track_inventory=data.track_inventory,
            inventory_count=data.inventory_count,
            images=data.images or [],
            is_published=data.is_published
        )
        db.add(product)
        await db.commit()
        await db.refresh(product)
        await CacheService.invalidate("showcase")
        await CacheService.invalidate("stores")
        await CacheService.invalidate("catalogue")
        return product

    @staticmethod
    async def get_product(db: AsyncSession, product_id: UUID) -> Product:
        result = await db.execute(select(Product).where(Product.id == product_id, Product.is_active == True))
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundException("Product not found")
        return product

    @staticmethod
    async def list_products(db: AsyncSession, store_id: UUID, page: int, size: int, category_id: Optional[UUID] = None, search: Optional[str] = None) -> Tuple[List[Product], int]:
        query = select(Product).where(Product.store_id == store_id, Product.is_active == True)
        count_query = select(func.count()).where(Product.store_id == store_id, Product.is_active == True)
        
        if category_id:
            query = query.where(Product.category_id == category_id)
            count_query = count_query.where(Product.category_id == category_id)
            
        if search:
            query = query.where(Product.name.ilike(f"%{search}%"))
            count_query = count_query.where(Product.name.ilike(f"%{search}%"))
            
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)
        
        total = await db.execute(count_query)
        result = await db.execute(query)
        
        return list(result.scalars().all()), total.scalar_one()

    @staticmethod
    async def update_product(db: AsyncSession, product: Product, data: ProductUpdateRequest) -> Product:
        if data.category_id:
            category = await CatalogueService.get_category(db, data.category_id)
            if category.store_id != product.store_id:
                raise BadRequestException("Category does not belong to this store")
                
        update_data = data.model_dump(exclude_unset=True)
        if 'name' in update_data:
            update_data['slug'] = slugify(update_data['name'])
            
        for key, value in update_data.items():
            setattr(product, key, value)
            
        await db.commit()
        await db.refresh(product)
        await CacheService.invalidate("showcase")
        await CacheService.invalidate("stores")
        await CacheService.invalidate("catalogue")
        return product

    @staticmethod
    async def delete_product(db: AsyncSession, product: Product) -> None:
        product.is_active = False
        await db.commit()
        await CacheService.invalidate("showcase")
        await CacheService.invalidate("stores")
        await CacheService.invalidate("catalogue")

    @staticmethod
    async def search_products(db: AsyncSession, query: str, page: int, size: int) -> Tuple[List[Product], int]:
        stmt = select(Product).where(
            Product.is_active == True,
            Product.is_published == True,
            or_(Product.name.ilike(f"%{query}%"), Product.description.ilike(f"%{query}%"))
        )
        count_stmt = select(func.count()).where(
            Product.is_active == True,
            Product.is_published == True,
            or_(Product.name.ilike(f"%{query}%"), Product.description.ilike(f"%{query}%"))
        )
        
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)
        
        total = await db.execute(count_stmt)
        result = await db.execute(stmt)
        
        return list(result.scalars().all()), total.scalar_one()
