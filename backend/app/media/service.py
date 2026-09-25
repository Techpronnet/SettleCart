import logging
import time
from uuid import UUID, uuid4
from typing import Optional, Any
from fastapi import UploadFile
import cloudinary
import cloudinary.uploader
import cloudinary.utils

from app.core.config import settings
from app.core.exceptions import BadRequestException

logger = logging.getLogger(__name__)

# Constants
MAX_IMAGE_SIZE = 5 * 1024 * 1024      # 5MB
MAX_DOC_SIZE = 10 * 1024 * 1024       # 10MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOC_TYPES = {"image/jpeg", "image/png", "application/pdf"}

def configure_cloudinary():
    """Initializes Cloudinary credentials from application settings."""
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )

class MediaService:
    @staticmethod
    def is_configured() -> bool:
        if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
            return False
        placeholders = {"your-cloud-name", "your-api-key", "your-api-secret", "placeholder", "mock"}
        for val in (settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET):
            if any(p in val.lower() for p in placeholders):
                return False
        return True

    @staticmethod
    async def validate_image(file: UploadFile) -> bytes:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise BadRequestException(
                f"Unsupported image format: {file.content_type}. Allowed formats: JPG, PNG, WEBP, GIF"
            )
        contents = await file.read()
        if len(contents) > MAX_IMAGE_SIZE:
            raise BadRequestException(
                f"File size exceeds maximum allowed image limit of 5MB (Uploaded: {len(contents) / (1024*1024):.2f}MB)"
            )
        await file.seek(0)
        return contents

    @staticmethod
    async def validate_document(file: UploadFile) -> bytes:
        if file.content_type not in ALLOWED_DOC_TYPES:
            raise BadRequestException(
                f"Unsupported document format: {file.content_type}. Allowed formats: PDF, JPG, PNG"
            )
        contents = await file.read()
        if len(contents) > MAX_DOC_SIZE:
            raise BadRequestException(
                f"File size exceeds maximum document limit of 10MB (Uploaded: {len(contents) / (1024*1024):.2f}MB)"
            )
        await file.seek(0)
        return contents

    @staticmethod
    async def upload_image(
        file: UploadFile,
        folder: str = "settlecart/general",
        transformation: Optional[list[dict[str, Any]]] = None,
    ) -> dict[str, Any]:
        """
        Uploads a public storefront asset (store logo, banner, or product catalog picture).
        """
        file_bytes = await MediaService.validate_image(file)

        if not MediaService.is_configured():
            clean_name = (file.filename or "image.jpg").replace(" ", "_")
            rand_id = uuid4().hex[:10]
            fmt = (file.content_type or "image/jpeg").split("/")[-1]
            public_id = f"{folder}/{rand_id}_{clean_name}"
            mock_url = f"https://res.cloudinary.com/settlecart-mock/image/upload/v1/{public_id}"
            logger.info("[SIMULATED CLOUDINARY UPLOAD] Image to %s: %s", folder, mock_url)
            return {
                "url": mock_url,
                "secure_url": mock_url,
                "public_id": public_id,
                "format": fmt,
                "resource_type": "image",
                "bytes": len(file_bytes),
                "width": 800,
                "height": 600,
            }

        configure_cloudinary()
        try:
            upload_kwargs: dict[str, Any] = {
                "folder": folder,
                "resource_type": "image",
                "overwrite": True,
            }
            if transformation:
                upload_kwargs["transformation"] = transformation

            res = cloudinary.uploader.upload(file_bytes, **upload_kwargs)
            return {
                "url": res.get("url"),
                "secure_url": res.get("secure_url"),
                "public_id": res.get("public_id"),
                "format": res.get("format", "jpg"),
                "resource_type": res.get("resource_type", "image"),
                "bytes": res.get("bytes", len(file_bytes)),
                "width": res.get("width"),
                "height": res.get("height"),
            }
        except Exception as exc:
            logger.error("Cloudinary upload failed: %s", exc)
            raise BadRequestException(f"Failed to upload image to cloud storage: {str(exc)}")

    @staticmethod
    async def upload_kyc_document(
        file: UploadFile,
        business_id: UUID,
        document_type: str,
    ) -> dict[str, Any]:
        """
        Secure KYC Document Upload:
        Stores government IDs and business registration certificates in Cloudinary's
        authenticated (private) storage type. Public URLs are disabled; documents can
        only be viewed via authenticated, time-limited signed URLs.
        """
        if document_type not in ["government_id", "cac_certificate"]:
            raise BadRequestException(
                "Invalid document_type; must be 'government_id' or 'cac_certificate'"
            )

        file_bytes = await MediaService.validate_document(file)
        folder = f"settlecart/kyc/{business_id}"

        if not MediaService.is_configured():
            clean_name = (file.filename or f"{document_type}.pdf").replace(" ", "_")
            rand_id = uuid4().hex[:10]
            fmt = (file.content_type or "application/pdf").split("/")[-1]
            public_id = f"{folder}/{document_type}_{rand_id}"
            mock_url = f"https://res.cloudinary.com/settlecart-mock/raw/authenticated/v1/{public_id}"
            logger.info("[SIMULATED CLOUDINARY KYC UPLOAD] Private doc for business %s: %s", business_id, mock_url)
            return {
                "url": mock_url,
                "secure_url": mock_url,
                "public_id": public_id,
                "format": fmt,
                "resource_type": "raw" if "pdf" in fmt else "image",
                "bytes": len(file_bytes),
                "type": "authenticated",
            }

        configure_cloudinary()
        try:
            res = cloudinary.uploader.upload(
                file_bytes,
                folder=folder,
                public_id=f"{document_type}_{uuid4().hex[:8]}",
                type="authenticated",
                resource_type="auto",
                overwrite=True,
            )
            return {
                "url": res.get("url"),
                "secure_url": res.get("secure_url"),
                "public_id": res.get("public_id"),
                "format": res.get("format"),
                "resource_type": res.get("resource_type"),
                "bytes": res.get("bytes", len(file_bytes)),
                "type": "authenticated",
            }
        except Exception as exc:
            logger.error("Cloudinary KYC document upload failed: %s", exc)
            raise BadRequestException(f"Failed to upload confidential document: {str(exc)}")

    @staticmethod
    def generate_presigned_signature(
        folder: str = "settlecart/general",
        resource_type: str = "image",
        is_private: bool = False,
    ) -> dict[str, Any]:
        """
        Generates HMAC-SHA1 presigned signatures allowing direct client-to-Cloudinary
        browser/mobile uploads without passing media files through the backend API.
        """
        timestamp = int(time.time())
        params_to_sign = {
            "folder": folder,
            "timestamp": timestamp,
        }
        if is_private:
            params_to_sign["type"] = "authenticated"

        if not MediaService.is_configured():
            return {
                "timestamp": timestamp,
                "signature": f"mock_sig_{timestamp}",
                "api_key": "mock_api_key",
                "cloud_name": "settlecart-mock",
                "folder": folder,
                "upload_url": "https://api.cloudinary.com/v1_1/settlecart-mock/auto/upload",
                "resource_type": resource_type,
            }

        configure_cloudinary()
        signature = cloudinary.utils.api_sign_request(
            params_to_sign, settings.CLOUDINARY_API_SECRET
        )
        return {
            "timestamp": timestamp,
            "signature": signature,
            "api_key": settings.CLOUDINARY_API_KEY,
            "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
            "folder": folder,
            "upload_url": f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/{resource_type}/upload",
            "resource_type": resource_type,
        }

    @staticmethod
    def generate_signed_document_url(public_id: str, expires_in_seconds: int = 3600) -> str:
        """
        Generates a secure, time-limited signed delivery URL for accessing confidential
        authenticated KYC assets (Government IDs and CAC certificates).
        """
        if not MediaService.is_configured():
            return f"https://res.cloudinary.com/settlecart-mock/image/authenticated/s--mock-token--/v1/{public_id}?expires={int(time.time() + expires_in_seconds)}"

        configure_cloudinary()
        expires_at = int(time.time() + expires_in_seconds)
        url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            type="authenticated",
            sign_url=True,
            expires_at=expires_at,
        )
        return url

