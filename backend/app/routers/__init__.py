from .auth import router as auth_router
from .farmers import router as farmers_router
from .crops import router as crops_router
from .market import router as market_router
from .buyers import router as buyers_router
from .lots import router as lots_router
from .offers import router as offers_router
from .transactions import router as transactions_router
from .weather import router as weather_router
from .recommendations import router as recommendations_router

__all__ = [
    "auth_router",
    "farmers_router",
    "crops_router",
    "market_router",
    "buyers_router",
    "lots_router",
    "offers_router",
    "transactions_router",
    "weather_router",
    "recommendations_router",
]
