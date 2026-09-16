"""
Document Scanner & OCR Processing Route: /api/ocr/process-upload
Handles uploaded prescriptions/lab reports (JPEG/PNG/PDF), runs token extraction,
and returns side-by-side Base64 thumbnail crops for tokens with confidence < 0.85.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from ..schemas.models import OcrProcessResponse
from ..core.ocr_engine import ocr_engine

router = APIRouter(prefix="/ocr", tags=["Document OCR & Crop Verifier"])

@router.post("/process-upload", response_model=OcrProcessResponse)
async def process_document_upload(
    file: Optional[UploadFile] = File(None),
    doc_type: str = Form("prescription"),
    preset_sample: Optional[str] = Form(None)
):
    """
    Processes real uploaded image or preset sample, generating token-level bounding boxes and
    Base64 crops for human-in-the-loop doctor verification.
    """
    image_bytes = b""
    if file:
        image_bytes = await file.read()
    else:
        # Generate representative sample bytes
        image_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"

    selected_type = preset_sample if preset_sample else doc_type
    response = ocr_engine.process_image(image_bytes, doc_type=selected_type)
    return response
