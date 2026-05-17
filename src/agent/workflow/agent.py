"""ReAct agent — mainstream agent architecture using LangGraph create_react_agent."""

from langgraph.prebuilt import create_react_agent

from src.agent.prompts.react_system import REACT_SYSTEM_PROMPT
from src.agent.registry import get_tools
from src.agent.workflow.state import AgentState
from src.common.logger import logger


def build_react_agent():
    """Build and return a compiled ReAct agent using create_react_agent.

    The agent uses tools registered via @register_tool() and
    a single system prompt for independent tool-use planning.
    """
    from src.services.llm.client import get_llm

    import src.agent.tools  # noqa: F401 — trigger tool registration

    model = get_llm()
    tools = get_tools()

    logger.info(f"Building ReAct agent with {len(tools)} tools: {[t.name for t in tools]}")

    agent = create_react_agent(
        model=model,
        tools=tools,
        state_schema=AgentState,
        prompt=REACT_SYSTEM_PROMPT,
    )

    logger.info("ReAct agent compiled")
    return agent
