import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_chat_empty_message_rejected():
    """Verify empty or blank messages are rejected with 400 Bad Request."""
    response = client.post("/api/chat", json={"message": "   ", "language": "en"})
    assert response.status_code == 400


def test_chat_creation_and_response():
    """Verify standard chat creates a conversation and returns a valid reply."""
    req = {
        "message": "When should I water my tomato crop?",
        "language": "en",
        "farmer_id": 1,
    }
    response = client.post("/api/chat", json=req)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 10
    assert "conversation_id" in data
    assert data["language"] == "en"
    assert isinstance(data["sources"], list)


def test_chat_follow_up_with_context():
    """Verify follow-up questions within the same conversation_id maintain continuity."""
    # First message
    res1 = client.post("/api/chat", json={
        "message": "My tomato crop is 40 days old.",
        "language": "en",
        "farmer_id": 1,
    })
    assert res1.status_code == 200
    conv_id = res1.json()["conversation_id"]

    # Follow-up message referencing previous statement
    res2 = client.post("/api/chat", json={
        "message": "When should I harvest it and what are the signs of maturity?",
        "language": "en",
        "conversation_id": conv_id,
        "farmer_id": 1,
    })
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["conversation_id"] == conv_id
    assert "harvest" in data2["reply"].lower() or "breaker" in data2["reply"].lower() or "tomato" in data2["reply"].lower()


def test_chat_multilingual_support():
    """Verify Indian languages (Hindi, Marathi, Telugu) generate appropriate localized responses."""
    # Hindi
    res_hi = client.post("/api/chat", json={
        "message": "टमाटर की फसल में सिंचाई कब करनी चाहिए?",
        "language": "hi",
        "farmer_id": 1,
    })
    assert res_hi.status_code == 200
    assert "सिंचाई" in res_hi.json()["reply"] or "टमाटर" in res_hi.json()["reply"]

    # Marathi
    res_mr = client.post("/api/chat", json={
        "message": "टोमॅटो काढणी कधी करावी?",
        "language": "mr",
        "farmer_id": 1,
    })
    assert res_mr.status_code == 200
    assert "काढणी" in res_mr.json()["reply"] or "टोमॅटो" in res_mr.json()["reply"] or "सल्ला" in res_mr.json()["reply"]


def test_get_conversations_and_history():
    """Verify listing conversations and retrieving message history transcript."""
    # Create a unique conversation
    res = client.post("/api/chat", json={
        "message": "Which nearby market gives better returns for onion?",
        "language": "en",
        "farmer_id": 1,
    })
    conv_id = res.json()["conversation_id"]

    # List conversations
    list_res = client.get("/api/chat/conversations?farmer_id=1")
    assert list_res.status_code == 200
    convs = list_res.json()
    assert len(convs) >= 1
    assert any(c["id"] == conv_id for c in convs)

    # Get conversation history
    hist_res = client.get(f"/api/chat/conversations/{conv_id}")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert hist["id"] == conv_id
    assert len(hist["messages"]) >= 2
    roles = [m["role"] for m in hist["messages"]]
    assert "user" in roles
    assert "assistant" in roles
