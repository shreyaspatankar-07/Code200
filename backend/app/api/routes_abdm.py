"""
ABDM & HL7 FHIR R4 Bundle Routes: /api/abdm/m1-verify, /api/abdm/fhir-bundle
Handles NHA ABDM Milestone validations and FHIR Document Bundle serialization.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..schemas.models import PatientIntake
from ..core.fhir_compiler import fhir_compiler
from .routes_intake import PATIENT_STORE

router = APIRouter(prefix="/abdm", tags=["NHA ABDM Gateway"])

@router.post("/m1-verify")
async def verify_abha_m1(abha_id: str):
    """
    Simulates ABDM Milestone 1 (M1) ABHA Address verification and OTP authentication.
    """
    return {
        "status": "VERIFIED",
        "abha_id": abha_id,
        "auth_mode": "DEMO_OTP_SUCCESS",
        "redacted_aadhaar": "•••• •••• 8492",
        "nha_gateway_response": "ABHA verification successful under NHA M1 specification."
    }

@router.post("/fhir-bundle")
async def generate_fhir_bundle(patient: PatientIntake):
    """
    Compiles and returns a validated HL7 FHIR R4 Document Bundle.
    """
    bundle = fhir_compiler.compile_bundle(patient)
    return bundle
