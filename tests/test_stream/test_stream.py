"""SSE streaming service tests."""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.services.stream.manager import event_stream
from src.services.stream.publisher import publish_event


class TestPublisher:
    """Redis PubSub event publisher tests.

    The autouse conftest fixture patches src.services.cache.redis.get_redis,
    so all calls to get_redis() (including inline imports in publisher.py)
    return the conftest's mock_redis by default.
    """

    @pytest.mark.asyncio
    async def test_publish_event(self):
        # Configure the existing conftest mock
        from src.services.cache.redis import get_redis

        mock_redis = await get_redis()
        mock_redis.publish = AsyncMock()

        await publish_event("task_1", "thought", {"content": "thinking..."})

        mock_redis.publish.assert_called_once()
        channel = mock_redis.publish.call_args[0][0]
        payload = json.loads(mock_redis.publish.call_args[0][1])
        assert channel == "task:task_1:events"
        assert payload["type"] == "thought"
        assert payload["data"]["content"] == "thinking..."

    @pytest.mark.asyncio
    async def test_publish_complete_event(self):
        from src.services.cache.redis import get_redis

        mock_redis = await get_redis()
        mock_redis.publish = AsyncMock()

        await publish_event("task_1", "complete", {"itinerary_id": 42, "message": "done"})

        payload = json.loads(mock_redis.publish.call_args[0][1])
        assert payload["type"] == "complete"
        assert payload["data"]["itinerary_id"] == 42


class TestEventStream:
    """SSE event stream tests."""

    @pytest.mark.asyncio
    async def test_event_stream_yields_sse_events(self):
        from src.services.cache.redis import get_redis

        mock_redis = await get_redis()

        messages = [
            {"type": "message", "data": json.dumps({"type": "thought", "data": {"content": "分析中..."}})},
            {"type": "message", "data": json.dumps({"type": "complete", "data": {"itinerary_id": 1}})},
        ]

        mock_pubsub = AsyncMock()
        mock_pubsub.subscribe = AsyncMock()
        mock_pubsub.unsubscribe = AsyncMock()
        mock_pubsub.close = AsyncMock()
        mock_pubsub.get_message = AsyncMock(side_effect=messages)
        # redis.pubsub() is synchronous, use MagicMock
        mock_redis.pubsub = MagicMock(return_value=mock_pubsub)

        events = []
        async for chunk in event_stream("test_task", timeout=10):
            events.append(chunk)

        assert len(events) == 2
        for event in events:
            assert event.startswith("data: ")
            assert event.endswith("\n\n")

        first_data = json.loads(events[0][6:].strip())
        assert first_data["type"] == "thought"

    @pytest.mark.asyncio
    async def test_event_stream_stops_on_complete(self):
        from src.services.cache.redis import get_redis

        mock_redis = await get_redis()

        messages = [
            {"type": "message", "data": json.dumps({"type": "thought", "data": {}})},
            {"type": "message", "data": json.dumps({"type": "progress", "data": {"progress": 0.5}})},
            {"type": "message", "data": json.dumps({"type": "complete", "data": {"itinerary_id": 1}})},
        ]

        mock_pubsub = AsyncMock()
        mock_pubsub.subscribe = AsyncMock()
        mock_pubsub.unsubscribe = AsyncMock()
        mock_pubsub.close = AsyncMock()
        mock_pubsub.get_message = AsyncMock(side_effect=messages)
        mock_redis.pubsub = MagicMock(return_value=mock_pubsub)

        events = []
        async for chunk in event_stream("test_task", timeout=10):
            events.append(chunk)

        assert len(events) == 3
