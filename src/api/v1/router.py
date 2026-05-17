from fastapi import APIRouter

from src.api.v1.health import router as health_router
from src.api.v1.cities import router as cities_router
from src.api.v1.pois import router as pois_router
from src.api.v1.itineraries import router as itineraries_router
from src.api.v1.users import router as users_router

router = APIRouter(prefix="/api/v1")

router.include_router(health_router)
router.include_router(cities_router)
router.include_router(pois_router)
router.include_router(itineraries_router)
router.include_router(users_router)
