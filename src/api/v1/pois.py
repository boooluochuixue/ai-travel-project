from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.models.enums import POICategory
from src.models.schemas import POIResponse
from src.models.tables import City, POI

router = APIRouter(prefix="/pois", tags=["pois"])


@router.get("/categories")
async def list_poi_categories():
    categories = [
        {"category": c.value, "label": _category_label(c)} for c in POICategory
    ]
    return {"code": 0, "data": categories}


@router.get("")
async def search_pois(
    city_id: Optional[int] = Query(None),
    city_name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(POI).where(POI.status == 1)

    if city_id is not None:
        query = query.where(POI.city_id == city_id)
    if city_name:
        query = query.where(POI.city_id == select(City.id).where(City.name == city_name).scalar_subquery())
    if category:
        query = query.where(POI.category == category)
    if keyword:
        query = query.where(POI.name.like(f"%{keyword}%"))
    if min_rating is not None:
        query = query.where(POI.rating >= min_rating)

    # Count
    count_query = select(POI.id).where(POI.status == 1)
    total_result = await db.execute(count_query)
    total = len(total_result.all())

    query = query.order_by(POI.rating.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    pois = result.scalars().all()

    return {
        "code": 0,
        "data": [POIResponse.model_validate(p) for p in pois],
        "total": total,
        "page": page,
        "size": size,
    }


@router.get("/{poi_id}")
async def get_poi(
    poi_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(POI).where(POI.id == poi_id, POI.status == 1))
    poi = result.scalar_one_or_none()
    if not poi:
        return {"code": 40400, "message": "POI 不存在", "data": None}
    return {"code": 0, "data": POIResponse.model_validate(poi)}


def _category_label(c: POICategory) -> str:
    labels = {
        POICategory.attraction: "景点",
        POICategory.restaurant: "餐饮",
        POICategory.hotel: "酒店",
        POICategory.shopping: "购物",
        POICategory.entertainment: "娱乐",
    }
    return labels.get(c, c.value)
