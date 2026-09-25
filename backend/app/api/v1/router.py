"""
Aggregate API v1 router.

Imports all domain routers and mounts them under their respective prefixes.
Domain routers should NOT define their own prefix — it is applied here.
"""

from fastapi import APIRouter

from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.businesses.router import router as businesses_router
from app.stores.router import router as stores_router
from app.catalogue.router import router as catalogue_router
from app.orders.router import router as orders_router
from app.admin.router import router as admin_router
from app.dispatch.router import router as dispatch_router
from app.payments.router import router as payments_router
from app.wallets.router import router as wallets_router
from app.notifications.router import router as notifications_router
from app.media.router import router as media_router
from app.realtime.router import router as realtime_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(businesses_router, prefix="/businesses", tags=["Businesses"])
api_router.include_router(stores_router, prefix="/stores", tags=["Stores"])
api_router.include_router(catalogue_router, prefix="/catalogue", tags=["Catalogue"])
api_router.include_router(orders_router, prefix="/orders", tags=["Orders"])
api_router.include_router(dispatch_router, prefix="/dispatch", tags=["Dispatch"])
api_router.include_router(payments_router, prefix="/payments", tags=["Payments"])
api_router.include_router(wallets_router, prefix="/wallets", tags=["Wallets"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(media_router, prefix="/media", tags=["Media & Uploads"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
api_router.include_router(realtime_router, prefix="", tags=["Live Tracking & Real-Time"])



