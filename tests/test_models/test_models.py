"""Tests for data models (SQLAlchemy + Pydantic)."""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.enums import BudgetLevel, ItineraryStatus, POICategory, SlotType
from src.models.schemas import (
    Destination,
    ItineraryGenerateRequest,
    Preference,
)
from src.models.tables import City, Itinerary, ItineraryDay, ItinerarySlot, POI, User


class TestEnums:
    """Enum value consistency tests."""

    def test_itinerary_status_values(self):
        assert ItineraryStatus.draft.value == "draft"
        assert ItineraryStatus.confirmed.value == "confirmed"
        assert ItineraryStatus.completed.value == "completed"
        assert ItineraryStatus.cancelled.value == "cancelled"

    def test_slot_type_values(self):
        assert SlotType.morning.value == "morning"
        assert SlotType.afternoon.value == "afternoon"
        assert SlotType.evening.value == "evening"

    def test_poi_category_values(self):
        assert POICategory.attraction.value == "attraction"
        assert POICategory.restaurant.value == "restaurant"

    def test_budget_level_values(self):
        assert BudgetLevel.economy.value == "economy"
        assert BudgetLevel.moderate.value == "moderate"
        assert BudgetLevel.luxury.value == "luxury"


class TestPydanticSchemas:
    """Pydantic validation tests."""

    def test_destination_validation(self):
        d = Destination(city_id=1, city_name="成都", days=3)
        assert d.city_id == 1
        assert d.days == 3

    def test_destination_days_minimum(self):
        with pytest.raises(ValueError):
            Destination(city_id=1, city_name="成都", days=0)

    def test_preference_defaults(self):
        p = Preference()
        assert p.food_types == []
        assert p.budget_level == BudgetLevel.moderate
        assert p.pace.value == "normal"

    def test_generate_request_validation(self):
        req = ItineraryGenerateRequest(
            destinations=[Destination(city_id=1, city_name="成都", days=3)],
            total_budget=5000,
        )
        assert len(req.destinations) == 1
        assert req.total_budget == 5000

    def test_generate_request_empty_destinations_fails(self):
        with pytest.raises(ValueError):
            ItineraryGenerateRequest(destinations=[])

    def test_generate_request_too_many_destinations_fails(self):
        with pytest.raises(ValueError):
            ItineraryGenerateRequest(
                destinations=[
                    Destination(city_id=i, city_name=f"City{i}", days=1)
                    for i in range(6)
                ]
            )


class TestORM:
    """SQLAlchemy ORM CRUD tests."""

    @pytest.mark.asyncio
    async def test_create_city(self, db_session: AsyncSession):
        city = City(name="北京", province="北京", latitude=39.9, longitude=116.4)
        db_session.add(city)
        await db_session.flush()

        result = await db_session.execute(select(City).where(City.id == city.id))
        fetched = result.scalar_one()
        assert fetched.name == "北京"
        assert fetched.status == 1

    @pytest.mark.asyncio
    async def test_create_user(self, db_session: AsyncSession):
        user = User(nickname="测试用户", email="test@example.com")
        db_session.add(user)
        await db_session.flush()

        result = await db_session.execute(select(User).where(User.id == user.id))
        fetched = result.scalar_one()
        assert fetched.nickname == "测试用户"
        assert fetched.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_create_poi(self, db_session: AsyncSession):
        city = City(name="成都", latitude=30.5, longitude=104.0)
        db_session.add(city)
        await db_session.flush()

        poi = POI(
            city_id=city.id,
            name="宽窄巷子",
            category=POICategory.attraction,
            rating=4.5,
            visit_duration=120,
        )
        db_session.add(poi)
        await db_session.flush()

        result = await db_session.execute(
            select(POI).where(POI.id == poi.id)
        )
        fetched = result.scalar_one()
        assert fetched.name == "宽窄巷子"
        assert fetched.category == POICategory.attraction

    @pytest.mark.asyncio
    async def test_create_itinerary_with_relations(self, db_session: AsyncSession):
        # Create itinerary
        itinerary = Itinerary(
            title="成都3日游",
            destinations=[{"city_id": 1, "city_name": "成都", "days": 3}],
            status=ItineraryStatus.draft,
        )
        db_session.add(itinerary)
        await db_session.flush()

        # Add a day
        day = ItineraryDay(
            itinerary_id=itinerary.id,
            day_number=1,
            notes="第一天行程",
        )
        db_session.add(day)
        await db_session.flush()

        # Add a slot
        slot = ItinerarySlot(
            day_id=day.id,
            slot_type=SlotType.morning,
            poi_name="大熊猫基地",
            poi_category="attraction",
            start_time="09:00",
            end_time="11:30",
            duration=150,
            sort_order=0,
        )
        db_session.add(slot)
        await db_session.flush()

        # Verify relationships
        result = await db_session.execute(
            select(Itinerary).where(Itinerary.id == itinerary.id)
        )
        fetched = result.scalar_one()
        assert fetched.title == "成都3日游"
        assert fetched.status == ItineraryStatus.draft
