"""
Dual Clinical Reasoner & Ontology Cross-Walk Engine
Compliant with Ministry of Ayush NAMASTE Portal, WHO ICD-11 TM2, ICD-10, & SNOMED CT.
Integrates Classical SOCRATES & All India Institute of Ayurveda Dashavidha Pariksha.
"""

from typing import Dict, Any, Optional
from ..schemas.models import (
    SocratesSchema,
    DashavidhaParikshaSchema,
    DualCodingSchema,
    DualCodingConcept
)

# Comprehensive Cross-Walk Knowledge Base
ONTOLOGY_REGISTRY = {
    "hrdshula": {
        "allopathic_icd10": DualCodingConcept(
            system="http://hl7.org/fhir/sid/icd-10",
            code="I20.9",
            display="Angina pectoris, unspecified / Acute Coronary Syndrome"
        ),
        "allopathic_snomed": DualCodingConcept(
            system="http://snomed.info/sct",
            code="22298006",
            display="Myocardial ischaemia (disorder)"
        ),
        "ayush_namaste": DualCodingConcept(
            system="https://namstp.ayush.gov.in",
            code="HKS-3",
            display="NAMASTE: Hrdshula (हृद्शूल) - Traditional Cardiac Pain Syndrome"
        ),
        "ayush_who_icd11_tm2": DualCodingConcept(
            system="http://id.who.int/icd11/mms",
            code="SF51",
            display="WHO ICD-11 TM2: SF51 - Hrdshula / Traditional Cardiac Syndrome"
        )
    },
    "amlapitta": {
        "allopathic_icd10": DualCodingConcept(
            system="http://hl7.org/fhir/sid/icd-10",
            code="K21.9",
            display="Gastro-esophageal reflux disease without esophagitis / Dyspepsia"
        ),
        "allopathic_snomed": DualCodingConcept(
            system="http://snomed.info/sct",
            code="235595009",
            display="Gastroesophageal reflux disease (disorder)"
        ),
        "ayush_namaste": DualCodingConcept(
            system="https://namstp.ayush.gov.in",
            code="AGD-12",
            display="NAMASTE: Amlapitta (अम्लपित्त) - Hyperacidity & Acid Peptic Disorder"
        ),
        "ayush_who_icd11_tm2": DualCodingConcept(
            system="http://id.who.int/icd11/mms",
            code="SA14",
            display="WHO ICD-11 TM2: SA14 - Amlapitta / Traditional Gastric Heat Syndrome"
        )
    },
    "sandhigata_vata": {
        "allopathic_icd10": DualCodingConcept(
            system="http://hl7.org/fhir/sid/icd-10",
            code="M17.9",
            display="Osteoarthritis of knee, unspecified (Gonarthrosis)"
        ),
        "allopathic_snomed": DualCodingConcept(
            system="http://snomed.info/sct",
            code="239873007",
            display="Osteoarthritis of knee (disorder)"
        ),
        "ayush_namaste": DualCodingConcept(
            system="https://namstp.ayush.gov.in",
            code="SRD-4",
            display="NAMASTE: Sandhigata Vata (संधिगत वात) - Osteoarticular Degenerative Vata Disorder"
        ),
        "ayush_who_icd11_tm2": DualCodingConcept(
            system="http://id.who.int/icd11/mms",
            code="SD22",
            display="WHO ICD-11 TM2: SD22 - Sandhigata Vata / Traditional Osteoarticular Vata Syndrome"
        )
    },
    "madhumeha": {
        "allopathic_icd10": DualCodingConcept(
            system="http://hl7.org/fhir/sid/icd-10",
            code="E11.9",
            display="Type 2 diabetes mellitus without complications"
        ),
        "allopathic_snomed": DualCodingConcept(
            system="http://snomed.info/sct",
            code="44054006",
            display="Type 2 diabetes mellitus (disorder)"
        ),
        "ayush_namaste": DualCodingConcept(
            system="https://namstp.ayush.gov.in",
            code="PRM-1",
            display="NAMASTE: Madhumeha (मधुमेह) - Prameha Subtype / Metabolic Glycosuria"
        ),
        "ayush_who_icd11_tm2": DualCodingConcept(
            system="http://id.who.int/icd11/mms",
            code="SM30",
            display="WHO ICD-11 TM2: SM30 - Madhumeha / Traditional Metabolic Glycosuria Syndrome"
        )
    }
}

class ClinicalReasoner:
    @staticmethod
    def classify_intake(
        body_zone: str,
        chief_complaint: str,
        socrates: SocratesSchema,
        ayush: DashavidhaParikshaSchema
    ) -> DualCodingSchema:
        """
        Infers Dual-Coding classification from presenting symptoms and Dashavidha parameters.
        """
        text = (chief_complaint + " " + socrates.site + " " + socrates.character + " " + (ayush.notes or "")).lower()

        if any(w in text for w in ["chest", "hrdshula", "arm", "angina", "coronary", "substernal", "diaphoresis"]):
            key = "hrdshula"
        elif any(w in text for w in ["acid", "amlapitta", "epigastric", "burning", "belching", "gerd", "reflux"]):
            key = "amlapitta"
        elif any(w in text for w in ["knee", "joint", "sandhigata", "crepitus", "stiffness", "osteoarthritis"]):
            key = "sandhigata_vata"
        elif any(w in text for w in ["diabetes", "sugar", "madhumeha", "hba1c", "prameha"]):
            key = "madhumeha"
        else:
            key = "amlapitta"  # Default fallback

        entry = ONTOLOGY_REGISTRY[key]
        return DualCodingSchema(
            allopathic_icd10=entry["allopathic_icd10"],
            allopathic_snomed=entry["allopathic_snomed"],
            ayush_namaste=entry["ayush_namaste"],
            ayush_who_icd11_tm2=entry["ayush_who_icd11_tm2"]
        )

clinical_reasoner = ClinicalReasoner()
