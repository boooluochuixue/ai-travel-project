"""
Simple async task queue using Redis lists.
- Producer: LPUSH task JSON to a queue
- Worker:  BRPOP from queue (blocking pop)
"""

import json
from typing import Any, Optional

from src.services.cache.redis import get_redis


async def enqueue(queue_name: str, task: dict[str, Any]) -> None:
    """Push a task onto the queue."""
    r = await get_redis()
    await r.lpush(queue_name, json.dumps(task, ensure_ascii=False))


async def dequeue(queue_name: str, timeout: int = 30) -> Optional[dict[str, Any]]:
    """Blocking pop from the queue. Returns None if timeout reached."""
    r = await get_redis()
    result = await r.brpop(queue_name, timeout=timeout)
    if result is None:
        return None
    _, data = result
    return json.loads(data)
