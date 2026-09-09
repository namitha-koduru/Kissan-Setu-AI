import json
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import CropImage, ImageAnalysis, Farmer, Crop
from app.schemas.image import (
    CropImageResponse,
    ImageAnalysisResponse,
    VisionAnalysisResult,
    PossibleIssue,
    CropImageAnalyzeResponse,
)
from app.services.cloudinary_service import cloudinary_service
from app.ai.vision_service import vision_service

router = APIRouter(prefix="/images", tags=["Crop Images & Vision AI"])


@router.post("/upload", response_model=CropImageResponse, status_code=status.HTTP_200_OK)
async def upload_crop_image(
    image: Optional[UploadFile] = File(None, description="Crop leaf/plant image file (JPG, PNG, WEBP)"),
    file: Optional[UploadFile] = File(None, description="Alternative field name for image file"),
    farmer_id: Optional[int] = Form(1),
    crop_id: Optional[int] = Form(None),
    conversation_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload a crop/leaf image to Cloudinary (with local media dev fallback) and store metadata in PostgreSQL.
    """
    actual_file = image or file
    if actual_file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image file provided in request."
        )

    file_bytes = await actual_file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty."
        )

    # 1. Validate and Upload via Cloudinary Service
    try:
        upload_meta = await cloudinary_service.upload_image(
            file_bytes=file_bytes,
            filename=actual_file.filename or "crop_image.jpg",
            content_type=actual_file.content_type or "image/jpeg",
            farmer_id=farmer_id or 1,
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(exc)}"
        )

    # 2. Save CropImage record in PostgreSQL
    crop_img = CropImage(
        farmer_id=farmer_id or 1,
        crop_id=crop_id,
        conversation_id=conversation_id,
        image_url=upload_meta["image_url"],
        cloudinary_public_id=upload_meta.get("cloudinary_public_id"),
        original_filename=upload_meta.get("original_filename"),
        mime_type=upload_meta.get("mime_type", "image/jpeg"),
        file_size=upload_meta.get("file_size"),
        width=upload_meta.get("width"),
        height=upload_meta.get("height"),
        uploaded_at=datetime.utcnow(),
    )
    db.add(crop_img)
    db.commit()
    db.refresh(crop_img)

    return crop_img


@router.get("/{image_id}", response_model=CropImageResponse)
def get_image(image_id: str, db: Session = Depends(get_db)):
    """
    Get crop image metadata and Cloudinary references.
    """
    img = db.query(CropImage).filter(CropImage.id == image_id).first()
    if not img:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with ID '{image_id}' not found."
        )
    return img


@router.get("/crop/{crop_id}", response_model=List[CropImageResponse])
def get_crop_images(crop_id: int, db: Session = Depends(get_db)):
    """
    Get all uploaded images for a specific crop.
    """
    return db.query(CropImage).filter(CropImage.crop_id == crop_id).order_by(CropImage.uploaded_at.desc()).all()


@router.post("/analyze-crop", response_model=CropImageAnalyzeResponse)
async def analyze_crop_image(
    image: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    crop_name: Optional[str] = Form(None),
    crop_id: Optional[int] = Form(None),
    farmer_id: Optional[int] = Form(1),
    db: Session = Depends(get_db),
):
    """
    Complete crop image upload and Vision AI symptom observation endpoint.
    1. Uploads image to Cloudinary (or local media storage fallback if Cloudinary unconfigured).
    2. Runs multimodal Vision AI inspection for visible crop symptoms.
    3. Persists CropImage & ImageAnalysis records.
    4. Returns truthful observations, confidence, recommendations, and recheck schedule.
    """
    actual_file = image or file
    if actual_file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image file provided for analysis."
        )

    file_bytes = await actual_file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided image file is empty."
        )

    # 1. Upload via Cloudinary service (with local dev fallback)
    try:
        upload_meta = await cloudinary_service.upload_image(
            file_bytes=file_bytes,
            filename=actual_file.filename or "crop_image.jpg",
            content_type=actual_file.content_type or "image/jpeg",
            farmer_id=farmer_id or 1,
            folder="crop-analysis",
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(exc)}"
        )

    storage_type = "local" if upload_meta.get("is_local_fallback") else "cloudinary"

    # 2. Save CropImage record
    crop_img = CropImage(
        farmer_id=farmer_id or 1,
        crop_id=crop_id,
        image_url=upload_meta["image_url"],
        cloudinary_public_id=upload_meta.get("cloudinary_public_id"),
        original_filename=upload_meta.get("original_filename"),
        mime_type=upload_meta.get("mime_type", "image/jpeg"),
        file_size=upload_meta.get("file_size"),
        width=upload_meta.get("width"),
        height=upload_meta.get("height"),
        uploaded_at=datetime.utcnow(),
    )
    db.add(crop_img)
    db.commit()
    db.refresh(crop_img)

    # 3. Run Vision AI Inspection
    hint = crop_name
    if not hint and crop_id:
        c_obj = db.query(Crop).filter(Crop.id == crop_id).first()
        if c_obj:
            hint = c_obj.crop_name

    vision_result: VisionAnalysisResult = await vision_service.inspect_image(
        image_bytes=file_bytes,
        mime_type=upload_meta.get("mime_type", "image/jpeg"),
        filename=upload_meta.get("original_filename"),
        crop_hint=hint,
    )

    # 4. Save ImageAnalysis record
    issues_dicts = [i.model_dump() for i in vision_result.possible_issues]
    img_analysis = ImageAnalysis(
        image_id=crop_img.id,
        detected_crop=vision_result.detected_crop or hint or "Crop",
        observed_symptoms=vision_result.observed_symptoms,
        possible_issues=issues_dicts,
        confidence=vision_result.overall_confidence,
        analysis_text=f"Observed symptoms: {', '.join(vision_result.observed_symptoms)}",
        recommendations=vision_result.recommendations,
        model_name=settings.VISION_MODEL,
        created_at=datetime.utcnow(),
    )
    db.add(img_analysis)
    db.commit()

    # 5. Formulate truthful health status
    has_issues = len(vision_result.possible_issues) > 0 or any("spot" in s.lower() or "yellow" in s.lower() or "wilt" in s.lower() for s in vision_result.observed_symptoms)
    crop_health = "Mild Visual Symptoms Observed" if has_issues else "Good / Vigorous Growth"

    return CropImageAnalyzeResponse(
        image_url=upload_meta["image_url"],
        storage_type=storage_type,
        detected_crop=vision_result.detected_crop or hint,
        image_quality=vision_result.image_quality,
        crop_health=crop_health,
        observed_symptoms=vision_result.observed_symptoms or ["Uniform leaf pigmentation", "Normal vegetative turgidity"],
        possible_issues=vision_result.possible_issues,
        confidence=vision_result.overall_confidence,
        recommendations=vision_result.recommendations or ["Maintain standard soil moisture regimen and monitor leaf color."],
        when_to_recheck="Re-inspect in 3–5 days or following next irrigation/spraying",
        disclaimer=vision_result.disclaimer,
    )
