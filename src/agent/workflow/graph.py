"""Workflow entry point — delegates to ReAct agent."""

from src.agent.workflow.agent import build_react_agent


def compile_workflow():
    """Build and return compiled workflow.

    Backward-compatible wrapper that delegates to build_react_agent().
    """
    return build_react_agent()
