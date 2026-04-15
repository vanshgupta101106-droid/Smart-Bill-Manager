"""
Storage Service — Handles file uploads to Cloudinary (production) or local disk (fallback).
Environment variables are loaded dynamically to avoid import-time issues.
"""
import os
from uuid import uuid4

try:
    import cloudinary
    import cloudinary.uploader
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False

# Absolute path for local storage
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


def _configure_cloudinary():
    """Configure Cloudinary dynamically (after dotenv has loaded)."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not all([cloud_name, api_key, api_secret]) or not CLOUDINARY_AVAILABLE:
        return False

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
    return True


class StorageService:
    @staticmethod
    async def upload_file(file_bytes: bytes, original_filename: str) -> tuple:
        """
        Upload file bytes to Cloudinary or save locally.
        Returns (filename_or_id, accessible_url).
        """
        file_extension = os.path.splitext(original_filename)[1].lower()
        file_id = str(uuid4())
        local_filename = f"{file_id}{file_extension}"
        local_path = os.path.join(UPLOAD_DIR, local_filename)

        # Always save locally first (needed for serving + backup)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        # Try Cloudinary upload
        if _configure_cloudinary():
            try:
                result = cloudinary.uploader.upload(
                    local_path,
                    folder="smart_bills",
                    public_id=file_id,
                    resource_type="auto"
                )
                cloud_url = result.get("secure_url")
                cloud_id = result.get("public_id")
                print(f"[Storage] ☁️ Uploaded to Cloudinary: {cloud_url}")

                # Keep local copy as backup, but return cloud URL
                return cloud_id, cloud_url
            except Exception as e:
                print(f"[Storage] Cloudinary error: {e}. Using local storage.")

        # Local fallback
        local_url = f"/uploads/{local_filename}"
        print(f"[Storage] 💾 Saved locally: {local_url}")
        return local_filename, local_url

    @staticmethod
    async def delete_file(file_ref: str):
        """Delete a file from Cloudinary and/or local storage."""
        # Try Cloudinary deletion
        if _configure_cloudinary() and file_ref and "/" in file_ref:
            try:
                cloudinary.uploader.destroy(file_ref)
                print(f"[Storage] ☁️ Deleted from Cloudinary: {file_ref}")
            except Exception as e:
                print(f"[Storage] Cloudinary delete error: {e}")

        # Also clean local copy
        for ext in ['', '.png', '.jpg', '.jpeg', '.webp', '.pdf']:
            base = os.path.basename(file_ref).split('.')[0] if '.' in file_ref else file_ref
            local_path = os.path.join(UPLOAD_DIR, f"{base}{ext}")
            if os.path.exists(local_path):
                os.remove(local_path)
                print(f"[Storage] 💾 Deleted local: {local_path}")
                break
