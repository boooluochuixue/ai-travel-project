"""SSE event stream manager — subscribes to Redis PubSub and yields SSE-formatted events."""

import asyncio
import json
from typing import AsyncGenerator


async def event_stream(task_id: str, timeout: int = 300) -> AsyncGenerator[str, None]:
    """Subscribe to task events and yield SSE-formatted strings.

    Yields "data: <json>\n\n" for each event.
    Ends when complete/error event received or timeout reached.

    Uses inline imports so conftest mocks are effective.
    """
    from src.services.cache.redis import get_redis

    r = await get_redis()
    pubsub = r.pubsub()
    await pubsub.subscribe(f"task:{task_id}:events")

    try:
        deadline = asyncio.get_event_loop().time() + timeout

        while True:
            if asyncio.get_event_loop().time() > deadline:
                yield f"data: {json.dumps({'type': 'error', 'data': {'message': 'timeout'}})}\n\n"
                break

            try:
                message = await asyncio.wait_for(
                    pubsub.get_message(ignore_subscribe_messages=True), timeout=1.0
                )
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"
                continue

            if message is None:
                continue

            if message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                yield f"data: {data}\n\n"

                parsed = json.loads(data)
                if parsed.get("type") in ("complete", "error"):
                    break

    finally:
        await pubsub.unsubscribe(f"task:{task_id}:events")
        await pubsub.close()
