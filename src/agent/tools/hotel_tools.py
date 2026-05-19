"""Hotel recommendation tool for the Agent.

Recommends hotels based on city, budget, and proximity to the day's POIs.
Hotel data is sourced from the database (mocked POI data).
"""

from typing import Optional

from sqlalchemy import select

from src.agent.registry import register_tool
from src.models.database import async_session_factory
from src.models.tables import City, POI
from src.services.cache.redis import cache_get, cache_set


@register_tool()
async def recommend_hotel(
    city_name: str,
    max_price_level: int = 2,
    min_rating: float = 0,
    limit: int = 3,
) -> list[dict]:
    """Recommend hotels in a city based on budget and quality preferences.

    Args:
        city_name: The city name (e.g. "北京", "成都")
        max_price_level: Maximum price level. 1=budget, 2=moderate, 3=luxury
        min_rating: Minimum rating (1.0-5.0)
        limit: Maximum number of recommendations
    """
    cache_key = f"hotel:recommend:{city_name}:{max_price_level}:{min_rating}:{limit}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    async with async_session_factory() as session:
        city_result = await session.execute(
            select(City).where(City.name == city_name, City.status == 1)
        )
        city = city_result.scalar_one_or_none()
        if not city:
            return []

        query = (
            select(POI)
            .where(
                POI.city_id == city.id,
                POI.category == "hotel",
                POI.status == 1,
                POI.price_level <= max_price_level,
                POI.rating >= min_rating,
            )
            .order_by(POI.rating.desc())
            .limit(limit)
        )
        result = await session.execute(query)
        hotels = result.scalars().all()

        hotel_list = [
            {
                "name": h.name,
                "address": h.address,
                "rating": float(h.rating),
                "price_level": h.price_level,
                "description": h.description or "",
                "latitude": float(h.latitude),
                "longitude": float(h.longitude),
            }
            for h in hotels
        ]

        await cache_set(cache_key, hotel_list, ttl=3600)
        return hotel_list
