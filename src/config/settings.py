from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_name: str = "travel-planner"
    app_debug: bool = True
    app_log_level: str = "INFO"

    # Database
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "travel_planner"
    db_password: str = "changeme"
    db_name: str = "travel_planner"

    @property
    def db_url(self) -> str:
        return f"mysql+aiomysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: Optional[str] = None
    redis_db: int = 0

    @property
    def redis_url(self) -> str:
        pwd = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{pwd}{self.redis_host}:{self.redis_port}/{self.redis_db}"

    # Task Queue (Redis lists)
    generation_queue: str = "itinerary:generate"
    refine_queue: str = "itinerary:refine"
    result_queue: str = "itinerary:result"

    # LLM (Multi-provider)
    llm_provider: str = "anthropic"  # "anthropic", "openai", "openai_compatible"
    llm_api_key: Optional[str] = None      # generic fallback
    llm_base_url: Optional[str] = None     # for OpenAI-compatible endpoints
    llm_model: str = "claude-sonnet-4-20250514"
    llm_max_tokens: int = 8192
    llm_temperature: float = 0.3
    anthropic_api_key: Optional[str] = None  # backward compat

    # RAG / Embedding
    chroma_persist_dir: str = "./chroma_db"
    embedding_model: str = "all-MiniLM-L6-v2"

    # External APIs
    amap_api_key: Optional[str] = None
    weather_api_key: Optional[str] = None
