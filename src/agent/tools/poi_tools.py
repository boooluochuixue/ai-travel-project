"""POI and city information tools for the Agent."""

from typing import Optional

from sqlalchemy import select

from src.agent.registry import register_tool
from src.models.database import async_session_factory
from src.models.tables import City, POI
from src.services.cache.redis import cache_get, cache_set


@register_tool()
async def get_city_info(city_name: str) -> dict:
    """Get basic information about a city, including description and famous attractions."""
    cache_key = f"city:info:{city_name}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    async with async_session_factory() as session:
        result = await session.execute(
            select(City).where(City.name == city_name, City.status == 1)
        )
        city = result.scalar_one_or_none()
        if not city:
            return {"error": f"城市 '{city_name}' 未找到"}

        info = {
            "city_id": city.id,
            "name": city.name,
            "name_en": city.name_en,
            "province": city.province,
            "latitude": float(city.latitude),
            "longitude": float(city.longitude),
            "description": city.description or "",
            "best_season": ["春季", "秋季"],
            "avg_stay_days": 3,
        }
        await cache_set(cache_key, info, ttl=86400)
        return info


@register_tool()
async def search_pois(
    city_name: str,
    categories: Optional[list[str]] = None,
    keywords: Optional[list[str]] = None,
    limit: int = 15,
) -> list[dict]:
    """Search for POIs by city and optional category/keyword filters.
    Categories: attraction, restaurant, hotel, shopping, entertainment"""
    cache_key = f"poi:search:{city_name}:{categories}:{keywords}:{limit}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    async with async_session_factory() as session:
        # Find city
        city_result = await session.execute(
            select(City).where(City.name == city_name, City.status == 1)
        )
        city = city_result.scalar_one_or_none()
        if not city:
            return []

        query = select(POI).where(POI.city_id == city.id, POI.status == 1)

        if categories:
            query = query.where(POI.category.in_(categories))

        if keywords:
            from sqlalchemy import or_
            keyword_filters = [
                POI.name.like(f"%{kw}%") | POI.sub_category.like(f"%{kw}%")
                for kw in keywords
            ]
            query = query.where(or_(*keyword_filters))

        query = query.order_by(POI.rating.desc()).limit(limit)
        result = await session.execute(query)
        pois = result.scalars().all()

        poi_list = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category.value,
                "sub_category": p.sub_category,
                "address": p.address,
                "latitude": float(p.latitude),
                "longitude": float(p.longitude),
                "rating": float(p.rating),
                "price_level": p.price_level,
                "opening_hours": p.opening_hours,
                "visit_duration": p.visit_duration,
                "description": p.description or "",
            }
            for p in pois
        ]

        await cache_set(cache_key, poi_list, ttl=3600)
        return poi_list
