from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.models.identity import User

router = APIRouter()


@router.get("/ping")
def admin_ping(_user: User = Depends(require_roles("admin"))) -> dict[str, str]:
    return {"scope": "admin", "status": "ok"}
