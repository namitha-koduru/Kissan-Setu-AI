"""
Cloudinary Image Storage Service for KissanSetuAI.
Provides secure image validation, Cloudinary uploads, and zero-crash local media storage fallback for development.
"""

import os
import uuid
import io
import logging
from typing import Dict, Any, Tuple
from PIL import Image
import cloudinary
import cloudinary.uploader
from app.config import settings

logger = logging.getLogger("kissansetu.storage")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024  # e.g. 10 MB


class CloudinaryService:
    def __init__(self):
        self.cloud_name = settings.CLOUDINARY_CLOUD_NAME
        self.api_key = settings.CLOUDINARY_API_KEY
        self.api_secret = settings.CLOUDINARY_API_SECRET
        self._is_configured = bool(self.cloud_name and self.api_key and self.api_secret)

        if self._is_configured:
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret,
                secure=True,
            )
            logger.info("[Storage] Cloudinary successfully configured.")
        else:
            logger.info("[Storage] Cloudinary credentials not set. Using local development media storage fallback.")

    @staticmethod
    def validate_image(file_bytes: bytes, filename: str, content_type: str) -> Tuple[int, int, str]:
        """
        Validates image format, MIME type, size limit, and visual integrity using Pillow.
        Returns (width, height, normalized_mime_type).
        """
        # 1. Size Check
        if len(file_bytes) > MAX_FILE_BYTES:
            raise ValueError(f"Image exceeds the maximum allowed size of {settings.MAX_IMAGE_SIZE_MB} MB.")

        if len(file_bytes) == 0:
            raise ValueError("Uploaded file is empty.")

        # 2. MIME Type / Extension check
        normalized_mime = content_type.lower()
        if normalized_mime not in ALLOWED_MIME_TYPES:
            ext = os.path.splitext(filename)[1].lower()
            if ext in ALLOWED_EXTENSIONS:
                normalized_mime = "image/jpeg" if ext in {".jpg", ".jpeg"} else f"image/{ext[1:]}"
            else:
                raise ValueError(
                    f"Unsupported image format: '{content_type}'. Allowed formats are JPG, JPEG, PNG, and WEBP."
                )

        # 3. Content Integrity Verification using Pillow
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                img.verify()  # Verifies file integrity
                width, height = img.size
                return width, height, normalized_mime
        except Exception as exc:
            raise ValueError(f"Corrupted or unreadable image file: {str(exc)}")

    async def upload_image(
        self,
        file_bytes: bytes = b"",
        filename: str = "crop_image.jpg",
        content_type: str = "image/jpeg",
        farmer_id: int = 1,
        file: Any = None,
        folder: str = "crop-analysis",
    ) -> Dict[str, Any]:
        """
        Validates and uploads an image. Uses Cloudinary if configured; otherwise uses local media directory.
        Accepts either raw bytes + metadata or an UploadFile.
        """
        if file is not None:
            if hasattr(file, "filename") and file.filename:
                filename = file.filename
            if hasattr(file, "content_type") and file.content_type:
                content_type = file.content_type
            if hasattr(file, "read"):
                # If bytes not already provided
                if not file_bytes:
                    file_bytes = await file.read()
                    await file.seek(0)

        width, height, mime_type = self.validate_image(file_bytes, filename, content_type)
        file_size = len(file_bytes)
        unique_id = uuid.uuid4().hex[:12]
        ext = ".jpg" if "jpeg" in mime_type or "jpg" in mime_type else (".png" if "png" in mime_type else ".webp")

        if self._is_configured:
            try:
                folder = f"kissan-setu/crop-analysis/{farmer_id}"
                result = cloudinary.uploader.upload(
                    file_bytes,
                    folder=folder,
                    public_id=f"crop_{unique_id}",
                    resource_type="image",
                    overwrite=True,
                )
                return {
                    "image_url": result.get("secure_url") or result.get("url"),
                    "cloudinary_public_id": result.get("public_id"),
                    "width": result.get("width") or width,
                    "height": result.get("height") or height,
                    "mime_type": mime_type,
                    "file_size": result.get("bytes") or file_size,
                    "original_filename": filename,
                }
            except Exception as exc:
                logger.error(f"[Cloudinary] Upload failed ({exc}). Falling back to local media storage.")

        # Local development fallback storage
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "crop-analysis")
        os.makedirs(uploads_dir, exist_ok=True)

        local_filename = f"crop_{farmer_id}_{unique_id}{ext}"
        local_path = os.path.join(uploads_dir, local_filename)

        with open(local_path, "wb") as f:
            f.write(file_bytes)

        # Generate accessible URL (e.g. /uploads/crop-analysis/...)
        local_url = f"/uploads/crop-analysis/{local_filename}"

        return {
            "image_url": local_url,
            "cloudinary_public_id": f"local_{unique_id}",
            "width": width,
            "height": height,
            "mime_type": mime_type,
            "file_size": file_size,
            "original_filename": filename,
            "is_local_fallback": True,
        }


cloudinary_service = CloudinaryService()
