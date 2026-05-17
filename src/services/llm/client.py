from typing import Optional

from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI

from src.config import settings

_llm: Optional[BaseChatModel] = None


def _build_model() -> BaseChatModel:
    """Build the appropriate LLM model based on settings."""
    provider = settings.llm_provider

    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=settings.llm_model,
            anthropic_api_key=settings.anthropic_api_key or settings.llm_api_key,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )

    if provider == "openai":
        return ChatOpenAI(
            model=settings.llm_model,
            api_key=settings.llm_api_key,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )

    if provider == "openai_compatible":
        kwargs = dict(
            model=settings.llm_model,
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )
        if "deepseek" in settings.llm_model.lower():
            # Disable DeepSeek thinking mode to avoid the
            # reasoning_content field that LangChain doesn't
            # properly preserve across multi-turn calls.
            kwargs["extra_body"] = {"thinking": {"type": "disabled"}}
        return ChatOpenAI(**kwargs)

    raise ValueError(
        f"Unsupported LLM provider: {provider}. "
        f"Supported: anthropic, openai, openai_compatible"
    )


def get_llm() -> BaseChatModel:
    global _llm
    if _llm is None:
        _llm = _build_model()
    return _llm
