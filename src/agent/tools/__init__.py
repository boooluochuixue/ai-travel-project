"""Tool modules — importing this package triggers registry registration."""

# Import all tool modules so their @register_tool() decorators execute.
# After import, use src.agent.registry.get_tools() to retrieve them.
import src.agent.tools.poi_tools  # noqa: F401
import src.agent.tools.weather_tools  # noqa: F401
import src.agent.tools.budget_tools  # noqa: F401
import src.agent.tools.schedule_tools  # noqa: F401
import src.agent.tools.search_rag_tools  # noqa: F401

__all__: list[str] = []
