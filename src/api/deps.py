from collections.abc import AsyncGenerator
from typing import Optional

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.models.database import async_session_factory
from src.services.cache.redis import get_redis


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_redis_client() -> AsyncGenerator[Redis, None]:
    redis = await get_redis()
    try:
        yield redis
    finally:
        await redis.close()
