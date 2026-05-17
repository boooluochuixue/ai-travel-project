"""Redis PubSub event publisher for SSE streaming.

Worker uses this to publish agent progress events in real-time.
API subscribes via manager.py and forwards as SSE to the client.
"""

import json


async def publish_event(task_id: str, event_type: str, data: dict) -> None:
    """Publish an event to the task's Redis PubSub channel.

    Event types: thought, tool_call, tool_result, progress, error, complete.
    """
    from src.services.cache.redis import get_redis
    """Publish an event to the task's Redis PubSub channel.

    Event types: thought, tool_call, tool_result, progress, error, complete.
    """
    r = await get_redis()
    payload = json.dumps({"type": event_type, "data": data}, ensure_ascii=False)
    await r.publish(f"task:{task_id}:events", payload)
