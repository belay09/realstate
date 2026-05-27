from __future__ import annotations

import hashlib
import time
from typing import Any

import httpx

from app.core.config import settings

CLOUDINARY_UPLOAD_FOLDER = "belay/location-media"


class CloudinaryNotConfiguredError(RuntimeError):
    pass


def cloudinary_is_configured() -> bool:
    return bool(
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    )


def _signature(params: dict[str, str]) -> str:
    secret = settings.cloudinary_api_secret or ""
    payload = "&".join(f"{key}={params[key]}" for key in sorted(params))
    return hashlib.sha1(f"{payload}{secret}".encode()).hexdigest()


async def upload_bytes_to_cloudinary(
    *,
    content: bytes,
    filename: str,
    content_type: str | None,
) -> dict[str, Any]:
    if not cloudinary_is_configured():
        raise CloudinaryNotConfiguredError("Cloudinary API credentials are not configured")

    timestamp = str(int(time.time()))
    sign_params = {"folder": CLOUDINARY_UPLOAD_FOLDER, "timestamp": timestamp}
    signature = _signature(sign_params)

    cloud_name = settings.cloudinary_cloud_name
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload"
    data = {
        "api_key": settings.cloudinary_api_key,
        "timestamp": timestamp,
        "signature": signature,
        "folder": CLOUDINARY_UPLOAD_FOLDER,
    }
    files = {"file": (filename, content, content_type or "application/octet-stream")}

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, data=data, files=files)

    if response.status_code < 200 or response.status_code >= 300:
        try:
            body = response.json()
            message = body.get("error", {}).get("message", response.text)
        except Exception:
            message = response.text or "Cloudinary upload failed"
        raise RuntimeError(message)

    payload = response.json()
    secure_url = payload.get("secure_url")
    if not secure_url:
        raise RuntimeError("Cloudinary did not return secure_url")

    resource_type = payload.get("resource_type", "image")
    media_type = "video" if resource_type == "video" else "image"
    return {"secure_url": secure_url, "media_type": media_type}
