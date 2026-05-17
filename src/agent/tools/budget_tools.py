"""Budget calculation tool."""

from src.agent.registry import register_tool


@register_tool()
async def calculate_budget(
    total: float,
    transport_ratio: float = 0.20,
    hotel_ratio: float = 0.35,
    food_ratio: float = 0.25,
    tickets_ratio: float = 0.15,
    other_ratio: float = 0.05,
) -> dict:
    """Calculate a budget breakdown based on total budget and allocation ratios.
    Ratios must sum to 1.0 (100%)."""
    total_ratio = transport_ratio + hotel_ratio + food_ratio + tickets_ratio + other_ratio
    if abs(total_ratio - 1.0) > 0.01:
        return {"error": f"比例之和必须为 1.0，当前为 {total_ratio:.2f}"}

    return {
        "total": round(total, 2),
        "transport": round(total * transport_ratio, 2),
        "hotel": round(total * hotel_ratio, 2),
        "food": round(total * food_ratio, 2),
        "tickets": round(total * tickets_ratio, 2),
        "other": round(total * other_ratio, 2),
        "breakdown": {
            "transport_ratio": transport_ratio,
            "hotel_ratio": hotel_ratio,
            "food_ratio": food_ratio,
            "tickets_ratio": tickets_ratio,
            "other_ratio": other_ratio,
        },
    }
