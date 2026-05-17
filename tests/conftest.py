"""pytest fixtures and configuration."""

from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.models.database import Base
from src.models.tables import City, POI


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ─── Test Database ───

@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    engine = create_async_engine("sqlite+aiosqlite://", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncClient:
    """Create FastAPI test client."""
    app = FastAPI()

    # Override dependency
    from src.api.deps import get_db as get_db_dep

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db_dep] = override_get_db

    from src.api.v1.router import router
    app.include_router(router)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ─── Mock Services ───

@pytest.fixture(autouse=True)
def mock_external_services():
    """Mock all external service connections by default."""
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock()
    mock_redis.ping = AsyncMock(return_value=True)
    mock_redis.publish = AsyncMock()

    # Pubsub with async methods for SSE streaming
    mock_pubsub = AsyncMock()
    mock_pubsub.subscribe = AsyncMock()
    mock_pubsub.unsubscribe = AsyncMock()
    mock_pubsub.close = AsyncMock()
    mock_pubsub.get_message = AsyncMock(return_value=None)
    mock_redis.pubsub = MagicMock(return_value=mock_pubsub)

    mock_get_redis = AsyncMock(return_value=mock_redis)

    with (
        patch("src.services.cache.redis.init_redis", AsyncMock()),
        patch("src.services.cache.redis.get_redis", mock_get_redis),
        patch("src.services.queue.redis_queue.enqueue", AsyncMock()),
    ):
        yield


# ─── Sample Data ───

@pytest_asyncio.fixture
async def sample_city(db_session: AsyncSession) -> City:
    """Create a sample city."""
    city = City(
        name="测试城市",
        name_en="Test City",
        province="测试省",
        latitude=30.0,
        longitude=104.0,
        description="一个测试城市",
    )
    db_session.add(city)
    await db_session.flush()
    return city


@pytest_asyncio.fixture
async def sample_pois(db_session: AsyncSession, sample_city: City) -> list[POI]:
    """Create sample POIs."""
    pois = [
        POI(
            city_id=sample_city.id,
            name=f"测试景点{i}",
            category="attraction",
            sub_category="博物馆",
            address=f"地址{i}",
            latitude=30.0 + i * 0.01,
            longitude=104.0 + i * 0.01,
            rating=4.5 - i * 0.1,
            price_level=2,
            visit_duration=120,
        )
        for i in range(5)
    ]
    for p in pois:
        db_session.add(p)
    await db_session.flush()
    return pois
