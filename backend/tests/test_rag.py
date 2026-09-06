import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.database.connection import SessionLocal
from app.database.models import KnowledgeDocument, KnowledgeChunk
from app.services.rag_service import rag_service
from app.services.embedding_service import embedding_service
from app.services.retrieval_service import retrieval_service

client = TestClient(app)

SAMPLE_WEBM_BYTES = b"RIFF" + b"\x00" * 200 + b"WAVEfmt " + b"\x10\x00\x00\x00" + b"\x01\x00\x01\x00" + b"\x00" * 800


def create_dummy_image_bytes(format="JPEG", size=(100, 100), color="green"):
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()


def test_seed_knowledge_base_endpoint():
    """Test seeding authoritative ICAR & SAU knowledge base documents."""
    response = client.post("/api/knowledge/seed?force=true")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["stats"]["documents_created"] >= 6
    assert data["stats"]["chunks_created"] >= 6


def test_list_knowledge_documents():
    """Test listing verified knowledge documents with metadata."""
    response = client.get("/api/knowledge/documents")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) >= 6
    for doc in docs:
        assert "title" in doc
        assert "source_name" in doc
        assert "authority" in doc
        assert "category" in doc
        assert doc["total_chunks"] >= 1


def test_get_knowledge_document_detail():
    """Test retrieving detail of a specific knowledge document and its chunks."""
    list_res = client.get("/api/knowledge/documents")
    assert list_res.status_code == 200
    docs = list_res.json()
    doc_id = docs[0]["id"]

    res = client.get(f"/api/knowledge/documents/{doc_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == doc_id
    assert len(detail["chunks"]) >= 1
    assert detail["chunks"][0]["content"] is not None


def test_knowledge_categories_endpoint():
    """Test retrieving supported knowledge categories."""
    response = client.get("/api/knowledge/categories")
    assert response.status_code == 200
    cats = response.json()
    assert len(cats) >= 5
    codes = [c["code"] for c in cats]
    assert "DISEASE_PEST_MANAGEMENT" in codes
    assert "POST_HARVEST_STORAGE" in codes
    assert "SOIL_HEALTH" in codes


def test_knowledge_crops_endpoint():
    """Test listing crops with verified research advisories."""
    response = client.get("/api/knowledge/crops")
    assert response.status_code == 200
    crops = response.json()
    assert "Tomato" in crops
    assert "Onion" in crops
    assert "Grapes" in crops


def test_semantic_knowledge_search_tomato_blight():
    """Test semantic search for Tomato early blight management."""
    response = client.get("/api/knowledge/search?q=How+to+control+early+blight+and+leaf+spots+on+tomato&crop=Tomato")
    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] > 0
    top_result = data["results"][0]
    assert "Tomato" in top_result["crop"]
    assert "ICAR" in top_result["authority"] or "MPKV" in top_result["authority"]
    assert top_result["similarity_score"] >= 0.60


def test_semantic_knowledge_search_onion_curing():
    """Test semantic search for Onion post-harvest curing and chawl storage."""
    response = client.get("/api/knowledge/search?q=onion+storage+curing+chawl+post+harvest&crop=Onion")
    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] > 0
    top_result = data["results"][0]
    assert top_result["category"] == "POST_HARVEST_STORAGE"
    assert "Onion" in top_result["crop"]


def test_semantic_knowledge_search_soil_ph():
    """Test semantic search for soil pH and organic carbon management."""
    response = client.get("/api/knowledge/search?q=soil+organic+carbon+and+ph+management&category=SOIL_HEALTH")
    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] > 0
    top_result = data["results"][0]
    assert top_result["category"] == "SOIL_HEALTH"


def test_rag_intent_decision_logic():
    """Test RAG decision layer: triggers for agronomic advice, defers pure live prices/transactions."""
    assert rag_service.should_use_rag("How do I control tomato early blight?") is True
    assert rag_service.should_use_rag("What is the best way to cure onions before storage?") is True
    assert rag_service.should_use_rag("How can I improve soil organic carbon in black soil?") is True
    assert rag_service.should_use_rag("Should I spray neem oil for thrips?") is True

    # Pure transactional / live mandi price queries should NOT invoke knowledge RAG
    assert rag_service.should_use_rag("What is today's price?") is False
    assert rag_service.should_use_rag("mandi price today") is False
    assert rag_service.should_use_rag("what is payment status") is False

    # Image upload should always enable RAG
    assert rag_service.should_use_rag("today's price", has_image=True) is True


def test_chat_with_rag_citations():
    """Test that chat endpoint invokes RAG and returns structured source items."""
    response = client.post(
        "/api/chat",
        json={
            "message": "How do I treat early blight and concentric leaf spots on my tomato plants?",
            "language": "en",
            "farmer_id": 1
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert "sources" in data
    assert len(data["sources"]) > 0
    first_source = data["sources"][0]
    assert "ICAR" in first_source["authority"] or "MPKV" in first_source["authority"]
    assert first_source["category"] in ["DISEASE_PEST_MANAGEMENT", "CROP_PRACTICES"]



def test_multilingual_chat_with_rag_hindi():
    """Test Hindi chat query grounds in verified knowledge."""
    response = client.post(
        "/api/chat",
        json={
            "message": "टमाटर में झुलसा रोग (blight) का जैविक उपचार कैसे करें?",
            "language": "hi",
            "farmer_id": 1
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "hi"
    assert len(data["sources"]) > 0


def test_image_analysis_chat_with_rag_citations():
    """Test multimodal crop leaf image analysis returns verified agronomic citations."""
    dummy_jpeg = create_dummy_image_bytes(format="JPEG")
    response = client.post(
        "/api/chat/analyze-image",
        files={"image": ("tomato_blight_leaf.jpg", io.BytesIO(dummy_jpeg), "image/jpeg")},
        data={"message": "Please identify this disease on my tomato crop and suggest remedies", "language": "en", "farmer_id": "1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "sources" in data
    assert len(data["sources"]) > 0
    assert data["image"]["image_url"] is not None


def test_voice_chat_with_rag_citations():
    """Test multilingual voice chat attaches verified knowledge citations."""
    audio_file = io.BytesIO(SAMPLE_WEBM_BYTES)
    response = client.post(
        "/api/voice/chat",
        files={"audio": ("voice_rag.webm", audio_file, "audio/webm")},
        data={"language": "en", "farmer_id": "1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "transcript" in data
    assert "response" in data
    assert "sources" in data
    assert data["audio"]["available"] is True
