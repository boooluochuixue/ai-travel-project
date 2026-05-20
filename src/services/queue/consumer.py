"""
Agent Worker: polls Redis task queues and executes ReAct agent workflows.

Run: python -m src.services.queue.consumer
"""

import asyncio
import json
import uuid

from langchain_core.messages import HumanMessage

from src.agent.workflow.state import AgentState
from src.common.logger import logger
from src.config import settings
from src.models.database import async_session_factory
from src.models.enums import ItineraryStatus
from src.models.tables import Itinerary, ItineraryDay, ItinerarySlot
from src.services.cache.redis import get_redis
from src.services.queue.redis_queue import dequeue
from src.services.stream.publisher import publish_event


def _extract_json_output(raw: dict) -> dict:
    """Extract a JSON itinerary dict from the agent's final state."""
    import re as _re

    # Try the custom output field first
    result = raw.get("output")
    if isinstance(result, dict) and result.get("days"):
        return result

    # Fall back to extracting from the last message
    messages = raw.get("messages", []) or []
    if not messages:
        return {}

    last_msg = messages[-1]
    content = ""
    if hasattr(last_msg, "content"):
        content = last_msg.content or ""
    elif isinstance(last_msg, dict):
        content = last_msg.get("content", "") or ""

    if not content:
        return {}

    # Try extracting JSON from markdown code blocks
    json_match = _re.search(r"```(?:json)?\s*\n?(.*?)\n?```", content, _re.DOTALL)
    if json_match:
        content = json_match.group(1).strip()

    # Fallback: find the first top-level JSON object
    if not content.startswith("{"):
        obj_match = _re.search(r"\{.*\}", content, _re.DOTALL)
        if obj_match:
            content = obj_match.group(0)

    try:
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}


async def handle_generation(payload: dict) -> None:
    """Handle an itinerary generation request with SSE streaming."""
    task_id = payload.get("task_id", "")
    request_data = payload.get("request", {})
    user_id = payload.get("user_id")

    logger.info(f"Processing generation task: {task_id}")

    redis = await get_redis()
    await redis.set(
        f"task:{task_id}",
        json.dumps({"task_id": task_id, "status": "processing", "progress": 0.1, "current_stage": "agent_start"}),
        ex=3600,
    )

    try:
        from src.agent.workflow.agent import build_react_agent

        agent = build_react_agent()

        # Build initial message from request
        user_message = _build_user_message(request_data)
        initial_state: AgentState = {
            "messages": [HumanMessage(content=user_message)],
            "remaining_steps": 25,
            "request": request_data,
            "user_id": user_id,
            "output": {},
            "error": None,
        }

        # Stream events to SSE with step progress
        final_output = {}
        seen_events = set()
        step = 0
        STEPS = [
            "分析旅行需求",
            "搜索景点信息",
            "规划行程安排",
            "推荐住宿酒店",
            "生成最终方案",
        ]
        async for event in agent.astream_events(initial_state, version="v2"):
            kind = event["event"]
            event_name = event.get("name", "")
            seen_events.add(kind)

            if kind == "on_chat_model_start":
                step = min(step + 1, len(STEPS))
                stage = STEPS[step - 1] if step > 0 else ""
                await publish_event(task_id, "progress", {
                    "progress": step / len(STEPS),
                    "step": step,
                    "total_steps": len(STEPS),
                    "current_stage": f"{stage}中",
                })
                await publish_event(task_id, "thought", {"content": f"{stage}中..."})

            elif kind == "on_tool_start":
                tool_input = event["data"].get("input", {})
                await publish_event(task_id, "tool_call", {
                    "name": event_name,
                    "input": tool_input,
                })

            elif kind == "on_tool_end":
                tool_output = event["data"].get("output", "")
                await publish_event(task_id, "tool_result", {
                    "name": event_name,
                    "output": str(tool_output)[:500],
                })

            elif kind == "on_chain_end":
                raw = event["data"].get("output", {})
                if isinstance(raw, dict):
                    extracted = _extract_json_output(raw)
                    if extracted:
                        final_output = extracted

        logger.info(f"Events seen: {seen_events}")
        logger.info(f"Final output keys: {list(final_output.keys()) if final_output else 'empty'}")

        # Publish progress
        await publish_event(task_id, "progress", {"progress": 1.0, "step": len(STEPS), "total_steps": len(STEPS), "current_stage": "保存方案中"})

        itinerary_id = await save_itinerary(final_output, user_id)
        logger.info(f"Itinerary saved: id={itinerary_id}")

        await redis.set(
            f"task:{task_id}",
            json.dumps({
                "task_id": task_id,
                "status": "completed",
                "progress": 1.0,
                "itinerary_id": itinerary_id,
            }),
            ex=3600,
        )

        await publish_event(task_id, "complete", {
            "itinerary_id": itinerary_id,
            "message": "行程生成完成",
        })

        logger.info(f"Task {task_id} completed: itinerary_id={itinerary_id}")

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}", exc_info=True)
        await redis.set(
            f"task:{task_id}",
            json.dumps({"task_id": task_id, "status": "failed", "error": str(e)}),
            ex=3600,
        )
        await publish_event(task_id, "error", {"message": str(e)})


