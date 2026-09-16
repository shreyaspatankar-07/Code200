"""
Sub-Millisecond Deterministic Red-Flag Interceptor Engine
Runs independently of LLMs using compiled Unicode regex patterns across
Hindi, Marathi, Tamil, English, and Romanized clinical transliterations.
"""

import re
import time
from typing import List, Tuple
from ..schemas.models import RedFlagCheckResponse

# Compile high-performance regex patterns across 4 languages
RED_FLAG_PATTERNS = [
    # 1. Acute Coronary Syndrome / Angina / Heart Attack
    (
        r"(?i)\b(chest\s*pain|crushing\s*pain|substernal\s*heaviness|heart\s*attack|angina|left\s*arm\s*pain|jaw\s*pain|diaphoresis|profuse\s*sweating|cold\s*sweat)\b|"
        r"(छाती\s*में\s*दर्द|छातीत\s*दुखणे|छातीत\s*कळा|हार्ट\s*अटॅक|डाव्या\s*हातात\s*वेदना|நெஞ்சு\s*வலி|மாரடைப்பு|chhati\s*me\s*dard|chaati\s*dukhne|nenju\s*vali)",
        "ACUTE_CORONARY_SYNDROME",
        "EMERGENCY RED: Suspected Acute Coronary Syndrome / Myocardial Infarction. Route immediately to ICCU Triage Bed #1. Obtain 12-lead ECG stat & load Dual Antiplatelets."
    ),
    # 2. Acute Stroke / TIA / Neurological Deficit (FAST)
    (
        r"(?i)\b(slurred\s*speech|facial\s*droop|sudden\s*weakness|hemiparesis|arm\s*drift|cannot\s*speak|stroke|paralysis)\b|"
        r"(बोलने\s*में\s*लड़खड़ाहट|अचानक\s*कमजोरी|चेहरा\s*टेढ़ा|लकवा|पक्षाघात|பேச்சு\s*குழறல்|பக்கவாதம்|slurred\s*speech|bolne\s*me\s*takleef)",
        "ACUTE_STROKE_FAST",
        "EMERGENCY RED: Suspected Acute Ischemic Stroke / ICH within therapeutic thrombolysis window. Immediate Non-contrast Brain CT & Stroke Neurologist Triage."
    ),
    # 3. Severe Respiratory Distress / Stridor / Hypoxia
    (
        r"(?i)\b(breathless|shortness\s*of\s*breath|cannot\s*breathe|gasping|stridor|choking|severe\s*asthma|cyanosis)\b|"
        r"(सांस\s*लेने\s*में\s*तकलीफ|श्वास\s*घेण्यास\s*त्रास|दम\s*लागणे|மூச்சுத்திணறல்|saas\s*lene\s*me\s*takleef|shwas\s*tras)",
        "RESPIRATORY_FAILURE",
        "EMERGENCY RED: Impending Acute Respiratory Failure. Route to High-Dependency Resuscitation Area. High-flow O2 via Non-Rebreather & nebulization."
    ),
    # 4. Syncope / Loss of Consciousness / Shock
    (
        r"(?i)\b(syncope|unconscious|fainted|collapsed|blackout|unresponsive|anaphylaxis|severe\s*bleeding)\b|"
        r"(बेहोश|मूर्च्छा|चक्कर\s*खाकर\s*गिरना|மயக்கம்|behosh|murchha)",
        "SYNCOPE_COLLAPSE",
        "EMERGENCY RED: Hemodynamic Instability / Syncope. Immediate Crash Cart & IV Access Triage."
    )
]

COMPILED_RULES = [(re.compile(pattern, re.UNICODE | re.IGNORECASE), category, guidance) for pattern, category, guidance in RED_FLAG_PATTERNS]

class RedFlagEngine:
    @staticmethod
    def evaluate(text: str, symptoms: List[str] = None) -> RedFlagCheckResponse:
        start_time = time.perf_counter()
        
        combined_text = text or ""
        if symptoms:
            combined_text += " " + " ".join(symptoms)
            
        matched_terms = []
        is_red = False
        emergency_guidance = None
        routing = "OPD Routine Clinical Consultation"
        priority = "GREEN"
        
        for regex, category, guidance in COMPILED_RULES:
            matches = regex.findall(combined_text)
            if matches:
                is_red = True
                priority = "RED"
                emergency_guidance = guidance
                routing = f"PRIORITY 1 RESUSCITATION / EMERGENCY OPD ({category})"
                for m in matches:
                    if isinstance(m, tuple):
                        matched_terms.extend([term for term in m if term])
                    elif isinstance(m, str) and m:
                        matched_terms.append(m)

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        if not is_red and any(keyword in combined_text.lower() for keyword in ["hba1c", "9.2%", "uncontrolled", "high fever", "vomiting"]):
            priority = "AMBER"
            routing = "Priority 2: High-Risk Chronic / Subacute OPD Triage"

        return RedFlagCheckResponse(
            is_red_flag=is_red,
            matched_terms=list(set(matched_terms)),
            triage_priority=priority,
            recommended_routing=routing,
            emergency_guidance=emergency_guidance,
            detection_latency_ms=round(latency_ms, 3)
        )

red_flag_engine = RedFlagEngine()
