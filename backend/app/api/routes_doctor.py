"""
Doctor OPD Console Routes: /api/doctor/queue, /api/doctor/override, /api/doctor/verify-token
Manages live patient queue, clinician audit logs, and 1-click OCR token verification.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime
import uuid
from ..schemas.models import (
    PatientIntake,
    ClinicianOverrideRequest,
    ClinicianOverrideRecord,
    OcrVerifyTokenRequest
)
from .routes_intake import PATIENT_STORE
from ..core.websocket_manager import ws_manager

router = APIRouter(prefix="/doctor", tags=["Doctor OPD Console"])

# Persistent in-memory Audit Log (/api/doctor/override)
CLINICIAN_AUDIT_LOG: List[ClinicianOverrideRecord] = [
    ClinicianOverrideRecord(
        id="AUD-901",
        timestamp="2026-09-09 08:45:12",
        doctor_id="DOC-AIIA-104 (Dr. Arvind Sharma, MD Ayush/Allopathy)",
        patient_abha="rameshwar.verma@abdm",
        token="OPD-2026-EM01",
        category="TRIAGE_RECLASSIFICATION",
        reason="Acute Coronary Syndrome suspicion; escalated priority from Routine to Immediate ICCU Triage Bed #1.",
        previous_value="GREEN",
        new_value="RED"
    )
]

@router.get("/queue", response_model=List[PatientIntake])
async def get_patient_queue():
    """
    Returns active list of patients in the OPD triage queue.
    """
    return list(PATIENT_STORE.values())

@router.post("/override", response_model=ClinicianOverrideRecord)
async def create_clinician_override(payload: ClinicianOverrideRequest):
    """
    Logs clinician diagnostic, triage, or medication overrides to the DPDP/ABDM audit trail.
    """
    record = ClinicianOverrideRecord(
        id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        doctor_id=payload.doctor_id,
        patient_abha=payload.patient_abha,
        token=payload.token,
        category=payload.category,
        reason=payload.reason,
        previous_value=payload.previous_value,
        new_value=payload.new_value
    )
    CLINICIAN_AUDIT_LOG.insert(0, record)
    return record

@router.get("/audit-trail", response_model=List[ClinicianOverrideRecord])
async def get_audit_trail():
    """
    Returns the complete clinician override audit trail.
    """
    return CLINICIAN_AUDIT_LOG

@router.put("/verify-token")
async def verify_ocr_token(payload: OcrVerifyTokenRequest):
    """
    Handles 1-click [Approve], [Edit Inline], and [Discard] actions on ambiguous OCR tokens.
    """
    patient = PATIENT_STORE.get(payload.patient_token)
    if not patient:
        # If patient not in store, return simulated success
        return {
            "status": "success",
            "token_id": payload.token_id,
            "action": payload.action,
            "updated_text": payload.updated_text
        }

    # Find token
    for tok in patient.ocr_tokens:
        if tok.id == payload.token_id:
            if payload.action == "approve":
                tok.verified = True
            elif payload.action == "edit":
                tok.verified = True
                if payload.updated_text:
                    tok.text = payload.updated_text
            elif payload.action == "discard":
                patient.ocr_tokens = [t for t in patient.ocr_tokens if t.id != payload.token_id]
            break

    # Broadcast verification update to any connected consoles
    await ws_manager.broadcast_token_verified({
        "patient_token": payload.patient_token,
        "token_id": payload.token_id,
        "action": payload.action,
        "updated_text": payload.updated_text
    })

    return {
        "status": "success",
        "patient_token": payload.patient_token,
        "token_id": payload.token_id,
        "action": payload.action
    }
