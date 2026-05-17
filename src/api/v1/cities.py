from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.models.schemas import CityResponse
from src.models.tables import City

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("")
async def list_cities(
    keyword: str = "",
    db: AsyncSession = Depends(get_db),
):
    query = select(City).where(City.status == 1)
    if keyword:
        query = query.where(City.name.like(f"%{keyword}%"))
    query = query.order_by(City.id)
    result = await db.execute(query)
    cities = result.scalars().all()
    return {"code": 0, "data": [CityResponse.model_validate(c) for c in cities]}


@router.get("/{city_id}")
async def get_city(
    city_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(City).where(City.id == city_id, City.status == 1))
    city = result.scalar_one_or_none()
    if not city:
        return {"code": 40400, "message": "城市不存在", "data": None}
    return {"code": 0, "data": CityResponse.model_validate(city)}
