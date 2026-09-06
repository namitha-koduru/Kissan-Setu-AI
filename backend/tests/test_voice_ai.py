import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Dummy valid audio bytes representing a recorded voice clip
SAMPLE_WEBM_BYTES = b"RIFF" + b"\x00" * 200 + b"WAVEfmt " + b"\x10\x00\x00\x00" + b"\x01\x00\x01\x00" + b"\x00" * 800
TINY_AUDIO_BYTES = b"RIFF\x00\x00\x00\x00WAVE"


def test_transcribe_valid_audio():
    """Test standard speech-to-text audio transcription."""
    audio_file = io.BytesIO(SAMPLE_WEBM_BYTES)
    response = client.post(
        "/api/voice/transcribe",
        files={"audio": ("farmer_query.webm", audio_file, "audio/webm")},
        data={"language": "te"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "transcript" in data
    assert len(data["transcript"]) > 0
    assert data["language"] == "te"
    assert data["confidence"] in ["high", "medium", "low"]


def test_transcribe_empty_audio_rejected():
    """Test empty audio file returns 400 Bad Request."""
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/voice/transcribe",
        files={"audio": ("empty.webm", empty_file, "audio/webm")},
        data={"language": "hi"}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_transcribe_oversized_audio_rejected():
    """Test oversized audio file returns 413 Payload Too Large."""
    huge_bytes = b"0" * (11 * 1024 * 1024)  # 11 MB > 10 MB limit
    huge_file = io.BytesIO(huge_bytes)
    response = client.post(
        "/api/voice/transcribe",
        files={"audio": ("huge.wav", huge_file, "audio/wav")},
        data={"language": "en"}
    )
    assert response.status_code == 413
    assert "exceeds" in response.json()["detail"].lower()


def test_voice_chat_multilingual_telugu():
    """Test full voice chat pipeline in Telugu."""
    audio_file = io.BytesIO(SAMPLE_WEBM_BYTES)
    response = client.post(
        "/api/voice/chat",
        files={"audio": ("voice.webm", audio_file, "audio/webm")},
        data={"language": "te", "farmer_id": "1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "transcript" in data
    assert "response" in data
    assert len(data["response"]) > 0
    assert data["language"] == "te"
    assert "audio" in data
    assert data["audio"]["available"] is True
    assert data["audio"]["url"].startswith("/api/voice/audio/")
    assert data["conversation_id"] is not None


def test_voice_chat_multilingual_hindi():
    """Test full voice chat pipeline in Hindi."""
    audio_file = io.BytesIO(SAMPLE_WEBM_BYTES)
    response = client.post(
        "/api/voice/chat",
        files={"audio": ("voice_hi.webm", audio_file, "audio/webm")},
        data={"language": "hi", "farmer_id": "1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "hi"
    assert data["audio"]["available"] is True


def test_voice_chat_multilingual_marathi():
    """Test full voice chat pipeline in Marathi."""
    audio_file = io.BytesIO(SAMPLE_WEBM_BYTES)
    response = client.post(
        "/api/voice/chat",
        files={"audio": ("voice_mr.webm", audio_file, "audio/webm")},
        data={"language": "mr", "farmer_id": "1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "mr"
    assert data["audio"]["available"] is True


from PIL import Image

def create_dummy_image_bytes(format="JPEG", size=(100, 100), color="green"):
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()


def test_voice_chat_with_image_attachment():
    """Test multimodal Voice + Crop Image Analysis in single request."""
    dummy_jpeg = create_dummy_image_bytes(format="JPEG")
    audio_file = io.BytesIO(SAMPLE_WEBM_BYTES)
    image_file = io.BytesIO(dummy_jpeg)

    response = client.post(
        "/api/voice/chat",
        files={
            "audio": ("voice_q.webm", audio_file, "audio/webm"),
            "image": ("leaf_spot.jpg", image_file, "image/jpeg"),
        },
        data={"language": "en", "farmer_id": "1"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "transcript" in data
    assert "response" in data
    assert data["audio"]["available"] is True


def test_text_to_speech_direct_endpoint():
    """Test standalone TTS generation endpoint."""
    response = client.post(
        "/api/voice/tts",
        json={
            "text": "Your tomato crop in Nashik shows high profit realization today at ₹32 per kg.",
            "language": "en",
            "speed": "normal"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is True
    assert data["url"] is not None
    assert data["mime_type"] == "audio/mpeg"

    # Test audio retrieval
    audio_id = data["url"].split("/")[-1]
    audio_res = client.get(f"/api/voice/audio/{audio_id}")
    assert audio_res.status_code == 200
    assert audio_res.headers["content-type"] == "audio/mpeg"


def test_tts_empty_text_rejected():
    """Test empty text for TTS returns 400 Bad Request."""
    response = client.post(
        "/api/voice/tts",
        json={"text": "   ", "language": "en"}
    )
    assert response.status_code == 400


def test_audio_streaming_not_found():
    """Test invalid audio_id returns 404."""
    response = client.get("/api/voice/audio/non_existent_audio_9999")
    assert response.status_code == 404
