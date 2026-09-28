from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
import re
import secrets
from typing import Any
from app.models.store import Store
from app.models.business import Business
from app.stores.schemas import StoreCreateRequest, StoreUpdateRequest
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.cache import CacheService


class StoreService:
    @staticmethod
    def _generate_slug(name: str) -> str:
        base_slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        suffix = secrets.token_hex(4)
        return f"{base_slug}-{suffix}"

    @staticmethod
    async def create(db: AsyncSession, data: StoreCreateRequest, owner_id: UUID) -> Store:
        # Verify business belongs to owner
        stmt = select(Business).where(Business.id == data.business_id)
        result = await db.execute(stmt)
        business = result.scalar_one_or_none()
        
        if not business:
            raise NotFoundException("Business not found")
        if business.owner_id != owner_id:
            raise ForbiddenException("You don't own this business")
            
        store = Store(
            business_id=data.business_id,
            name=data.name,
            slug=StoreService._generate_slug(data.name),
            description=data.description,
            address=data.address,
            city=data.city,
            state=data.state,
            phone=data.phone,
            email=data.email,
            is_published=False,
            is_active=True
        )
        db.add(store)
        await db.flush()
        return store

    @staticmethod
    async def get_by_id(db: AsyncSession, store_id: UUID) -> Store:
        stmt = select(Store).where(Store.id == store_id)
        result = await db.execute(stmt)
        store = result.scalar_one_or_none()
        if not store:
            raise NotFoundException("Store not found")
        return store

    @staticmethod
    async def get_by_business(db: AsyncSession, business_id: UUID) -> list[Store]:
        stmt = select(Store).where(Store.business_id == business_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_slug(db: AsyncSession, slug: str) -> Store:
        stmt = select(Store).where(Store.slug == slug)
        result = await db.execute(stmt)
        store = result.scalar_one_or_none()
        if not store:
            raise NotFoundException("Store not found")
        return store

    @staticmethod
    async def update(db: AsyncSession, store: Store, data: StoreUpdateRequest) -> Store:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(store, key, value)
            
        if "name" in update_data and update_data["name"]:
            store.slug = StoreService._generate_slug(update_data["name"])
            
        await db.flush()
        await CacheService.invalidate("stores")
        await CacheService.invalidate("showcase")
        return store

    @staticmethod
    async def publish(db: AsyncSession, store: Store) -> Store:
        store.is_published = True
        await db.flush()
        await CacheService.invalidate("stores")
        await CacheService.invalidate("showcase")
        return store

    @staticmethod
    async def unpublish(db: AsyncSession, store: Store) -> Store:
        store.is_published = False
        await db.flush()
        await CacheService.invalidate("stores")
        await CacheService.invalidate("showcase")
        return store

    @staticmethod
    async def get_showcase(db: AsyncSession) -> dict[str, Any]:
        """
        Retrieves top published stores and active products in one fast query,
        cached in Redis with 5-minute TTL.
        """
        cache_key = "showcase:default"
        cached = await CacheService.get(cache_key)
        if cached:
            return cached

        stores_stmt = (
            select(Store)
            .where(Store.is_published == True, Store.is_active == True)
            .order_by(Store.created_at.desc())
            .limit(6)
        )
        stores_res = await db.execute(stores_stmt)
        stores = list(stores_res.scalars().all())

        if not stores:
            return {"stores": [], "products": []}

        store_ids = [s.id for s in stores]

        from app.models.product import Product
        products_stmt = (
            select(Product)
            .where(
                Product.store_id.in_(store_ids),
                Product.is_active == True,
                Product.is_published == True
            )
            .order_by(Product.created_at.desc())
            .limit(16)
        )
        products_res = await db.execute(products_stmt)
        products = list(products_res.scalars().all())

        from app.stores.schemas import StoreResponse
        from app.catalogue.schemas import ProductResponse

        result = {
            "stores": [StoreResponse.model_validate(s).model_dump(mode="json") for s in stores],
            "products": [ProductResponse.model_validate(p).model_dump(mode="json") for p in products],
        }

        await CacheService.set(cache_key, result, ttl_seconds=300)
        return result

    @staticmethod
    async def list_published(db: AsyncSession, page: int, size: int, city: str | None = None) -> tuple[list[Store], int]:
        cache_key = f"stores:published:{page}:{size}:{city or 'all'}"
        cached = await CacheService.get(cache_key)
        if cached:
            from app.stores.schemas import StoreResponse
            stores = [StoreResponse(**s) for s in cached["stores"]]
            return stores, cached["total"]

        query = select(Store).where(Store.is_published == True, Store.is_active == True)
        if city:
            query = query.where(Store.city.ilike(f"%{city}%"))
            
        count_stmt = select(func.count()).select_from(query.subquery())
        count_result = await db.execute(count_stmt)
        total = count_result.scalar_one()
        
        offset = (page - 1) * size
        stmt = query.offset(offset).limit(size)
        result = await db.execute(stmt)
        stores = list(result.scalars().all())

        from app.stores.schemas import StoreResponse
        payload = {
            "stores": [StoreResponse.model_validate(s).model_dump(mode="json") for s in stores],
            "total": total,
        }
        await CacheService.set(cache_key, payload, ttl_seconds=180)

        return stores, total

    @staticmethod
    async def list_all(db: AsyncSession, page: int, size: int) -> tuple[list[Store], int]:
        count_stmt = select(func.count()).select_from(Store)
        count_result = await db.execute(count_stmt)
        total = count_result.scalar_one()
        
        offset = (page - 1) * size
        stmt = select(Store).offset(offset).limit(size)
        result = await db.execute(stmt)
        stores = list(result.scalars().all())
        
        return stores, total
