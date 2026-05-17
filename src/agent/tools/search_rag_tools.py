"""RAG-based semantic search tools for the Agent."""

from src.agent.registry import register_tool
from src.services.rag.vector_store import retrieve_knowledge, search_similar_pois


@register_tool()
async def semantic_search_pois(city: str, query: str, k: int = 5) -> list[dict]:
    """Search POIs by semantic similarity to a natural language query.
    Returns POIs that are semantically related to the query, even if
    they don't contain the exact keywords."""
    return search_similar_pois(query, city=city, k=k)


@register_tool()
async def retrieve_travel_knowledge(query: str, k: int = 3) -> list[dict]:
    """Retrieve travel tips and knowledge documents relevant to the query.
    Covers city guides, seasonal advice, budget tips, transport info,
    food recommendations, and accommodation suggestions."""
    return retrieve_knowledge(query, k=k)
