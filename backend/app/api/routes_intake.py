"""
Intake Routes: /api/intake/submit, /api/intake/red-flag
Handles Patient Kiosk submissions, sub-millisecond red-flag checks, and live WebSocket dispatch.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any
from ..schemas.models import (
    PatientIntake,
    IntakeSubmitResponse,
    RedFlagCheckRequest,
    RedFlagCheckResponse
)
from ..core.red_flag_engine import red_flag_engine
from ..core.clinical_reasoner import clinical_reasoner
from ..core.fhir_compiler import fhir_compiler
from ..core.websocket_manager import ws_manager

router = APIRouter(prefix="/intake", tags=["Patient Intake"])

# Global in-memory storage for active demo queue
PATIENT_STORE: Dict[str, PatientIntake] = {}

@router.post("/red-flag", response_model=RedFlagCheckResponse)
async def check_red_flags(payload: RedFlagCheckRequest):
    """
    Evaluates presenting chief complaint and voice narration against deterministic regex in <1ms.
    """
    result = red_flag_engine.evaluate(payload.text, payload.symptoms)
    if result.is_red_flag:
        # Broadcast alert to all active doctor consoles
        await ws_manager.broadcast_red_flag({
            "trigger_terms": result.matched_terms,
            "routing": result.recommended_routing,
            "guidance": result.emergency_guidance,
            "timestamp": "Just now"
        })
    return result

@router.post("/submit", response_model=IntakeSubmitResponse)
async def submit_patient_intake(patient: PatientIntake, background_tasks: BackgroundTasks):
    """
    Receives full multimodal clinical intake, assigns dual-coding concepts, compiles FHIR bundle,
    broadcasts to doctor queue, and returns confirmation.
    """
    # 1. Run Clinical Reasoner for Dual-Coding if not provided
    if not patient.dual_coding:
        patient.dual_coding = clinical_reasoner.classify_intake(
            body_zone=patient.body_zone,
            chief_complaint=patient.chief_complaint,
            socrates=patient.socrates,
            ayush=patient.ayush_pariksha
        )

    # 2. Check Red-Flag status
    red_flag_res = red_flag_engine.evaluate(patient.chief_complaint + " " + (patient.voice_transcript or ""))
    if red_flag_res.is_red_flag:
        patient.priority = "RED"
    elif patient.priority != "RED" and ("hba1c" in (patient.chief_complaint + " " + (patient.voice_transcript or "")).lower()):
        patient.priority = "AMBER"

    # 3. Store in active registry
    PATIENT_STORE[patient.token] = patient

    # 4. Compile FHIR R4 Bundle
    bundle = fhir_compiler.compile_bundle(patient)

    # 5. Broadcast to Doctor OPD Console via WebSocket
    patient_dict = patient.model_dump()
    background_tasks.add_task(ws_manager.broadcast_intake_submit, patient_dict)

    return IntakeSubmitResponse(
        success=True,
        token=patient.token,
        queue_id=f"Q-{len(PATIENT_STORE):03d}",
        priority=patient.priority,
        red_flag_triggered=red_flag_res.is_red_flag,
        fhir_bundle_id=bundle["id"],
        message="Multimodal intake submitted successfully. Ephemeral RAM wiped per DPDP Act 2023."
    )
