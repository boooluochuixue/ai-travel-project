"""Simple schedule validation tool (Phase 1 basic checks)."""

from src.agent.registry import register_tool


@register_tool()
async def validate_schedule(slots: list[dict]) -> dict:
    """Validate a day's schedule for timing conflicts and reasonableness.
    Returns any issues found."""
    issues = []

    for i, slot in enumerate(slots):
        # Check empty slots
        if not slot.get("poi_name"):
            issues.append({
                "level": "warning",
                "message": f"第 {i + 1} 个时段缺少景点",
                "slot_index": i,
            })

        # Check duration
        duration = slot.get("duration", 120)
        if duration < 30:
            issues.append({
                "level": "warning",
                "message": f"'{slot.get('poi_name', '')}' 游览时间仅 {duration} 分钟，可能过短",
                "slot_index": i,
            })
        if duration > 480:
            issues.append({
                "level": "info",
                "message": f"'{slot.get('poi_name', '')}' 游览时间 {duration} 分钟，建议确认是否可行",
                "slot_index": i,
            })

    # Check for too many slots
    if len(slots) > 5:
        issues.append({
            "level": "warning",
            "message": f"一天安排了 {len(slots)} 个活动，可能过于紧凑",
        })

    # Check for too few slots
    if len(slots) == 0:
        issues.append({
            "level": "warning",
            "message": "这一天没有安排任何活动",
        })

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "total_slots": len(slots),
    }
