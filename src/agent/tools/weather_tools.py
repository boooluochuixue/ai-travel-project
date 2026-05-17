"""Weather tool for the Agent (Phase 1: mock implementation)."""

from datetime import date, timedelta
from typing import Optional

from src.agent.registry import register_tool


@register_tool()
async def get_weather(city_name: str, date_str: Optional[str] = None) -> dict:
    """Get weather forecast for a city on a specific date.
    Date format: YYYY-MM-DD. If not provided, returns today's weather."""
    # Phase 1 mock: return simulated data
    # Phase 2+: replace with real weather API call

    today = date.today()
    target_date: date
    if date_str:
        from datetime import datetime
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    else:
        target_date = today

    delta_days = (target_date - today).days

    # Simulated weather based on city and time of year
    month = target_date.month
    if 3 <= month <= 5:
        season = "spring"
        base_temp = 20
    elif 6 <= month <= 8:
        season = "summer"
        base_temp = 30
    elif 9 <= month <= 11:
        season = "autumn"
        base_temp = 22
    else:
        season = "winter"
        base_temp = 8

    # City temperature adjustments
    temp_adjust = {
        "北京": 0, "上海": 2, "成都": 1, "西安": -1, "大理": -4,
    }
    adj = temp_adjust.get(city_name, 0)

    return {
        "city": city_name,
        "date": str(target_date),
        "weather": "晴" if delta_days <= 7 else "多云",
        "temp_min": base_temp + adj - 5,
        "temp_max": base_temp + adj + 5,
        "humidity": 50 + (10 if "上海" in city_name else 0),
        "wind": "微风",
        "tips": "适合出行" if season in ("spring", "autumn") else "注意防暑" if season == "summer" else "注意保暖",
    }
