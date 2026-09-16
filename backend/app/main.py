"""
MediKiosk FastAPI Main Application
Smart India Hackathon 2026 - Problem Statement 26047
Ministry of Ayush / All India Institute of Ayurveda (AIIA)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.routes_intake import router as intake_router, PATIENT_STORE
from .api.routes_doctor import router as doctor_router
from .api.routes_ocr import router as ocr_router
from .api.routes_abdm import router as abdm_router
from .api.routes_voice import router as voice_router
from .core.websocket_manager import ws_manager
from .schemas.models import (
    PatientIntake,
    VitalsSchema,
    SocratesSchema,
    DashavidhaParikshaSchema,
    PrakritiVikritiDistribution,
    OcrToken,
    BoundingBox
)
from .core.clinical_reasoner import clinical_reasoner
from .core.ocr_engine import ocr_engine

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Autonomous First-Mile Multimodal Clinical Intake & ABDM/AYUSH Dual-Coding Gateway API"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(intake_router, prefix=settings.API_PREFIX)
app.include_router(doctor_router, prefix=settings.API_PREFIX)
app.include_router(ocr_router, prefix=settings.API_PREFIX)
app.include_router(abdm_router, prefix=settings.API_PREFIX)
app.include_router(voice_router, prefix=settings.API_PREFIX)

# Seed initial representative patient records into in-memory store
@app.on_event("startup")
async def startup_event():
    # 1. Scenario A: Acute Emergency Red-Flag
    scen_a = PatientIntake(
        abha_id="rameshwar.verma@abdm",
        token="OPD-2026-EM01",
        name="Rameshwar Prasad Verma",
        age=62,
        gender="Male",
        language="hi",
        redacted_aadhaar="•••• •••• 8492",
        vitals=VitalsSchema(bp="168/104 mmHg", hr="108 bpm", spo2="93%", temp="98.4 °F", rr="24 /min"),
        body_zone="chest",
        chief_complaint="Severe substernal crushing chest pain radiating to left arm with cold diaphoresis and breathlessness since 45 minutes.",
        voice_transcript="छाती में बहुत तेज दर्द हो रहा है, ऐसा लग रहा है भारी पत्थर रखा है। दर्द बाएं हाथ तक जा रहा है।",
        socrates=SocratesSchema(
            site="Substernal, retrosternal central chest",
            onset="Sudden, acute onset 45 mins ago",
            character="Crushing, heavy pressure (elephant on chest)",
            radiation="Radiating to left shoulder, inner arm & jaw",
            associations="Diaphoresis, Nausea, Acute Dyspnea",
            timing="Continuous, worsening with exertion",
            exacerbating="Exertion worsens; sublingual rest gives no relief",
            severity=9
        ),
        ayush_pariksha=DashavidhaParikshaSchema(
            agni="Vishama (Irregular/Vata perturbed)",
            koshtha="Krura (Constipated)",
            ahara_vihara="High mental stress (Chinta), irregular meal timings",
            prakriti_vikriti=PrakritiVikritiDistribution(vata=65, pitta=25, kapha=10),
            dominant_dosha="Vata-Pitta Prana Vayu & Vyana Vayu Dusti",
            notes="Hrdshula / Urashula with Vata-Kaphaja Srotorodha in Hridaya Srotas."
        ),
        priority="RED"
    )
    scen_a.dual_coding = clinical_reasoner.classify_intake(scen_a.body_zone, scen_a.chief_complaint, scen_a.socrates, scen_a.ayush_pariksha)
    PATIENT_STORE[scen_a.token] = scen_a

    # 2. Scenario B: Chronic Care + OCR Verifier
    scen_b_tokens = [
        OcrToken(id=1, text="Tab Metformin 500mg BD", confidence=0.95, verified=True, raw_crop_base64=ocr_engine.create_synthetic_crop("Tab Metformin 500mg BD")),
        OcrToken(id=2, text="Tab Telmisartan 40mg OD", confidence=0.91, verified=True, raw_crop_base64=ocr_engine.create_synthetic_crop("Tab Telmisartan 40mg OD")),
        OcrToken(id=3, text="Ashwagandha Churna 3g BD", confidence=0.74, verified=False, raw_crop_base64=ocr_engine.create_synthetic_crop("Ashwagandha Churna 3g BD")),
        OcrToken(id=4, text="Shankha Vati 2 tab BD", confidence=0.68, verified=False, raw_crop_base64=ocr_engine.create_synthetic_crop("Shankha Vati 2 tab BD pc"))
    ]
    scen_b = PatientIntake(
        abha_id="priya.sharma@abdm",
        token="OPD-2026-A104",
        name="Priya Sundaram Sharma",
        age=48,
        gender="Female",
        language="en",
        redacted_aadhaar="•••• •••• 5129",
        vitals=VitalsSchema(bp="138/86 mmHg", hr="76 bpm", spo2="98%", temp="98.6 °F", rr="16 /min"),
        body_zone="abdomen",
        chief_complaint="Burning epigastric pain with sour acid belching and uncontrolled blood sugar for 3 months.",
        voice_transcript="Having severe burning in upper stomach after meals with sour taste in mouth, sugar levels remain high.",
        socrates=SocratesSchema(
            site="Epigastric and retrosternal burning (Hrit-Kantha Daha)",
            onset="Gradual onset over 3 months",
            character="Intense burning (Daha), acid regurgitation (Tikta-Amla Udgara)",
            radiation="Radiating upward to throat",
            associations="Postprandial fullness, nausea, fatigue",
            timing="Worse 1-2 hours after meals",
            exacerbating="Spicy foods, coffee, ratri jagarana",
            severity=6
        ),
        ayush_pariksha=DashavidhaParikshaSchema(
            agni="Tikshnagni (Hyper-metabolic / Acidic fire)",
            koshtha="Madhyama with occasional Vidbandha",
            ahara_vihara="Frequent spicy snacks, irregular meal gaps, late sleep",
            prakriti_vikriti=PrakritiVikritiDistribution(vata=20, pitta=60, kapha=20),
            dominant_dosha="Pitta Pradhana Amlapitta (Urdhwaga)",
            notes="Amlapitta with Pitta-Kapha avarana; Madhumeha (T2DM) metabolic sluggishness."
        ),
        ocr_tokens=scen_b_tokens,
        priority="AMBER"
    )
    scen_b.dual_coding = clinical_reasoner.classify_intake(scen_b.body_zone, scen_b.chief_complaint, scen_b.socrates, scen_b.ayush_pariksha)
    PATIENT_STORE[scen_b.token] = scen_b

    # 3. Scenario C: Low-Literacy Regional
    scen_c = PatientIntake(
        abha_id="sita.devi@abdm",
        token="OPD-2026-R302",
        name="Sita Devi Mahato",
        age=58,
        gender="Female",
        language="hi",
        redacted_aadhaar="•••• •••• 9923",
        vitals=VitalsSchema(bp="124/80 mmHg", hr="72 bpm", spo2="99%", temp="98.2 °F", rr="16 /min"),
        body_zone="joints",
        chief_complaint="Bilateral knee pain with severe morning stiffness and clicking sounds while walking for 6 months.",
        voice_transcript="दोनों घुटनों में बहुत दर्द रहता है, सुबह उठने पर पैर अकड़ जाते हैं।",
        socrates=SocratesSchema(
            site="Bilateral Knee joints (Janu Sandhi), worse on right side",
            onset="Insidious, gradual onset over 6-8 months",
            character="Deep aching pain with stiffness and crepitus (Sandhi Sphutana)",
            radiation="Localized to knees and proximal calves",
            associations="Morning stiffness lasting ~45 mins, mild swelling",
            timing="Aggravated in early morning, cold weather",
            exacerbating="Stairs, sitting cross-legged; relieved by warm oil massage (Abhyanga)",
            severity=5
        ),
        ayush_pariksha=DashavidhaParikshaSchema(
            agni="Mandagni / Vishamagni (Sluggish metabolic fire)",
            koshtha="Krura Koshtha (Mild constipation)",
            ahara_vihara="Excess dry (Ruksha) and cold food, heavy household labor",
            prakriti_vikriti=PrakritiVikritiDistribution(vata=70, pitta=15, kapha=15),
            dominant_dosha="Vata Pradhana Sandhigata Vata (Dhatukshaya Janya)",
            notes="Degenerative articular changes with Vata accumulation in Asthi-Sandhi."
        ),
        priority="GREEN"
    )
    scen_c.dual_coding = clinical_reasoner.classify_intake(scen_c.body_zone, scen_c.chief_complaint, scen_c.socrates, scen_c.ayush_pariksha)
    PATIENT_STORE[scen_c.token] = scen_c

# Health Check Endpoint
@app.get("/")
async def root():
    return {
        "status": "ONLINE",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "abdm_sandbox": "CONNECTED",
        "namaste_portal": "SYNCED",
        "websocket_endpoint": "/ws/doctor"
    }

# Real-Time WebSocket Endpoint for Doctor OPD Console
@app.websocket("/ws/doctor")
async def websocket_doctor_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming commands from doctor console if any
            if data == "ping":
                await websocket.send_text('{"type": "PONG"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        ws_manager.disconnect(websocket)
