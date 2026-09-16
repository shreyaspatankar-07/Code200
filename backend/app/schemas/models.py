"""
Pydantic v2 Models for MediKiosk
Handles Clinical Intake, SOCRATES, Dashavidha Pariksha, OCR Verification,
Clinician Overrides, and HL7 FHIR R4 Bundle Models.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class VitalsSchema(BaseModel):
    bp: str = Field(default="120/80 mmHg", description="Blood Pressure")
    hr: str = Field(default="72 bpm", description="Heart Rate")
    spo2: str = Field(default="98%", description="Blood Oxygen Saturation")
    temp: str = Field(default="98.6 °F", description="Body Temperature")
    rr: str = Field(default="16 /min", description="Respiratory Rate")

class SocratesSchema(BaseModel):
    site: str = Field(default="Retrosternal / Epigastric", description="Site of pain")
    onset: str = Field(default="Sudden / Gradual", description="Onset timing")
    character: str = Field(default="Crushing / Burning / Throbbing", description="Character of sensation")
    radiation: str = Field(default="None / Left arm / Jaw", description="Radiation path")
    associations: str = Field(default="Diaphoresis, Dyspnea, Nausea", description="Associated symptoms")
    timing: str = Field(default="Continuous / Postprandial", description="Timing and duration")
    exacerbating: str = Field(default="Exertion / Spicy foods", description="Exacerbating or relieving factors")
    severity: int = Field(default=5, ge=1, le=10, description="Pain severity scale (1-10)")

class PrakritiVikritiDistribution(BaseModel):
    vata: int = Field(default=33, ge=0, le=100)
    pitta: int = Field(default=33, ge=0, le=100)
    kapha: int = Field(default=34, ge=0, le=100)

class DashavidhaParikshaSchema(BaseModel):
    agni: str = Field(default="Samagni", description="Digestive fire: Tikshna/Manda/Vishama/Sama")
    koshtha: str = Field(default="Madhyama", description="Bowel habit: Krura/Mrudu/Madhyama")
    ahara_vihara: str = Field(default="Regular diet", description="Dietary and lifestyle patterns")
    prakriti_vikriti: PrakritiVikritiDistribution = Field(default_factory=PrakritiVikritiDistribution)
    dominant_dosha: str = Field(default="Sama Dosha", description="Evaluated dominant dosha imbalance")
    notes: Optional[str] = Field(default=None, description="Ayurvedic clinical observations")

class DualCodingConcept(BaseModel):
    system: str
    code: str
    display: str

class DualCodingSchema(BaseModel):
    allopathic_icd10: DualCodingConcept
    allopathic_snomed: Optional[DualCodingConcept] = None
    ayush_namaste: DualCodingConcept
    ayush_who_icd11_tm2: DualCodingConcept

class BoundingBox(BaseModel):
    x: int
    y: int
    w: int
    h: int

class OcrToken(BaseModel):
    id: int
    text: str
    field_type: str = "Medication"
    confidence: float = Field(ge=0.0, le=1.0)
    verified: bool = False
    original_extracted: Optional[str] = None
    raw_crop_base64: Optional[str] = None
    bounding_box: Optional[BoundingBox] = None
    is_abnormal: Optional[bool] = False

class OcrProcessResponse(BaseModel):
    document_type: str
    document_title: str
    tokens: List[OcrToken]
    overall_confidence: float
    low_confidence_count: int
    processing_time_ms: float

class OcrVerifyTokenRequest(BaseModel):
    patient_token: str
    token_id: int
    action: str = Field(description="'approve' | 'edit' | 'discard'")
    updated_text: Optional[str] = None

class ClinicianOverrideRequest(BaseModel):
    doctor_id: str
    patient_abha: str
    token: str
    category: str = Field(description="DIAGNOSIS_MODIFICATION, TRIAGE_RECLASSIFICATION, MEDICATION_RECONCILIATION, AYUSH_DOSHA_REVALUATION")
    reason: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None

class ClinicianOverrideRecord(BaseModel):
    id: str
    timestamp: str
    doctor_id: str
    patient_abha: str
    token: str
    category: str
    reason: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None

class RedFlagCheckRequest(BaseModel):
    text: str
    body_zone: Optional[str] = "chest"
    symptoms: Optional[List[str]] = []

class RedFlagCheckResponse(BaseModel):
    is_red_flag: bool
    matched_terms: List[str]
    triage_priority: str = "GREEN"  # RED, AMBER, GREEN
    recommended_routing: str
    emergency_guidance: Optional[str] = None
    detection_latency_ms: float

class PatientIntake(BaseModel):
    abha_id: str = "patient@abdm"
    token: str = "OPD-2026-A104"
    name: str = "Priya Sundaram Sharma"
    age: int = 48
    gender: str = "Female"
    language: str = "en"
    redacted_aadhaar: str = "•••• •••• 8492"
    vitals: VitalsSchema = Field(default_factory=VitalsSchema)
    body_zone: str = "abdomen"
    chief_complaint: str = "Burning epigastric pain"
    voice_transcript: Optional[str] = ""
    socrates: SocratesSchema = Field(default_factory=SocratesSchema)
    ayush_pariksha: DashavidhaParikshaSchema = Field(default_factory=DashavidhaParikshaSchema)
    dual_coding: Optional[DualCodingSchema] = None
    ocr_tokens: List[OcrToken] = []
    priority: str = "AMBER"
    dpdp_consent_granted: bool = True
    submitted_at: Optional[str] = None

class IntakeSubmitResponse(BaseModel):
    success: bool
    token: str
    queue_id: str
    priority: str
    red_flag_triggered: bool
    fhir_bundle_id: str
    message: str

class VoiceTranscribeRequest(BaseModel):
    language: str = "hi"
    audio_base64: Optional[str] = None
    sample_phrase: Optional[str] = None

class VoiceTranscribeResponse(BaseModel):
    transcript: str
    detected_language: str
    confidence: float
    noise_reduction_applied: bool
    red_flag_match: Optional[RedFlagCheckResponse] = None
