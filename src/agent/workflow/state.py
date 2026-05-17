"""Agent workflow state — compatible with LangGraph create_react_agent."""

from typing import Annotated, Any, Optional, TypedDict

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """Shared state for the ReAct agent.

    Must include `messages` and `remaining_steps` for LangGraph's
    create_react_agent compatibility. Additional fields are for
    itinerary generation workflow.
    """

    messages: Annotated[list[AnyMessage], add_messages]
    remaining_steps: int  # Required by create_react_agent
    request: dict  # Original generation request
    user_id: Optional[int]
    output: dict  # Final structured itinerary
    error: Optional[str]
