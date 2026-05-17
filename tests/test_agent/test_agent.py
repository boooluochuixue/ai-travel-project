"""Agent workflow, registry, and ReAct agent tests."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import HumanMessage

from src.agent.registry import get_tool, get_tools, register_tool
from src.agent.workflow.state import AgentState


class TestToolRegistry:
    """Tool registry tests."""

    def setup_method(self):
        # Import tool modules to trigger @register_tool() registration
        import src.agent.tools  # noqa: F401

    def test_registry_returns_tools(self):
        tools = get_tools()
        assert len(tools) >= 4  # poi, weather, budget, schedule
        tool_names = [t.name for t in tools]
        assert "get_city_info" in tool_names
        assert "search_pois" in tool_names
        assert "get_weather" in tool_names
        assert "calculate_budget" in tool_names
        assert "validate_schedule" in tool_names
        assert "semantic_search_pois" in tool_names
        assert "retrieve_travel_knowledge" in tool_names

    def test_get_tool_by_name(self):
        tool = get_tool("get_city_info")
        assert tool is not None
        assert tool.name == "get_city_info"

    def test_get_tool_not_found(self):
        assert get_tool("nonexistent") is None

    def test_register_tool_decorator(self):
        @register_tool(name="test_tool_func")
        async def my_tool(x: int) -> int:
            """A test tool."""
            return x * 2

        try:
            tool = get_tool("test_tool_func")
            assert tool is not None
            assert tool.name == "test_tool_func"
        finally:
            from src.agent.registry import _registry
            _registry.pop("test_tool_func", None)


class TestAgentState:
    """Simplified AgentState tests."""

    def test_state_defaults(self):
        state: AgentState = {
            "messages": [HumanMessage(content="测试")],
            "remaining_steps": 25,
            "request": {"destinations": [{"city_id": 1, "city_name": "成都", "days": 3}]},
            "user_id": None,
            "output": {},
            "error": None,
        }
        assert state["request"]["destinations"][0]["city_name"] == "成都"
        assert state["error"] is None

    def test_state_with_user_id(self):
        state: AgentState = {
            "messages": [],
            "remaining_steps": 25,
            "request": {},
            "user_id": 1,
            "output": {},
            "error": None,
        }
        assert state["user_id"] == 1


class TestReActAgent:
    """ReAct agent initialization tests with mocked dependencies."""

    @pytest.mark.asyncio
    async def test_build_react_agent(self):
        """build_react_agent should compile successfully."""
        mock_agent = MagicMock()
        mock_agent.name = "react_agent"

        with (
            patch("src.agent.workflow.agent.create_react_agent", return_value=mock_agent),
            patch("src.services.llm.client.get_llm") as mock_get_llm,
        ):
            mock_llm = MagicMock()
            mock_get_llm.return_value = mock_llm

            from src.agent.workflow.agent import build_react_agent
            agent = build_react_agent()
            assert agent is not None
            assert agent.name == "react_agent"
            agent = build_react_agent()
            assert agent is not None
            assert agent.name == "react_agent"

    @pytest.mark.asyncio
    async def test_compile_workflow_backward_compat(self):
        """compile_workflow should delegate to build_react_agent."""
        mock_agent = MagicMock()
        mock_agent.name = "react_agent"

        with (
            patch("src.agent.workflow.agent.create_react_agent", return_value=mock_agent),
            patch("src.services.llm.client.get_llm") as mock_get_llm,
        ):
            mock_llm = MagicMock()
            mock_get_llm.return_value = mock_llm

            from src.agent.workflow.graph import compile_workflow
            agent = compile_workflow()
            assert agent is not None
            assert agent.name == "react_agent"


class TestPoiTools:
    """POI tool tests."""

    @pytest.mark.asyncio
    async def test_get_city_info_not_found(self):
        from unittest.mock import MagicMock, AsyncMock

        from src.agent.tools.poi_tools import get_city_info

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None

        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session.__aenter__.return_value = mock_session

        with patch("src.agent.tools.poi_tools.async_session_factory", return_value=mock_session):
            result = await get_city_info.ainvoke({"city_name": "不存在城市"})
            assert "error" in result

    @pytest.mark.asyncio
    async def test_search_pois_no_results(self):
        from unittest.mock import MagicMock, AsyncMock

        from src.agent.tools.poi_tools import search_pois

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None

        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session.__aenter__.return_value = mock_session

        with patch("src.agent.tools.poi_tools.async_session_factory", return_value=mock_session):
            result = await search_pois.ainvoke({
                "city_name": "不存在城市",
                "categories": ["attraction"],
            })
            assert result == []


class TestBudgetTool:
    """Budget calculation tests."""

    @pytest.mark.asyncio
    async def test_calculate_budget_valid(self):
        from src.agent.tools.budget_tools import calculate_budget

        result = await calculate_budget.ainvoke({"total": 5000})
        assert result["total"] == 5000
        assert "transport" in result
        assert "hotel" in result
        assert "food" in result
        assert "tickets" in result
        assert "other" in result
        assert abs(result["transport"] + result["hotel"] + result["food"] + result["tickets"] + result["other"] - 5000) < 0.01

    @pytest.mark.asyncio
    async def test_calculate_budget_invalid_ratios(self):
        from src.agent.tools.budget_tools import calculate_budget

        result = await calculate_budget.ainvoke({
            "total": 5000,
            "transport_ratio": 1.0,
            "hotel_ratio": 0.5,
        })
        assert "error" in result


class TestWeatherTool:
    """Weather tool tests (Phase 1 mock)."""

    @pytest.mark.asyncio
    async def test_get_weather(self):
        from src.agent.tools.weather_tools import get_weather

        result = await get_weather.ainvoke({"city_name": "成都"})
        assert "city" in result
        assert result["city"] == "成都"
        assert "temp_min" in result
        assert "temp_max" in result


class TestScheduleTool:
    """Schedule validation tests."""

    @pytest.mark.asyncio
    async def test_validate_empty_schedule(self):
        from src.agent.tools.schedule_tools import validate_schedule

        result = await validate_schedule.ainvoke({"slots": []})
        assert result["valid"] is False
        assert len(result["issues"]) == 1

    @pytest.mark.asyncio
    async def test_validate_good_schedule(self):
        from src.agent.tools.schedule_tools import validate_schedule

        slots = [
            {"poi_name": "景点A", "duration": 120},
            {"poi_name": "景点B", "duration": 60},
            {"poi_name": "餐厅C", "duration": 90},
        ]
        result = await validate_schedule.ainvoke({"slots": slots})
        assert result["total_slots"] == 3
