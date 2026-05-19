"""SSE event stream manager — subscribes to Redis PubSub and yields SSE-formatted events."""

import asyncio
import json
from typing import AsyncGenerator


async def event_stream(task_id: str, timeout: int = 300) -> AsyncGenerator[str, None]:
    """Subscribe to task events and yield SSE-formatted strings.

    Yields "data: <json>\n\n" for each event.
    First checks if the task is already completed/pending/failed
    in Redis — if complete or failed, sends the terminal event
    immediately without subscribing.
    Ends when complete/error event received or timeout reached.
    """
    from src.services.cache.redis import get_redis

    r = await get_redis()

    # Check task status first — handles reconnection after the
    # terminal event was already published (PubSub is fire-and-forget).
    task_raw = await r.get(f"task:{task_id}")
    if task_raw:
        task = json.loads(task_raw)
        status = task.get("status")
        if status == "completed":
            yield _sse("complete", {"itinerary_id": task["itinerary_id"], "message": "行程生成完成"})
            return
        if status == "failed":
            yield _sse("error", {"message": task.get("error") or "生成失败"})
            return

    # Subscribe to live events
    pubsub = r.pubsub()
    await pubsub.subscribe(f"task:{task_id}:events")

    try:
        deadline = asyncio.get_event_loop().time() + timeout

        while True:
            if asyncio.get_event_loop().time() > deadline:
                yield _sse("error", {"message": "timeout"})
                break

            try:
                message = await asyncio.wait_for(
                    pubsub.get_message(ignore_subscribe_messages=True), timeout=1.0
                )
            except asyncio.TimeoutError:
                # Re-check task status periodically in case we missed
                # the terminal PubSub event.
                task_raw = await r.get(f"task:{task_id}")
                if task_raw:
                    task = json.loads(task_raw)
                    status = task.get("status")
                    if status == "completed":
                        yield _sse("complete", {"itinerary_id": task["itinerary_id"], "message": "行程生成完成"})
                        break
                    if status == "failed":
                        yield _sse("error", {"message": task.get("error") or "生成失败"})
                        break
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


def _sse(event_type: str, data: dict) -> str:
    return f"data: {json.dumps({'type': event_type, 'data': data}, ensure_ascii=False)}\n\n"
