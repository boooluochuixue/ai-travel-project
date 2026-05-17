"""One-time script: build ChromaDB indices from MySQL data and travel knowledge.

Usage:
    python -m src.services.rag.seed_index
"""

import asyncio

from src.common.logger import logger
from src.models.database import async_session_factory
from src.models.tables import City, POI
from src.services.rag.travel_knowledge import seed_knowledge_index
from src.services.rag.vector_store import build_poi_index


async def seed_all() -> None:
    """Build POI and knowledge indices."""
    from sqlalchemy import select

    logger.info("Building ChromaDB indices...")

    # ── Build POI index from MySQL ──
    async with async_session_factory() as session:
        result = await session.execute(select(POI).where(POI.status == 1))
        pois = result.scalars().all()

        city_ids = {p.city_id for p in pois}
        city_result = await session.execute(select(City).where(City.id.in_(city_ids)))
        city_map = {c.id: c.name for c in city_result.scalars().all()}

        poi_dicts = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category.value,
                "sub_category": p.sub_category,
                "city_name": city_map.get(p.city_id, ""),
                "address": p.address,
                "description": p.description or "",
                "rating": p.rating,
            }
            for p in pois
        ]

    count = build_poi_index(poi_dicts)
    logger.info(f"Indexed {count} POIs")

    # ── Build knowledge index from curated docs ──
    kcount = seed_knowledge_index()
    logger.info(f"Indexed {kcount} knowledge documents")

    logger.info("ChromaDB seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed_all())
