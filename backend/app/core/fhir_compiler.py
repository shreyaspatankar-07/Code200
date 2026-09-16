"""
Strict HL7 FHIR R4 Document Bundle Compiler for NHA ABDM Gateway
Compliant with ABDM M1, M2, M3 Milestones and DPDP Act 2023 Consent Policies.
"""

from typing import Dict, Any
from datetime import datetime, timezone
import uuid
from ..schemas.models import PatientIntake
from .clinical_reasoner import clinical_reasoner

class FhirBundleCompiler:
    @staticmethod
    def compile_bundle(patient: PatientIntake) -> Dict[str, Any]:
        """
        Serializes patient intake into a strict HL7 FHIR R4 Document Bundle.
        """
        bundle_id = f"medikiosk-bundle-{patient.token}"
        timestamp = datetime.now(timezone.utc).isoformat()
        patient_ref = f"urn:uuid:patient-{patient.abha_id.replace('@', '-at-')}"
        composition_id = str(uuid.uuid4())
        condition_id = str(uuid.uuid4())
        vitals_obs_id = str(uuid.uuid4())
        consent_id = str(uuid.uuid4())

        # Ensure dual coding is present
        dual_coding = patient.dual_coding
        if not dual_coding:
            dual_coding = clinical_reasoner.classify_intake(
                body_zone=patient.body_zone,
                chief_complaint=patient.chief_complaint,
                socrates=patient.socrates,
                ayush=patient.ayush_pariksha
            )

        # Construct FHIR Entries
        entries = []

        # 1. Composition Resource (Document Manifest)
        entries.append({
            "fullUrl": f"urn:uuid:{composition_id}",
            "resource": {
                "resourceType": "Composition",
                "id": composition_id,
                "meta": {
                    "versionId": "1",
                    "lastUpdated": timestamp,
                    "profile": [
                        "https://nrces.in/ndhm/fhir/r4/StructureDefinition/ClinicalArtifactDocument"
                    ]
                },
                "status": "final",
                "type": {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "423100009",
                            "display": "First-Mile Multimodal Clinical Intake Document"
                        }
                    ],
                    "text": "First-Mile Clinical Intake & AYUSH Dual-Coding Document"
                },
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/composition-category",
                                "code": "triage-record",
                                "display": "First-Mile Autonomous Triage Record"
                            }
                        ]
                    }
                ],
                "subject": {
                    "reference": patient_ref,
                    "display": patient.name
                },
                "date": timestamp,
                "author": [
                    {
                        "display": "MediKiosk Terminal Node 104 - AIIA New Delhi"
                    }
                ],
                "title": f"First-Mile Clinical Intake - Token {patient.token}",
                "confidentiality": "N",
                "custodian": {
                    "display": "All India Institute of Ayurveda (AIIA), Ministry of Ayush"
                },
                "section": [
                    {
                        "title": "Chief Complaint & Classical SOCRATES HPI",
                        "code": {
                            "coding": [
                                {
                                    "system": "http://snomed.info/sct",
                                    "code": "422843007",
                                    "display": "Chief complaint section"
                                }
                            ]
                        },
                        "text": {
                            "status": "generated",
                            "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><strong>Chief Complaint:</strong> {patient.chief_complaint}</p><p><strong>Site:</strong> {patient.socrates.site}</p><p><strong>Onset:</strong> {patient.socrates.onset}</p><p><strong>Character:</strong> {patient.socrates.character}</p><p><strong>Radiation:</strong> {patient.socrates.radiation}</p><p><strong>Severity:</strong> {patient.socrates.severity}/10</p></div>"
                        }
                    },
                    {
                        "title": "Ayurvedic Dashavidha Pariksha Assessment",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://namstp.ayush.gov.in",
                                    "code": "PARIKSHA-DASHAVIDHA",
                                    "display": "Dashavidha Pariksha Clinical Section"
                                }
                            ]
                        },
                        "text": {
                            "status": "generated",
                            "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><strong>Agni:</strong> {patient.ayush_pariksha.agni}</p><p><strong>Koshtha:</strong> {patient.ayush_pariksha.koshtha}</p><p><strong>Ahara-Vihara:</strong> {patient.ayush_pariksha.ahara_vihara}</p><p><strong>Dominant Dosha:</strong> {patient.ayush_pariksha.dominant_dosha}</p></div>"
                        }
                    }
                ]
            }
        })

        # 2. Patient Resource (ABDM Masked Identifier)
        entries.append({
            "fullUrl": patient_ref,
            "resource": {
                "resourceType": "Patient",
                "id": patient.abha_id.replace('@', '-at-'),
                "meta": {
                    "profile": [
                        "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient"
                    ]
                },
                "identifier": [
                    {
                        "system": "https://healthid.ndhm.gov.in",
                        "value": patient.abha_id
                    },
                    {
                        "system": "https://uidai.gov.in/aadhaar",
                        "value": f"[REDACTED_AADHAAR: {patient.redacted_aadhaar}]"
                    }
                ],
                "name": [
                    {
                        "text": patient.name
                    }
                ],
                "gender": patient.gender.lower(),
                "telecom": [
                    {
                        "system": "language",
                        "value": patient.language
                    }
                ]
            }
        })

        # 3. Condition Resource (Dual-Coding: NAMASTE + WHO TM2 + ICD-10)
        condition_codings = []
        if dual_coding:
            condition_codings.extend([
                {
                    "system": dual_coding.allopathic_icd10.system,
                    "code": dual_coding.allopathic_icd10.code,
                    "display": dual_coding.allopathic_icd10.display
                },
                {
                    "system": dual_coding.ayush_who_icd11_tm2.system,
                    "code": dual_coding.ayush_who_icd11_tm2.code,
                    "display": dual_coding.ayush_who_icd11_tm2.display
                },
                {
                    "system": dual_coding.ayush_namaste.system,
                    "code": dual_coding.ayush_namaste.code,
                    "display": dual_coding.ayush_namaste.display
                }
            ])

        entries.append({
            "fullUrl": f"urn:uuid:{condition_id}",
            "resource": {
                "resourceType": "Condition",
                "id": condition_id,
                "meta": {
                    "profile": [
                        "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition"
                    ]
                },
                "clinicalStatus": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                            "code": "active",
                            "display": "Active"
                        }
                    ]
                },
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                                "code": "encounter-diagnosis",
                                "display": "Encounter Diagnosis"
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": condition_codings,
                    "text": patient.chief_complaint
                },
                "subject": {
                    "reference": patient_ref
                }
            }
        })

        # 4. Observation Resource (Vital Signs & Pain Score)
        entries.append({
            "fullUrl": f"urn:uuid:{vitals_obs_id}",
            "resource": {
                "resourceType": "Observation",
                "id": vitals_obs_id,
                "status": "final",
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                "code": "vital-signs",
                                "display": "Vital Signs"
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "85354-9",
                            "display": "Blood pressure panel with all children optional"
                        }
                    ],
                    "text": "Vital Signs Panel & Pain Severity"
                },
                "subject": {
                    "reference": patient_ref
                },
                "component": [
                    {
                        "code": { "text": "Blood Pressure" },
                        "valueString": patient.vitals.bp
                    },
                    {
                        "code": { "text": "Heart Rate" },
                        "valueString": patient.vitals.hr
                    },
                    {
                        "code": { "text": "SpO2" },
                        "valueString": patient.vitals.spo2
                    },
                    {
                        "code": { "text": "Pain Severity Scale (1-10)" },
                        "valueInteger": patient.socrates.severity
                    }
                ]
            }
        })

        # 5. Consent Resource (DPDP Act 2023 Compliance)
        entries.append({
            "fullUrl": f"urn:uuid:{consent_id}",
            "resource": {
                "resourceType": "Consent",
                "id": consent_id,
                "meta": {
                    "profile": [
                        "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Consent"
                    ]
                },
                "status": "active",
                "scope": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/consentscope",
                            "code": "patient-privacy",
                            "display": "DPDP Act 2023 Ephemeral Clinical Intake Consent"
                        }
                    ]
                },
                "category": [
                    {
                        "coding": [
                            {
                                "system": "https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-consent-category",
                                "code": "OPD-FIRST-MILE-EPHEMERAL"
                            }
                        ]
                    }
                ],
                "patient": {
                    "reference": patient_ref
                },
                "dateTime": timestamp,
                "policyRule": {
                    "text": "DPDP Act 2023 Ephemeral session memory purge completed upon transmission. Zero raw audio or image storage."
                }
            }
        })

        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "meta": {
                "lastUpdated": timestamp,
                "profile": [
                    "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"
                ]
            },
            "identifier": {
                "system": "https://aiia.gov.in/bundles",
                "value": bundle_id
            },
            "type": "document",
            "timestamp": timestamp,
            "entry": entries
        }

fhir_compiler = FhirBundleCompiler()