def _build_user_message(request: dict) -> str:
    """Build a user message from a generation request."""
    destinations = request.get("destinations", [])
    preferences = request.get("preferences", {})
    total_budget = request.get("total_budget")
    departure_city = request.get("departure_city", "")
    travelers = request.get("travelers", {})
    special_needs = request.get("special_needs", [])
    selected_poi_ids = request.get("selected_poi_ids", [])
    selected_hotel = request.get("selected_hotel")
    notes = request.get("notes", "")

    parts = ["请帮我规划一次旅行。"]

    if departure_city:
        parts.append(f"出发城市：{departure_city}")

    dest_str = "、".join(f"{d.get('city_name', '')}({d.get('days', 1)}天)" for d in destinations)
    parts.append(f"目的地：{dest_str}")

    adults = travelers.get("adults", 2)
    children = travelers.get("children", 0)
    elders = travelers.get("elders", 0)
    travelers_parts = []
    if adults:
        travelers_parts.append(f"{adults}位成人")
    if children:
        travelers_parts.append(f"{children}位儿童")
    if elders:
        travelers_parts.append(f"{elders}位老人")
    if travelers_parts:
        parts.append(f"出行人员：{'、'.join(travelers_parts)}")

    interests = preferences.get("interests", [])
    if interests:
        parts.append(f"兴趣偏好：{'、'.join(interests)}")

    budget_level = preferences.get("budget_level", "moderate")
    budget_label = {"economy": "经济型", "moderate": "舒适型", "luxury": "豪华型"}
    parts.append(f"预算等级：{budget_label.get(budget_level, '舒适型')}")

    pace = preferences.get("pace", "normal")
    pace_label = {"relaxed": "轻松", "normal": "适中", "intensive": "紧凑"}
    parts.append(f"行程节奏：{pace_label.get(pace, '适中')}")

    if total_budget:
        parts.append(f"总预算：{total_budget}元")

    if special_needs:
        parts.append(f"特别需求：{'、'.join(special_needs)}")

    if selected_poi_ids:
        parts.append(f"用户已选定的景点ID：{selected_poi_ids}，请优先将这些景点纳入行程规划")

    if selected_hotel:
        hotel_name = selected_hotel.get("name", "")
        hotel_location = selected_hotel.get("location", "")
        parts.append(f"用户选择的酒店：{hotel_name}（{hotel_location}），请以此酒店作为每日行程的出发点进行路线规划")

    if notes:
        parts.append(f"备注：{notes}")

    parts.append("\n请先生成一个整体行程规划框架，然后逐步细化到每天的安排。")
    parts.append("最终用 JSON 格式输出完整行程。")
    return "\n".join(parts)


