import json
import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from redis.asyncio import Redis
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.deps import get_db
from src.common.errors import ServiceUnavailableError
from src.config import settings
from src.models.enums import ItineraryStatus
from src.models.schemas import (
    ItineraryGenerateRequest,
    ItineraryRefineRequest,
)
from src.models.tables import Itinerary, ItineraryDay, ItinerarySlot
from src.services.queue.redis_queue import enqueue

router = APIRouter(prefix="/itineraries", tags=["itineraries"])


@router.post("/generate")
async def generate_itinerary(
    req: ItineraryGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit an itinerary generation request (async)."""
    task_id = f"gen_{uuid.uuid4().hex[:12]}"

    # Store task in Redis
    try:
        redis = await get_redis()
        task_data = {
            "task_id": task_id,
            "status": "pending",
            "progress": 0.0,
            "current_stage": "",
            "itinerary_id": None,
        }
        await redis.set(f"task:{task_id}", json.dumps(task_data), ex=3600)
    except Exception as e:
        raise ServiceUnavailableError(
            message="Redis 服务未启动，请先启动 Redis",
            detail=str(e),
        )

    # Enqueue for async processing
    try:
        await enqueue(settings.generation_queue, {
            "event_id": f"evt_{uuid.uuid4().hex[:16]}",
            "type": "itinerary.generate",
            "payload": {
                "task_id": task_id,
                "request": req.model_dump(mode="json"),
            },
        })
    except Exception as e:
        raise ServiceUnavailableError(
            message="Redis 队列异常，请稍后重试",
            detail=str(e),
        )

    return {
        "code": 0,
        "message": "accepted",
        "data": {
            "task_id": task_id,
            "status": "pending",
        },
    }


@router.get("/generate/{task_id}/status")
async def get_generation_status(
    task_id: str,
):
    redis = await get_redis()
    task_data = await redis.get(f"task:{task_id}")
    if not task_data:
        return {"code": 40400, "message": "任务不存在或已过期", "data": None}

    task = json.loads(task_data)
    return {"code": 0, "data": task}


@router.get("")
async def list_itineraries(
    user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Itinerary)
    if user_id is not None:
        query = query.where(Itinerary.user_id == user_id)
    if status:
        query = query.where(Itinerary.status == status)
    query = query.order_by(Itinerary.created_at.desc())
    query = query.offset((page - 1) * size).limit(size)

    result = await db.execute(query)
    itineraries = result.scalars().all()

    return {
        "code": 0,
        "data": [_itinerary_summary(it) for it in itineraries],
        "page": page,
        "size": size,
    }


@router.get("/{itinerary_id}")
async def get_itinerary(
    itinerary_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Itinerary)
        .where(Itinerary.id == itinerary_id)
        .options(
            selectinload(Itinerary.days).selectinload(ItineraryDay.slots)
        )
    )
    itinerary = result.scalar_one_or_none()
    if not itinerary:
        return {"code": 40400, "message": "行程不存在", "data": None}

    return {
        "code": 0,
        "data": _itinerary_detail(itinerary),
    }


@router.post("/{itinerary_id}/refine")
async def refine_itinerary(
    itinerary_id: int,
    req: ItineraryRefineRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit an itinerary refinement request (async)."""
    # Verify itinerary exists
    result = await db.execute(
        select(Itinerary).where(Itinerary.id == itinerary_id)
    )
    itinerary = result.scalar_one_or_none()
    if not itinerary:
        return {"code": 40400, "message": "行程不存在", "data": None}

    task_id = f"ref_{uuid.uuid4().hex[:12]}"

    try:
        redis = await get_redis()
        task_data = {
            "task_id": task_id,
            "status": "pending",
            "itinerary_id": itinerary_id,
        }
        await redis.set(f"task:{task_id}", json.dumps(task_data), ex=3600)
    except Exception as e:
        raise ServiceUnavailableError(
            message="Redis 服务未启动，请先启动 Redis",
            detail=str(e),
        )

    try:
        await enqueue(settings.refine_queue, {
            "event_id": f"evt_{uuid.uuid4().hex[:16]}",
            "type": "itinerary.refine",
            "payload": {
                "task_id": task_id,
                "itinerary_id": itinerary_id,
                "feedback": req.feedback,
            },
        })
    except Exception as e:
        raise ServiceUnavailableError(
            message="Redis 队列异常，请稍后重试",
            detail=str(e),
        )

    return {
        "code": 0,
        "message": "accepted",
        "data": {"task_id": task_id, "status": "pending"},
    }


@router.post("/{itinerary_id}/confirm")
async def confirm_itinerary(
    itinerary_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Itinerary).where(Itinerary.id == itinerary_id)
    )
    itinerary = result.scalar_one_or_none()
    if not itinerary:
        return {"code": 40400, "message": "行程不存在", "data": None}

    query = (
        update(Itinerary)
        .where(Itinerary.id == itinerary_id)
        .values(status=ItineraryStatus.confirmed)
    )
    await db.execute(query)
    await db.commit()

    return {"code": 0, "message": "行程已确认"}


@router.delete("/{itinerary_id}")
async def delete_itinerary(
    itinerary_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Itinerary).where(Itinerary.id == itinerary_id)
    )
    itinerary = result.scalar_one_or_none()
    if not itinerary:
        return {"code": 40400, "message": "行程不存在", "data": None}

    query = (
        update(Itinerary)
        .where(Itinerary.id == itinerary_id)
        .values(status=ItineraryStatus.cancelled)
    )
    await db.execute(query)
    await db.commit()

    return {"code": 0, "message": "行程已删除"}


@router.get("/generate/stream/{task_id}")
async def stream_generation(task_id: str):
    """SSE endpoint: stream agent progress for a generation task."""
    from src.services.stream.manager import event_stream

    return StreamingResponse(
        event_stream(task_id),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Helpers ───

async def get_redis() -> Redis:
    from src.services.cache.redis import get_redis
    return await get_redis()


def _itinerary_summary(it: Itinerary) -> dict:
    return {
        "id": it.id,
        "title": it.title,
        "destinations": it.destinations,
        "start_date": str(it.start_date) if it.start_date else None,
        "end_date": str(it.end_date) if it.end_date else None,
        "total_budget": float(it.total_budget) if it.total_budget else None,
        "status": it.status.value,
        "created_at": it.created_at.isoformat() if it.created_at else None,
    }


def _itinerary_detail(it: Itinerary) -> dict:
    return {
        "id": it.id,
        "title": it.title,
        "destinations": it.destinations,
        "start_date": str(it.start_date) if it.start_date else None,
        "end_date": str(it.end_date) if it.end_date else None,
        "total_budget": float(it.total_budget) if it.total_budget else None,
        "budget_breakdown": it.budget_breakdown,
        "status": it.status.value,
        "created_at": it.created_at.isoformat() if it.created_at else None,
        "days": [
            {
                "day_number": d.day_number,
                "date": str(d.date) if d.date else None,
                "weather_forecast": d.weather_forecast,
                "notes": d.notes or "",
                "slots": [
                    {
                        "slot_type": s.slot_type.value,
                        "poi_id": s.poi_id,
                        "poi_name": s.poi_name,
                        "poi_category": s.poi_category,
                        "address": s.address,
                        "start_time": s.start_time,
                        "end_time": s.end_time,
                        "duration": s.duration,
                        "transport_tip": s.transport_tip,
                        "cost": float(s.cost) if s.cost else None,
                        "note": s.note or "",
                        "sort_order": s.sort_order,
                    }
                    for s in (d.slots or [])
                ],
            }
            for d in (it.days or [])
        ],
    }
