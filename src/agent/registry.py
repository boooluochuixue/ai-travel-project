"""Tool registry — plugin-style tool discovery.

Usage:
    from src.agent.registry import register_tool, get_tools

    @register_tool()
    async def my_tool(...) -> ...:
        ...
"""

from langchain_core.tools import BaseTool, tool

_registry: dict[str, BaseTool] = {}


def register_tool(*, name: str | None = None):
    """Decorator that registers a function as a callable LangChain tool.

    The decorated function is converted via @tool() and
    added to the global registry under its tool name.
    """
    def decorator(func):
        t = tool(func)
        if name:
            t.name = name
        _registry[t.name] = t
        return t
    return decorator


def get_tools() -> list[BaseTool]:
    """Return all registered tools."""
    return list(_registry.values())


def get_tool(name: str) -> BaseTool | None:
    """Look up a tool by name."""
    return _registry.get(name)
