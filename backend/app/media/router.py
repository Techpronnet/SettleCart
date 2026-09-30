from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.models.store import Store
from app.models.business import Business
from app.models.catalogue import Product
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.media.schemas import (
    MediaUploadResponse,
    PresignedUploadRequest,
    PresignedUploadResponse,
    KYCDocumentUploadResponse,
    SignedUrlResponse,
)
from app.media.service import MediaService
from app.core.cache import CacheService
from app.stores.schemas import StoreResponse
from app.catalogue.schemas import ProductResponse

router = APIRouter()

async def _verify_store_ownership(db: AsyncSession, store_id: UUID, user: User) -> Store:
    stmt = (
        select(Store, Business)
        .join(Business, Store.business_id == Business.id)
        .where(Store.id == store_id)
    )
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise NotFoundException("Store not found")
    store, business = row
    if business.owner_id != user.id and user.role != UserRole.ADMIN:
        raise ForbiddenException("You do not own this store")
    return store

async def _verify_business_ownership(db: AsyncSession, business_id: UUID, user: User) -> Business:
    stmt = select(Business).where(Business.id == business_id)
    res = await db.execute(stmt)
    business = res.scalar_one_or_none()
    if not business:
        raise NotFoundException("Business not found")
    if business.owner_id != user.id and user.role != UserRole.ADMIN:
        raise ForbiddenException("You do not have permission for this business")
    return business


@router.post("/upload/image", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_general_image(
    file: UploadFile = File(...),
    folder: str = Form("settlecart/general"),
    current_user: User = Depends(get_current_user),
):
    """Uploads a general storefront image directly to Cloudinary."""
    result = await MediaService.upload_image(file=file, folder=folder)
    return MediaUploadResponse(**result)


@router.post("/presigned-signature", response_model=PresignedUploadResponse)
async def get_presigned_upload_signature(
    data: PresignedUploadRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Returns HMAC presigned signature for direct browser/client uploads to Cloudinary.
    Reduces server load and memory pressure for high-resolution images.
    """
    signature_data = MediaService.generate_presigned_signature(
        folder=data.folder,
        resource_type=data.resource_type,
        is_private=data.is_private,
    )
    return PresignedUploadResponse(**signature_data)


@router.post("/upload/store/{store_id}/logo", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def upload_store_logo(
    store_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Uploads and associates a store brand logo."""
    store = await _verify_store_ownership(db, store_id, current_user)
    upload_res = await MediaService.upload_image(
        file=file,
        folder="settlecart/stores/logos",
        transformation=[{"width": 400, "height": 400, "crop": "fill"}],
    )
    store.logo_url = upload_res["secure_url"]
    await db.commit()
    await db.refresh(store)
    await CacheService.invalidate("stores")
    await CacheService.invalidate("showcase")
    return store


@router.post("/upload/store/{store_id}/banner", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def upload_store_banner(
    store_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Uploads and associates a storefront header banner."""
    store = await _verify_store_ownership(db, store_id, current_user)
    upload_res = await MediaService.upload_image(
        file=file,
        folder="settlecart/stores/banners",
        transformation=[{"width": 1200, "height": 400, "crop": "limit"}],
    )
    store.banner_url = upload_res["secure_url"]
    await db.commit()
    await db.refresh(store)
    await CacheService.invalidate("stores")
    await CacheService.invalidate("showcase")
    return store


@router.post("/upload/product/{product_id}/image", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def upload_product_image(
    product_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Uploads and appends a product photo to the product's catalog gallery."""
    stmt = select(Product).where(Product.id == product_id)
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")

    await _verify_store_ownership(db, product.store_id, current_user)

    upload_res = await MediaService.upload_image(
        file=file,
        folder="settlecart/products",
        transformation=[{"width": 800, "height": 800, "crop": "limit"}],
    )
    current_images = list(product.images or [])
    current_images.append(upload_res["secure_url"])
    product.images = current_images

    await db.commit()
    await db.refresh(product)
    return product


@router.post("/upload/kyc/{business_id}", response_model=KYCDocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_kyc_document(
    business_id: UUID,
    document_type: str = Form(..., description="Must be 'government_id' or 'cac_certificate'"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Secure KYC Document Storage:
    Uploads confidential verification records (Government ID, Business CAC Certificate)
    into Cloudinary's authenticated private storage.
    """
    business = await _verify_business_ownership(db, business_id, current_user)
    doc_res = await MediaService.upload_kyc_document(
        file=file,
        business_id=business_id,
        document_type=document_type,
    )

    if document_type == "government_id":
        business.government_id_url = doc_res["public_id"]
    elif document_type == "cac_certificate":
        business.cac_document_url = doc_res["public_id"]

    await db.commit()
    await db.refresh(business)

    return KYCDocumentUploadResponse(
        business_id=business.id,
        document_type=document_type,
        public_id=doc_res["public_id"],
        secure_url=doc_res["secure_url"],
        message="Confidential KYC document uploaded successfully to private storage",
    )


@router.get("/kyc/{business_id}/{document_type}/signed-url", response_model=SignedUrlResponse)
async def get_kyc_document_signed_url(
    business_id: UUID,
    document_type: str,
    expires_in_seconds: int = 3600,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Access Control for Confidential KYC Documents:
    Generates a temporary signed URL allowing only authorized business owners or admins
    to inspect private KYC documents for compliance review.
    """
    business = await _verify_business_ownership(db, business_id, current_user)

    public_id: Optional[str] = None
    if document_type == "government_id":
        public_id = business.government_id_url
    elif document_type == "cac_certificate":
        public_id = business.cac_document_url
    else:
        raise BadRequestException("Invalid document_type; must be 'government_id' or 'cac_certificate'")

    if not public_id:
        raise NotFoundException(f"No {document_type} on record for this business")

    signed_url = MediaService.generate_signed_document_url(
        public_id=public_id,
        expires_in_seconds=expires_in_seconds,
    )
    return SignedUrlResponse(signed_url=signed_url, expires_in_seconds=expires_in_seconds)

