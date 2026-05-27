from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import require_roles
from app.core.config import settings
from app.services.cloudinary_upload import (
    CloudinaryNotConfiguredError,
    cloudinary_is_configured,
    upload_bytes_to_cloudinary,
)

router = APIRouter(dependencies=[Depends(require_roles("admin"))])


@router.post("/media/upload")
async def upload_location_media(file: UploadFile = File(...)) -> dict[str, str]:
    if not cloudinary_is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "CLOUDINARY_NOT_CONFIGURED",
                "message": (
                    "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and "
                    "CLOUDINARY_API_SECRET in backend/.env, then restart the API."
                ),
            },
        )

    content = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"File exceeds {settings.max_upload_size_mb} MB limit",
            },
        )

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_FILE", "message": "Uploaded file is empty"},
        )

    try:
        result = await upload_bytes_to_cloudinary(
            content=content,
            filename=file.filename or "upload",
            content_type=file.content_type,
        )
    except CloudinaryNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "CLOUDINARY_NOT_CONFIGURED", "message": str(exc)},
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "CLOUDINARY_UPLOAD_FAILED", "message": str(exc)},
        ) from exc

    return {"secure_url": result["secure_url"], "media_type": result["media_type"]}
