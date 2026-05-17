"""ChromaDB vector store wrapper for POI semantic search and travel knowledge."""

import uuid

import chromadb
from chromadb.api.types import QueryResult
from chromadb.config import Settings as ChromaSettings
from chromadb.errors import NotFoundError

from src.config import settings
from src.services.rag.embeddings import get_embeddings_model

# Collection names
POI_COLLECTION = "pois"
KNOWLEDGE_COLLECTION = "travel_knowledge"


def _get_client() -> chromadb.PersistentClient:
    """Get or create the ChromaDB persistent client."""
    return chromadb.PersistentClient(
        path=settings.chroma_persist_dir,
        settings=ChromaSettings(anonymized_telemetry=False),
    )


def _collection(name: str):
    """Get a collection, creating it if it doesn't exist."""
    client = _get_client()
    try:
        return client.get_collection(name)
    except NotFoundError:
        return client.create_collection(name)


def build_poi_index(pois: list[dict]) -> int:
    """Build or rebuild the POI vector index from a list of POI dicts.

    Each dict should have: id, name, category, sub_category, city_name,
    address, description, rating, tags (optional).
    """
    coll = _collection(POI_COLLECTION)
    embedder = get_embeddings_model()

    ids: list[str] = []
    texts: list[str] = []
    metadatas: list[dict] = []

    for poi in pois:
        poi_id = str(poi.get("id", uuid.uuid4().hex[:12]))
        text = f"{poi.get('name', '')} — {poi.get('description', '')} — {poi.get('sub_category', '')}"
        texts.append(text)
        ids.append(poi_id)
        metadatas.append({
            "poi_id": poi.get("id"),
            "name": poi.get("name", ""),
            "category": poi.get("category", ""),
            "city_name": poi.get("city_name", ""),
            "address": poi.get("address", ""),
            "rating": poi.get("rating", 0),
        })

    if not texts:
        return 0

    embeddings = embedder.embed_documents(texts)

    # Upsert in batches of 100 to avoid oversized requests
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        coll.upsert(
            ids=ids[i:i + batch_size],
            embeddings=embeddings[i:i + batch_size],
            documents=texts[i:i + batch_size],
            metadatas=metadatas[i:i + batch_size],
        )

    return len(texts)


def search_similar_pois(query: str, city: str | None = None, k: int = 5) -> list[dict]:
    """Search POIs by semantic similarity.

    Args:
        query: Natural language query string.
        city: Optional city name filter.
        k: Number of results to return.

    Returns:
        List of dicts with poi_id, name, category, city_name, address, score.
    """
    coll = _collection(POI_COLLECTION)
    embedder = get_embeddings_model()

    query_embedding = embedder.embed_query(query)

    where: dict | None = None
    if city:
        where = {"city_name": city}

    results: QueryResult = coll.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where=where,
    )

    pois = []
    if results["ids"] and results["ids"][0]:
        for i, poi_id in enumerate(results["ids"][0]):
            meta = (results["metadatas"][0][i] or {}) if results["metadatas"] else {}
            pois.append({
                "poi_id": meta.get("poi_id"),
                "name": meta.get("name", ""),
                "category": meta.get("category", ""),
                "city_name": meta.get("city_name", ""),
                "address": meta.get("address", ""),
                "rating": meta.get("rating", 0),
                "score": results["distances"][0][i] if results.get("distances") else 0,
            })

    return pois


def build_knowledge_index(documents: list[dict]) -> int:
    """Build the travel knowledge index from a list of document dicts.

    Each dict should have: id, title, content, tags (optional list[str]).
    """
    coll = _collection(KNOWLEDGE_COLLECTION)
    embedder = get_embeddings_model()

    ids: list[str] = []
    texts: list[str] = []
    metadatas: list[dict] = []

    for doc in documents:
        doc_id = str(doc.get("id", uuid.uuid4().hex[:12]))
        texts.append(doc.get("content", ""))
        ids.append(doc_id)
        metadatas.append({
            "title": doc.get("title", ""),
            "tags": ",".join(doc.get("tags", [])),
        })

    if not texts:
        return 0

    embeddings = embedder.embed_documents(texts)
    coll.upsert(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)
    return len(texts)


def retrieve_knowledge(query: str, k: int = 3) -> list[dict]:
    """Retrieve travel knowledge documents by semantic similarity."""
    coll = _collection(KNOWLEDGE_COLLECTION)
    embedder = get_embeddings_model()

    query_embedding = embedder.embed_query(query)
    results: QueryResult = coll.query(query_embeddings=[query_embedding], n_results=k)

    docs = []
    if results["ids"] and results["ids"][0]:
        for i in range(len(results["ids"][0])):
            meta = (results["metadatas"][0][i] or {}) if results["metadatas"] else {}
            docs.append({
                "title": meta.get("title", ""),
                "content": (results["documents"][0][i] or "") if results.get("documents") else "",
                "tags": meta.get("tags", ""),
                "score": results["distances"][0][i] if results.get("distances") else 0,
            })

    return docs
