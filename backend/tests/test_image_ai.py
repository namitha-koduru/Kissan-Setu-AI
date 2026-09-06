import sys
import os
import io
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai.vision_service import vision_service
from app.services.cloudinary_service import cloudinary_service

client = TestClient(app)


def create_dummy_image_bytes(format="JPEG", size=(200, 200), color="green"):
    """Generate in-memory image bytes for test uploads."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()


def test_image_upload_success():
    """Verify valid image upload saves metadata and returns a valid record."""
    img_bytes = create_dummy_image_bytes(format="JPEG")
    files = {"image": ("test_leaf.jpg", img_bytes, "image/jpeg")}
    data = {"farmer_id": "1", "crop_id": "1"}

    response = client.post("/api/images/upload", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert "id" in res_data
    assert "image_url" in res_data
    assert res_data["farmer_id"] == 1
    assert res_data["crop_id"] == 1
    assert res_data["mime_type"] == "image/jpeg"
    assert res_data["width"] == 200
    assert res_data["height"] == 200


def test_image_upload_reject_invalid_mime():
    """Verify non-image files are rejected with 400 Bad Request."""
    fake_txt_bytes = b"This is just a text file masquerading as an image."
    files = {"image": ("test_document.txt", fake_txt_bytes, "text/plain")}

    response = client.post("/api/images/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported image format" in response.json()["detail"]


def test_image_upload_reject_corrupted_image():
    """Verify corrupted image bytes are rejected gracefully."""
    corrupted_bytes = b"GIF89a\x00\x00\x00\x00corrupteddata"
    files = {"image": ("broken.jpg", corrupted_bytes, "image/jpeg")}

    response = client.post("/api/images/upload", files=files)
    assert response.status_code == 400


def test_image_get_by_id_and_crop():
    """Verify querying image by ID and listing images by crop ID."""
    img_bytes = create_dummy_image_bytes(format="PNG")
    files = {"image": ("tomato_leaf_test.png", img_bytes, "image/png")}
    data = {"farmer_id": "1", "crop_id": "1"}

    upload_res = client.post("/api/images/upload", files=files, data=data)
    assert upload_res.status_code == 200
    image_id = upload_res.json()["id"]

    # Get by ID
    get_res = client.get(f"/api/images/{image_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == image_id

    # Get list by crop
    crop_res = client.get("/api/images/crop/1")
    assert crop_res.status_code == 200
    assert isinstance(crop_res.json(), list)
    assert any(img["id"] == image_id for img in crop_res.json())


import asyncio


def test_vision_service_inspection():
    """Verify VisionService inspects image and returns structured agronomic fields."""
    img_bytes = create_dummy_image_bytes(format="JPEG")
    result = asyncio.run(vision_service.inspect_image(
        image_bytes=img_bytes,
        mime_type="image/jpeg",
        filename="tomato_yellowing_leaf.jpg",
        crop_hint="Tomato"
    ))

    assert result.detected_crop is not None
    assert isinstance(result.observed_symptoms, list)
    assert isinstance(result.possible_issues, list)
    assert 0.0 <= result.overall_confidence <= 1.0
    assert result.image_quality in ["good", "fair", "poor"]
    assert "visual assessment" in result.disclaimer.lower()


def test_chat_analyze_image_endpoint():
    """Verify the multimodal /api/chat/analyze-image endpoint processes image and returns localized explanation."""
    img_bytes = create_dummy_image_bytes(format="JPEG")
    files = {"image": ("tomato_blight_leaf.jpg", img_bytes, "image/jpeg")}
    data = {
        "message": "What is wrong with these tomato leaf spots?",
        "language": "en",
        "farmer_id": "1",
        "crop_id": "1"
    }

    response = client.post("/api/chat/analyze-image", files=files, data=data)
    assert response.status_code == 200
    data_res = response.json()

    assert "reply" in data_res
    assert len(data_res["reply"]) > 20
    assert "conversation_id" in data_res
    assert "image" in data_res
    assert "analysis" in data_res
    assert data_res["image"]["image_url"] is not None
    assert data_res["analysis"]["confidence"] is not None


def test_chat_analyze_image_multilingual_telugu():
    """Verify Vision AI explanation respects Indian language selector (Telugu)."""
    img_bytes = create_dummy_image_bytes(format="JPEG")
    files = {"image": ("crop_leaf.jpg", img_bytes, "image/jpeg")}
    data = {
        "message": "ఈ ఆకుపై మచ్చలు ఎందుకు వచ్చాయి?",
        "language": "te",
        "farmer_id": "1",
    }

    response = client.post("/api/chat/analyze-image", files=files, data=data)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["language"] == "te"
    assert len(res_json["reply"]) > 10
