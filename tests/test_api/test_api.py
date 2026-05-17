"""API endpoint integration tests."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.tables import City, POI


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_list_cities_empty(client: AsyncClient):
    resp = await client.get("/api/v1/cities")
    assert resp.status_code == 200
    data = resp.json()
    assert "data" in data


@pytest.mark.asyncio
async def test_list_cities_with_data(client: AsyncClient, db_session: AsyncSession):
    city = City(name="成都", province="四川", latitude=30.5, longitude=104.0)
    db_session.add(city)
    await db_session.commit()

    resp = await client.get("/api/v1/cities")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "成都"


@pytest.mark.asyncio
async def test_get_city_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/cities/999")
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 40400


@pytest.mark.asyncio
async def test_search_pois_by_city(client: AsyncClient, db_session: AsyncSession):
    city = City(name="测试市", latitude=30.0, longitude=104.0)
    db_session.add(city)
    await db_session.flush()

    poi = POI(city_id=city.id, name="测试景点", category="attraction", rating=4.5, visit_duration=120)
    db_session.add(poi)
    await db_session.commit()

    resp = await client.get(f"/api/v1/pois?city_id={city.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "测试景点"


@pytest.mark.asyncio
async def test_search_pois_with_category_filter(client: AsyncClient, db_session: AsyncSession):
    city = City(name="测试市", latitude=30.0, longitude=104.0)
    db_session.add(city)
    await db_session.flush()

    for name, cat in [("景点A", "attraction"), ("餐厅B", "restaurant")]:
        db_session.add(POI(city_id=city.id, name=name, category=cat, rating=4.0, visit_duration=60))
    await db_session.commit()

    resp = await client.get(f"/api/v1/pois?city_id={city.id}&category=attraction")
    data = resp.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "景点A"


@pytest.mark.asyncio
async def test_list_poi_categories(client: AsyncClient):
    resp = await client.get("/api/v1/pois/categories")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["data"]) >= 4


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient, db_session: AsyncSession):
    resp = await client.post(
        "/api/v1/users",
        json={"nickname": "测试用户", "email": "test@example.com"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["data"]["nickname"] == "测试用户"


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/users/999")
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 40400


@pytest.mark.asyncio
async def test_generate_itinerary(client: AsyncClient):
    resp = await client.post(
        "/api/v1/itineraries/generate",
        json={
            "destinations": [{"city_id": 1, "city_name": "成都", "days": 3}],
            "preferences": {
                "interests": ["美食", "历史"],
                "budget_level": "moderate",
            },
            "total_budget": 5000,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["data"]["task_id"].startswith("gen_")
    assert data["data"]["status"] == "pending"