async def handle_refine(payload: dict) -> None:
    """Handle an itinerary refinement request."""
    task_id = payload.get("task_id", "")
    itinerary_id = payload.get("itinerary_id")
    feedback = payload.get("feedback", "")

    logger.info(f"Processing refine task: {task_id} for itinerary {itinerary_id}")

    redis = await get_redis()
    await redis.set(
        f"task:{task_id}",
        json.dumps({"task_id": task_id, "status": "processing", "itinerary_id": itinerary_id}),
        ex=3600,
    )

    try:
        async with async_session_factory() as session:
            from sqlalchemy import select
            from sqlalchemy.orm import selectinload

            result = await session.execute(
                select(Itinerary)
                .where(Itinerary.id == itinerary_id)
                .options(selectinload(Itinerary.days).selectinload(ItineraryDay.slots))
            )
            itinerary = result.scalar_one_or_none()

            if not itinerary:
                raise ValueError(f"Itinerary {itinerary_id} not found")

            request_data = {
                "destinations": itinerary.destinations,
                "preferences": itinerary.preferences or {},
                "total_budget": float(itinerary.total_budget) if itinerary.total_budget else None,
                "feedback": feedback,
            }

            agent = build_react_agent()
            user_message = _build_user_message(request_data)
            user_message += f"\n\n用户反馈/修改意见：{feedback}"
            initial_state: AgentState = {
                "messages": [HumanMessage(content=user_message)],
                "remaining_steps": 25,
                "request": request_data,
                "user_id": itinerary.user_id,
                "output": {},
                "error": None,
            }

            final_output = {}
            async for event in agent.astream_events(initial_state, version="v2"):
                if event["event"] == "on_chain_end":
                    raw = event["data"].get("output", {})
                    if isinstance(raw, dict):
                        extracted = _extract_json_output(raw)
                        if extracted:
                            final_output = extracted

            # Delete old days & slots
            for day in itinerary.days:
                await session.delete(day)

            new_itinerary_id = await save_itinerary(final_output, itinerary.user_id)
            await session.commit()

            await redis.set(
                f"task:{task_id}",
                json.dumps({"task_id": task_id, "status": "completed", "itinerary_id": new_itinerary_id}),
                ex=3600,
            )

            logger.info(f"Refine task {task_id} completed: new_itinerary_id={new_itinerary_id}")

    except Exception as e:
        logger.error(f"Refine task {task_id} failed: {e}", exc_info=True)
        await redis.set(
            f"task:{task_id}",
            json.dumps({"task_id": task_id, "status": "failed", "error": str(e)}),
            ex=3600,
        )


async def save_itinerary(output: dict, user_id: int = None) -> int:
    """Save generated itinerary to database."""
    async with async_session_factory() as session:
        itinerary = Itinerary(
            user_id=user_id,
            title=output.get("title", ""),
            destinations=output.get("destinations", []),
            total_budget=output.get("total_budget"),
            budget_breakdown=output.get("budget_breakdown"),
            preferences=output.get("preferences"),
            status=ItineraryStatus.draft,
            raw_plan=json.dumps(output, ensure_ascii=False),
        )
        session.add(itinerary)
        await session.flush()

        days_data = output.get("days", [])
        for day_data in days_data:
            day = ItineraryDay(
                itinerary_id=itinerary.id,
                day_number=day_data.get("day_number", 1),
                hotel=day_data.get("hotel"),
                hotel_options=day_data.get("hotel_options"),
                notes=day_data.get("notes", ""),
            )
            session.add(day)
            await session.flush()

            slots_data = day_data.get("slots", [])
            for i, slot_data in enumerate(slots_data):
                slot = ItinerarySlot(
                    day_id=day.id,
                    slot_type=slot_data.get("slot_type", "morning"),
                    poi_name=slot_data.get("poi_name", ""),
                    poi_category=slot_data.get("poi_category", ""),
                    address=slot_data.get("address", ""),
                    start_time=slot_data.get("start_time", ""),
                    end_time=slot_data.get("end_time", ""),
                    duration=slot_data.get("duration", 120),
                    transport_tip=slot_data.get("transport_tip", ""),
                    cost=slot_data.get("cost"),
                    note=slot_data.get("note", ""),
                    sort_order=slot_data.get("sort_order", i),
                )
                session.add(slot)

        await session.commit()
        return itinerary.id


async def run_consumer() -> None:
    """Main consumer loop — polls Redis queues."""
    logger.info("Starting Agent Worker (Redis queue consumer)...")

    queues = [settings.generation_queue, settings.refine_queue]
    logger.info(f"Listening on queues: {queues}")

    while True:
        for queue_name in queues:
            try:
                task = await dequeue(queue_name, timeout=3)
                if task is None:
                    continue

                msg_type = task.get("type", "")

                if msg_type == "itinerary.generate":
                    await handle_generation(task.get("payload", {}))
                elif msg_type == "itinerary.refine":
                    await handle_refine(task.get("payload", {}))
                else:
                    logger.warning(f"Unknown message type: {msg_type}")

            except Exception as e:
                logger.error(f"Error processing message from {queue_name}: {e}", exc_info=True)

        await asyncio.sleep(0.1)


if __name__ == "__main__":
    asyncio.run(run_consumer())
