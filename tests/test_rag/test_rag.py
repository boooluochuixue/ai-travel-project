"""RAG service tests."""

import json
from unittest.mock import MagicMock, patch

import pytest

from src.services.rag.embeddings import get_embeddings_model
from src.services.rag.vector_store import (
    build_poi_index,
    search_similar_pois,
    retrieve_knowledge,
)
from src.services.rag.travel_knowledge import KNOWLEDGE_DOCUMENTS, seed_knowledge_index


class TestEmbeddings:
    """Embedding model tests."""

    def test_get_embeddings_model(self):
        model = get_embeddings_model()
        assert model is not None
        # Should be cached
        assert get_embeddings_model() is model


class TestVectorStore:
    """Vector store tests with mocked ChromaDB."""

    @pytest.fixture(autouse=True)
    def mock_chroma(self):
        """Mock ChromaDB to avoid dependency on file system and model downloads."""
        with (
            patch("src.services.rag.vector_store._get_client") as mock_client,
            patch("src.services.rag.vector_store.get_embeddings_model") as mock_emb,
        ):
            mock_collection = MagicMock()
            mock_client.return_value.get_collection.return_value = mock_collection
            mock_client.return_value.create_collection.return_value = mock_collection

            mock_emb_model = MagicMock()
            mock_emb_model.embed_query.return_value = [0.1] * 384
            mock_emb_model.embed_documents.return_value = [[0.1] * 384]
            mock_emb.return_value = mock_emb_model

            yield mock_collection, mock_emb_model

    def test_build_poi_index(self, mock_chroma):
        pois = [
            {"id": 1, "name": "宽窄巷子", "category": "attraction", "city_name": "成都",
             "description": "成都历史街区", "address": "青羊区", "rating": 4.5},
        ]
        count = build_poi_index(pois)
        assert count == 1

    def test_build_poi_index_empty(self, mock_chroma):
        count = build_poi_index([])
        assert count == 0

    def test_search_similar_pois(self, mock_chroma):
        mock_collection, _ = mock_chroma
        mock_collection.query.return_value = {
            "ids": [["1"]],
            "metadatas": [[{"name": "宽窄巷子", "city_name": "成都", "category": "attraction"}]],
            "distances": [[0.2]],
            "documents": [["成都历史街区"]],
        }

        results = search_similar_pois("历史文化街区", city="成都", k=5)
        assert len(results) >= 1
        assert results[0]["name"] == "宽窄巷子"

    def test_retrieve_knowledge(self, mock_chroma):
        mock_collection, _ = mock_chroma
        mock_collection.query.return_value = {
            "ids": [["k1"]],
            "metadatas": [[{"title": "成都旅行攻略", "tags": "成都,美食"}]],
            "distances": [[0.1]],
            "documents": [["成都是一座美食之都..."]],
        }

        results = retrieve_knowledge("成都旅游", k=3)
        assert len(results) >= 1
        assert results[0]["title"] == "成都旅行攻略"


class TestTravelKnowledge:
    """Travel knowledge document tests."""

    def test_knowledge_documents_exist(self):
        assert len(KNOWLEDGE_DOCUMENTS) >= 10

    def test_knowledge_documents_have_required_fields(self):
        for doc in KNOWLEDGE_DOCUMENTS:
            assert "id" in doc
            assert "title" in doc
            assert "content" in doc
            assert "tags" in doc
