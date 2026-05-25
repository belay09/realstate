from fastapi import APIRouter

from app.api.v1.routes import (
    admin,
    admin_commission,
    admin_inventory,
    admin_leads,
    admin_payment,
    admin_pricing,
    auth,
    health,
    public_leads,
    public_listings,
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_inventory.router, prefix="/admin", tags=["admin-inventory"])
api_router.include_router(admin_pricing.router, prefix="/admin", tags=["admin-pricing"])
api_router.include_router(admin_payment.router, prefix="/admin", tags=["admin-payment"])
api_router.include_router(admin_commission.router, prefix="/admin", tags=["admin-commission"])
api_router.include_router(admin_leads.router, prefix="/admin", tags=["admin-leads"])
api_router.include_router(public_listings.router, prefix="/public", tags=["public"])
api_router.include_router(public_leads.router, prefix="/public", tags=["public-leads"])
