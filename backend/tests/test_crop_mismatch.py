import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai.vision_service import normalize_crop_name, check_crop_match, vision_service

client = TestClient(app)

# Standard JPEG byte header for dummy image creation
JPEG_HEADER = bytes.fromhex("ffd8ffe000104a46494600010101006000600000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e272022231c1c28372c30313434341f27393d38323c2e333432ffc0000b08000a000a01011100ffda0008010100003f00bf00ffd9") * 10


def test_normalize_crop_name():
    """Verify alias normalization across localized and hybrid crop names."""
    assert normalize_crop_name("Cotton") == "cotton"
    assert normalize_crop_name("Bt Cotton RCH-2") == "cotton"
    assert normalize_crop_name("Kapas") == "cotton"
    assert normalize_crop_name("Potato") == "potato"
    assert normalize_crop_name("Aloo") == "potato"
    assert normalize_crop_name("Solanum tuberosum") == "potato"
    assert normalize_crop_name("Tomato") == "tomato"
    assert normalize_crop_name("Tamatar") == "tomato"


def test_check_crop_match_direct():
    """Verify check_crop_match helper directly."""
    # 1. Cotton + Cotton -> Match
    is_mismatch, crop_match, msg = check_crop_match("Cotton", "Cotton")
    assert is_mismatch is False
    assert crop_match is True
    assert msg is None

    # 2. Potato + Potato -> Match
    is_mismatch, crop_match, msg = check_crop_match("Potato", "Potato")
    assert is_mismatch is False
    assert crop_match is True
    assert msg is None

    # 3. Potato + Cotton -> Mismatch
    is_mismatch, crop_match, msg = check_crop_match("Potato", "Cotton")
    assert is_mismatch is True
    assert crop_match is False
    assert "You selected Cotton, but the uploaded image appears to show Potato." in msg

    # 4. Generic/Unknown -> Not a false mismatch
    is_mismatch, crop_match, msg = check_crop_match("Cultivated Crop", "Cotton")
    assert is_mismatch is False
    assert crop_match is None


def test_api_cotton_image_with_cotton_hint():
    """Test 1: Cotton image + Cotton hint -> Valid match via /api/images/analyze."""
    files = {"image": ("cotton_leaf.jpg", JPEG_HEADER, "image/jpeg")}
    data = {"farmer_id": "1", "crop_hint": "Cotton"}

    response = client.post("/api/images/analyze", data=data, files=files)
    assert response.status_code == 200
    res = response.json()
    assert res["is_mismatch"] is False
    assert res["crop_match"] is True
    assert res["detected_crop"].lower() == "cotton"
    assert res["selected_crop"] == "Cotton"


def test_api_potato_image_with_potato_hint():
    """Test 2: Potato image + Potato hint -> Valid match via /api/images/analyze."""
    files = {"image": ("potato_field.jpg", JPEG_HEADER, "image/jpeg")}
    data = {"farmer_id": "1", "crop_hint": "Potato"}

    response = client.post("/api/images/analyze", data=data, files=files)
    assert response.status_code == 200
    res = response.json()
    assert res["is_mismatch"] is False
    assert res["crop_match"] is True
    assert res["detected_crop"].lower() == "potato"
    assert res["selected_crop"] == "Potato"


def test_api_potato_image_with_cotton_hint_mismatch():
    """Test 3: Potato image + Cotton hint -> Mismatch detected and flagged."""
    files = {"image": ("potato_leaf.jpg", JPEG_HEADER, "image/jpeg")}
    data = {"farmer_id": "1", "crop_hint": "Cotton"}

    response = client.post("/api/images/analyze", data=data, files=files)
    assert response.status_code == 200
    res = response.json()
    assert res["is_mismatch"] is True
    assert res["crop_match"] is False
    assert res["detected_crop"] == "Potato"
    assert res["selected_crop"] == "Cotton"
    assert "You selected Cotton, but the uploaded image appears to show Potato." in res["mismatch_message"]


def test_api_unknown_low_confidence_crop():
    """Test 4: Unknown/low-confidence crop does not falsely reject."""
    files = {"image": ("leaf_snapshot.jpg", JPEG_HEADER, "image/jpeg")}
    data = {"farmer_id": "1", "crop_hint": "Wheat"}

    response = client.post("/api/images/analyze", data=data, files=files)
    assert response.status_code == 200
    res = response.json()
    # If not specifically recognized as a conflicting crop, it should not be marked as a mismatch
    assert res["is_mismatch"] is False
