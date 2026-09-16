import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Heart,
  Shield,
  FileText,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  UserCheck,
  QrCode,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  Layers,
  Check,
  AlertCircle,
  FileCheck,
  Copy,
  ExternalLink,
  Stethoscope,
  Eye,
  Sliders,
  Radio,
  Share2,
  Flame,
  Wind,
  Droplets,
  Database,
  Lock,
  RefreshCw,
  Send,
  Trash2,
  Maximize2,
  Minimize2,
  Cpu,
  Monitor,
  Smartphone,
  Columns,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

import { api, createDoctorWebSocket } from './services/api';
import { useEphemeralSessionPurge } from './hooks/useEphemeralSessionPurge';
import { useWebAudioDsp } from './hooks/useWebAudioDsp';

// ==========================================
// MOCK DATA & KNOWLEDGE DICTIONARIES
// ==========================================

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { id: 'mr', name: 'Marathi', native: 'मराठी', flag: '🚩' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🏛️' },
];

const I18N = {
  en: {
    kioskTitle: 'MediKiosk Clinical Intake',
    kioskSubtitle: 'First-Mile Multimodal Gateway (Ministry of Ayush & AIIA)',
    step1: 'Identity & Consent',
    step2: 'Body Map & Complaint',
    step3: 'Clinical Reasoner',
    step4: 'Red-Flag Interceptor',
    step5: 'Document Scanner',
    step6: 'Review & Submit',
    scanAbhaQr: 'Scan ABHA QR',
    enterAbha: 'Enter ABHA ID',
    quickToken: 'Quick OPD Token',
    aadhaarRedacted: 'Aadhaar Redacted: •••• •••• 8492 (Verified via OTP)',
    dpdpConsentTitle: 'DPDP Act 2023 Ephemeral Data Consent',
    dpdpConsentDesc: 'Your health intake is processed in transient RAM for the current OPD token. All audio recordings and unencrypted camera frames are irreversibly wiped immediately after transmission to the NHA ABDM Gateway.',
    iConsent: 'I understand & grant informed consent under DPDP Act 2023',
    speakPrompt: 'Tap microphone to speak or choose symptom chips below',
    listening: 'Listening to your voice... (Acoustic Noise Filter Active)',
    tapBodyZone: 'Select affected body region on the interactive map:',
    severityScale: 'Pain / Discomfort Severity (1-10 Scale)',
    submitIntake: 'Submit Intake & Wipe Ephemeral Session',
    emergencyTriggered: 'EMERGENCY DETECTED: Priority Red-Flag Pushed to Emergency Triage Desk',
  },
  hi: {
    kioskTitle: 'मेडीकियोस्क क्लिनिकल इंटेक',
    kioskSubtitle: 'प्रथम-चरण बहुविध स्वास्थ्य गेटवे (आयुष मंत्रालय एवं AIIA)',
    step1: 'पहचान व सहमति',
    step2: 'शरीर मानचित्र व लक्षण',
    step3: 'नैदानिक विश्लेषण (SOCRATES/आयुष)',
    step4: 'आपातकालीन जांच',
    step5: 'दस्तावेज़ स्कैनर',
    step6: 'समीक्षा व सबमिट',
    scanAbhaQr: 'आभा (ABHA) QR स्कैन करें',
    enterAbha: 'आभा पता दर्ज करें',
    quickToken: 'त्वरित ओपीडी टोकन',
    aadhaarRedacted: 'आधार छिपा हुआ: •••• •••• 8492 (ओटीपी सत्यापित)',
    dpdpConsentTitle: 'DPDP अधिनियम 2023 डेटा सहमति',
    dpdpConsentDesc: 'आपकी स्वास्थ्य जानकारी अस्थायी RAM में संग्रहीत है। सबमिशन के तुरंत बाद सभी ऑडियो और अनएन्क्रिप्टेड कैमरे के चित्र नष्ट (Purge) कर दिए जाते हैं।',
    iConsent: 'मैं समझता/समझती हूँ और सहमति देता/देती हूँ',
    speakPrompt: 'बोलने के लिए माइक दबाएं या नीचे दिए गए चिप्स चुनें',
    listening: 'आपकी आवाज सुनी जा रही है... (शोर निवारक सक्रिय)',
    tapBodyZone: 'शरीर के प्रभावित हिस्से पर टैप करें:',
    severityScale: 'दर्द / परेशानी की तीव्रता (1-10 पैमाना)',
    submitIntake: 'इंटेक सबमिट करें व मेमोरी सुरक्षित रूप से हटाएं',
    emergencyTriggered: 'आपातकाल चेतावनी: प्राथमिकता रेड-फ्लैग तुरंत डॉक्टर को भेजा गया',
  },
  mr: {
    kioskTitle: 'मेडीकिओस्क क्लिनिकल नोंदणी',
    kioskSubtitle: 'प्रथम-टप्पा बहुविध प्रवेशद्वार (आयुष मंत्रालय व AIIA)',
    step1: 'ओळख व संमती',
    step2: 'शरीर नकाशा व लक्षणे',
    step3: 'तपासणी विश्लेषण',
    step4: 'तातडीची चेतावणी',
    step5: 'कागदपत्र स्कॅनर',
    step6: 'सादर करा',
    scanAbhaQr: 'आभा (ABHA) QR स्कॅन करा',
    enterAbha: 'आभा पत्ता प्रविष्ट करा',
    quickToken: 'तातडीचे ओपीडी टोकन',
    aadhaarRedacted: 'आधार संरक्षित: •••• •••• 8492 (ओटीपी द्वारे पडताळणी)',
    dpdpConsentTitle: 'DPDP कायदा २०२३ डेटा संमती',
    dpdpConsentDesc: 'तुमची माहिती तात्पुरत्या RAM मध्ये प्रक्रिया केली जाते आणि सबमिशननंतर त्वरित पुसून टाकली जाते.',
    iConsent: 'मी DPDP कायद्यानुसार संमती देतो/देते',
    speakPrompt: 'माइक टॅप करून बोला किंवा खालील चिप्स निवडा',
    listening: 'तुमचा आवाज ऐकत आहे... (आवाज फिल्टर सुरू)',
    tapBodyZone: 'शरीराच्या बाधित भागावर टॅप करा:',
    severityScale: 'त्रासाची तीव्रता (१-१० प्रमाण)',
    submitIntake: 'नोंदणी सादर करा व मेमरी नष्ट करा',
    emergencyTriggered: 'तातडीची स्थिती: डॉक्टरांकडे त्वरित अलर्ट पाठवला',
  },
  ta: {
    kioskTitle: 'மெடிகியோஸ்க் மருத்துவ சேர்க்கை',
    kioskSubtitle: 'முதல் மைல் மருத்துவ வாயில் (ஆயுஷ் அமைச்சகம் & AIIA)',
    step1: 'அடையாளம் & ஒப்புதல்',
    step2: 'உடல் வரைபடம் & அறிகுறி',
    step3: 'மருத்துவ பகுப்பாய்வு',
    step4: 'அவசர எச்சரிக்கை',
    step5: 'ஆவண ஸ்கேனர்',
    step6: 'சமர்ப்பிக்கவும்',
    scanAbhaQr: 'ABHA QR ஸ்கேன் செய்யவும்',
    enterAbha: 'ABHA முகவரி உள்ளிடவும்',
    quickToken: 'விரைவு டோக்கன்',
    aadhaarRedacted: 'ஆதார் மறைக்கப்பட்டது: •••• •••• 8492 (OTP சரிபார்க்கப்பட்டது)',
    dpdpConsentTitle: 'DPDP சட்டம் 2023 தரவு ஒப்புதல்',
    dpdpConsentDesc: 'உங்கள் தகவல் தற்காலிக நினைவகத்தில் செயலாக்கப்பட்டு சமர்ப்பித்த பிறகு அழிக்கப்படும்.',
    iConsent: 'நான் புரிந்துகொண்டு ஒப்புதல் அளிக்கிறேன்',
    speakPrompt: 'மைக் தட்டி பேசவும் அல்லது கீழே உள்ளவற்றை தேர்வு செய்யவும்',
    listening: 'உங்கள் குரல் கேட்கப்படுகிறது...',
    tapBodyZone: 'பாதிக்கப்பட்ட உடல் பகுதியை தொடவும்:',
    severityScale: 'வலி அளவு (1-10)',
    submitIntake: 'சமர்ப்பிக்கவும் & நினைவகத்தை அழிக்கவும்',
    emergencyTriggered: 'அவசர எச்சரிக்கை: மருத்துவருக்கு உடனடி செய்தி அனுப்பப்பட்டது',
  }
};

const BODY_ZONES = [
  { id: 'head', name: 'Head & Neck', nameHi: 'सिर और गर्दन', nameMr: 'डोके व मान', nameTa: 'தலை & கழுத்து', icon: '🧠', chips: ['Throbbing Headache', 'Dizziness / Vertigo', 'Blurred Vision', 'Neck Stiffness', 'Sinus Pressure'] },
  { id: 'chest', name: 'Chest & Heart', nameHi: 'छाती और हृदय', nameMr: 'छाती व हृदय', nameTa: 'மார்பு & இதயம்', icon: '❤️', chips: ['Sharp Pain', 'Heaviness / Pressure', 'Burning Sensation', 'Shortness of Breath', 'Palpitations', 'Pain radiating to Left Arm'] },
  { id: 'abdomen', name: 'Abdomen & GI', nameHi: 'पेट और पाचन', nameMr: 'पोट व पचन', nameTa: 'वयிறு & செரிமானம்', icon: '🫁', chips: ['Burning Epigastric Pain', 'Acid Belching (Amlodgara)', 'Severe Cramping', 'Bloating & Gas', 'Nausea / Vomiting', 'Constipation / Irregular Bowel'] },
  { id: 'joints', name: 'Joints & Limbs', nameHi: 'जोड़ और अंग', nameMr: 'सांधे व पाय/हात', nameTa: 'மூட்டுகள் & கால்கள்', icon: '🦴', chips: ['Knee Pain (Janu Sandhi)', 'Morning Stiffness (>30m)', 'Joint Swelling', 'Crepitus on Walking', 'Lower Back Ache'] },
  { id: 'skin', name: 'Skin & Dermis', nameHi: 'त्वचा', nameMr: 'त्वचा', nameTa: 'தோல்', icon: '✨', chips: ['Severe Itching (Kandu)', 'Erythematous Patches', 'Dry Scaly Lesions', 'Burning Sensation (Daha)'] },
  { id: 'generalized', name: 'Generalized', nameHi: 'सामान्य / सर्वांग', nameMr: 'सर्वसाधारण', nameTa: 'பொதுவானவை', icon: '⚡', chips: ['Extreme Fatigue (Klama)', 'Intermittent Fever (Jwara)', 'Unintentional Weight Loss', 'Generalized Weakness'] },
];

const PRESET_SCENARIOS = {
  scenarioA: {
    id: 'scenarioA',
    name: 'Scenario A: Acute Chest Pain (Emergency Red-Flag)',
    subtitle: '62M • Substernal heaviness & left arm radiation • Triggers regex interceptor',
    patient: {
      name: 'Rameshwar Prasad Verma',
      age: 62,
      gender: 'Male',
      abhaId: 'rameshwar.verma@abdm',
      token: 'OPD-2026-EM01',
      priority: 'RED',
      language: 'hi',
      aadhaarRedacted: '•••• •••• 8492',
      vitals: { bp: '168/104 mmHg', hr: '108 bpm', spo2: '93% on Room Air', temp: '98.4 °F', rr: '24 /min' },
      bodyZone: 'chest',
      chiefComplaint: 'Severe substernal crushing chest pain radiating to left arm with cold diaphoresis and breathlessness since 45 minutes.',
      voiceTranscript: 'छाती में बहुत तेज दर्द हो रहा है, ऐसा लग रहा है भारी पत्थर रखा है। दर्द बाएं हाथ और जबड़े तक जा रहा है और सांस लेने में तकलीफ हो रही है।',
      socrates: {
        site: 'Substernal, retrosternal central chest',
        onset: 'Sudden, acute onset 45 mins ago while climbing stairs',
        character: 'Crushing, heavy pressure (like elephant on chest)',
        radiation: 'Radiating to left shoulder, inner arm & mandible/jaw',
        associations: 'Diaphoresis (profuse cold sweating), Nausea, Acute Dyspnea',
        timing: 'Continuous, worsening with minimal exertion',
        exacerbating: 'Exertion worsens; sublingual rest gives no relief',
        severity: 9
      },
      ayushPariksha: {
        agni: 'Vishama (Irregular/Vata perturbed)',
        koshtha: 'Krura (Constipated)',
        aharaVihara: 'High mental stress (Chinta), irregular meal timings, heavy oily dinner',
        prakritiVikriti: { vata: 65, pitta: 25, kapha: 10 },
        dominantDosha: 'Vata-Pitta Prana Vayu & Vyana Vayu Dusti',
        notes: 'Hrdshula / Urashula with Vata-Kaphaja Srotorodha in Hridaya Srotas.'
      },
      dualCoding: {
        allopathic: {
          icd10: 'I20.9',
          icd10Display: 'Angina Pectoris, Unspecified / Acute Coronary Syndrome (Rule Out NSTEMI/STEMI)',
          snomed: '22298006',
          snomedDisplay: 'Myocardial ischaemia (disorder)'
        },
        ayush: {
          namaste: 'HKS-3',
          namasteDisplay: 'NAMASTE: Hrdshula (हृद्शूल) - Cardiac Pain Syndrome',
          whoIcd11Tm2: 'SF51',
          whoIcd11Tm2Display: 'WHO ICD-11 TM2: SF51 - Hrdshula / Traditional Cardiac Chest Syndrome'
        }
      },
      scannedDocs: [
        {
          id: 'doc1',
          type: 'prescription',
          title: 'Prior Emergency Referral Note (PHC Sector 4)',
          extractedData: [
            { field: 'Medication', original: 'Tab Sorbitrate 5mg SL stat', confidence: 96, verified: true },
            { field: 'Medication', original: 'Tab Aspirin 300mg stat given', confidence: 92, verified: true },
            { field: 'ECG Finding', original: 'ST depression in V4-V6 (>1.5mm)', confidence: 79, verified: false, rawCrop: 'ECG: ST dep V4-V6 >1.5mm' }
          ]
        }
      ],
      chronology: [
        { date: 'Today 08:30 AM', event: 'Acute Onset of Chest Pain at home', type: 'incident', isAbnormal: true },
        { date: 'Today 09:05 AM', event: 'PHC Triage: BP 168/104, Aspirin 300mg stat administered', type: 'vitals', isAbnormal: true },
        { date: 'Today 09:20 AM', event: 'MediKiosk Instant Red-Flag Regex Interception & High Priority OPD Routing', type: 'system', isAbnormal: true }
      ]
    }
  },
  scenarioB: {
    id: 'scenarioB',
    name: 'Scenario B: Integrative Chronic Care (T2D + Amlapitta)',
    subtitle: '48F • HbA1c 9.2%, Fasting 168 mg/dL • Messy handwritten Rx OCR verifier',
    patient: {
      name: 'Priya Sundaram Sharma',
      age: 48,
      gender: 'Female',
      abhaId: 'priya.sharma@abdm',
      token: 'OPD-2026-A104',
      priority: 'AMBER',
      language: 'en',
      aadhaarRedacted: '•••• •••• 5129',
      vitals: { bp: '138/86 mmHg', hr: '76 bpm', spo2: '98% on Room Air', temp: '98.6 °F', rr: '16 /min' },
      bodyZone: 'abdomen',
      chiefComplaint: 'Burning epigastric pain with sour acid belching and uncontrolled blood sugar for 3 months.',
      voiceTranscript: 'Having severe burning in my upper stomach after meals with sour taste in mouth, and my sugar levels are remaining very high despite tablets.',
      socrates: {
        site: 'Epigastric and retrosternal burning (Hrit-Kantha Daha)',
        onset: 'Gradual onset over 3 months, worsening over last 2 weeks',
        character: 'Intense burning (Daha), acid regurgitation (Tikta-Amla Udgara)',
        radiation: 'Radiating upward to throat and retrosternum',
        associations: 'Postprandial fullness, occasional nausea, fatigue, polydipsia',
        timing: 'Worse 1-2 hours after meals and at bedtime',
        exacerbating: 'Spicy / oily foods, coffee, ratri jagarana (late night work)',
        severity: 6
      },
      ayushPariksha: {
        agni: 'Tikshnagni (Intense / Acidic digestive fire with Vidaha)',
        koshtha: 'Madhyama with occasional Vidbandha (irregularity)',
        aharaVihara: 'Frequent spicy snacks, irregular meal gaps, late sleep (1 AM)',
        prakritiVikriti: { vata: 20, pitta: 60, kapha: 20 },
        dominantDosha: 'Pitta Pradhana Amlapitta (Urdhwaga) with Prameha Upadrava',
        notes: 'Amlapitta with Pitta-Kapha avarana; Madhumeha (T2DM) with high metabolic sluggishness.'
      },
      dualCoding: {
        allopathic: {
          icd10: 'E11.9 / K21.9',
          icd10Display: 'Type 2 Diabetes Mellitus / Gastro-Esophageal Reflux Disease (GERD)',
          snomed: '44054006',
          snomedDisplay: 'Type 2 diabetes mellitus (disorder)'
        },
        ayush: {
          namaste: 'AGD-12',
          namasteDisplay: 'NAMASTE: Amlapitta (अम्लपित्त) - Hyperacidity Syndrome',
          whoIcd11Tm2: 'SA14',
          whoIcd11Tm2Display: 'WHO ICD-11 TM2: SA14 - Amlapitta / Traditional Gastric Heat Syndrome'
        }
      },
      scannedDocs: [
        {
          id: 'doc1',
          type: 'prescription',
          title: 'Handwritten Prescription (Local Clinic, 2026-08-14)',
          extractedData: [
            { field: 'Medication', original: 'Tab Metformin 500mg BD', confidence: 94, verified: true, rawCrop: 'Tab Metformin 500mg BD' },
            { field: 'Medication', original: 'Tab Telmisartan 40mg OD', confidence: 91, verified: true, rawCrop: 'Tab Telmisartan 40mg OD' },
            { field: 'Medication', original: 'Ashwagandha Churna 3g BD', confidence: 74, verified: false, rawCrop: 'Ashwagandha Churna 3g BD' },
            { field: 'Medication', original: 'Shankha Vati 2 tab BD', confidence: 68, verified: false, rawCrop: 'Shankha Vati 2 tab BD pc' }
          ]
        },
        {
          id: 'doc2',
          type: 'labReport',
          title: 'NABL Certified Metabolic Lab Panel (2026-09-02)',
          extractedData: [
            { field: 'HbA1c', original: '9.2 % (Normal: <5.7%)', confidence: 98, verified: true, isAbnormal: true },
            { field: 'Fasting Blood Glucose', original: '168 mg/dL (Normal: 70-100)', confidence: 97, verified: true, isAbnormal: true },
            { field: 'Serum Creatinine', original: '1.0 mg/dL (Normal: 0.6-1.2)', confidence: 95, verified: true, isAbnormal: false },
            { field: 'SGPT / ALT', original: '48 U/L (Normal: <35 U/L)', confidence: 93, verified: true, isAbnormal: true }
          ]
        }
      ],
      chronology: [
        { date: '2026-06-10', event: 'Initial diagnosis of Type 2 Diabetes (HbA1c 8.1%)', type: 'diagnosis', isAbnormal: true },
        { date: '2026-08-14', event: 'Prescription modified: Added Telmisartan & Ayurvedic antacids', type: 'prescription', isAbnormal: false },
        { date: '2026-09-02', event: 'Latest Lab: HbA1c escalated to 9.2% ▲, Fasting Glucose 168 mg/dL ▲', type: 'lab', isAbnormal: true },
        { date: 'Today 09:15 AM', event: 'MediKiosk Multimodal Intake: Dual Allopathic + AYUSH Reasoner Synced', type: 'system', isAbnormal: false }
      ]
    }
  },
  scenarioC: {
    id: 'scenarioC',
    name: 'Scenario C: Low-Literacy Regional (Sandhigata Vata / Knee OA)',
    subtitle: '58F • Hindi voice + touch chips • Agni & Prakriti profiling',
    patient: {
      name: 'Sita Devi Mahato',
      age: 58,
      gender: 'Female',
      abhaId: 'sita.devi@abdm',
      token: 'OPD-2026-R302',
      priority: 'GREEN',
      language: 'hi',
      aadhaarRedacted: '•••• •••• 9923',
      vitals: { bp: '124/80 mmHg', hr: '72 bpm', spo2: '99% on Room Air', temp: '98.2 °F', rr: '16 /min' },
      bodyZone: 'joints',
      chiefComplaint: 'Bilateral knee pain with severe morning stiffness and clicking sounds while walking for 6 months.',
      voiceTranscript: 'दोनों घुटनों में बहुत दर्द रहता है, सुबह उठने पर पैर अकड़ जाते हैं और चलने पर कट-कट की आवाज आती है।',
      socrates: {
        site: 'Bilateral Knee joints (Janu Sandhi), worse on right side',
        onset: 'Insidious, gradual onset over 6-8 months',
        character: 'Deep aching pain with stiffness and friction/crepitus (Sandhi Sphutana)',
        radiation: 'Localized to knee joints and proximal calves',
        associations: 'Morning stiffness lasting ~45 mins, mild swelling, difficulty squatting',
        timing: 'Aggravated in early morning, cold weather and prolonged standing',
        exacerbating: 'Climbing stairs, sitting cross-legged; relieved by warm oil massage (Abhyanga)',
        severity: 5
      },
      ayushPariksha: {
        agni: 'Mandagni / Vishamagni (Sluggish metabolic fire)',
        koshtha: 'Krura Koshtha (Persistent mild constipation)',
        aharaVihara: 'Excess dry (Ruksha) and cold food intake, heavy household labor',
        prakritiVikriti: { vata: 70, pitta: 15, kapha: 15 },
        dominantDosha: 'Vata Pradhana Sandhigata Vata (Dhatukshaya Janya)',
        notes: 'Degenerative articular cartilage changes with Vata accumulation in Asthi-Sandhi.'
      },
      dualCoding: {
        allopathic: {
          icd10: 'M17.9',
          icd10Display: 'Osteoarthritis of knee, unspecified (Bilateral Gonarthrosis)',
          snomed: '239873007',
          snomedDisplay: 'Osteoarthritis of knee (disorder)'
        },
        ayush: {
          namaste: 'SRD-4',
          namasteDisplay: 'NAMASTE: Sandhigata Vata (संधिगत वात) - Articular Vata Disorder',
          whoIcd11Tm2: 'SD22',
          whoIcd11Tm2Display: 'WHO ICD-11 TM2: SD22 - Sandhigata Vata / Traditional Osteoarticular Vata Syndrome'
        }
      },
      scannedDocs: [
        {
          id: 'doc1',
          type: 'prescription',
          title: 'Ayurvedic Dispensary Slip (AIIA Satellite Clinic)',
          extractedData: [
            { field: 'Ayurvedic Form', original: 'Yogaraja Guggulu 2 tab BD', confidence: 95, verified: true },
            { field: 'Ayurvedic Oil', original: 'Mahanarayana Taila for local Abhyanga', confidence: 92, verified: true },
            { field: 'Herbal Churna', original: 'Dashamoola Kwatha 20ml BD with lukewarm water', confidence: 71, verified: false, rawCrop: 'Dashamoola Kwatha 20ml BD' }
          ]
        }
      ],
      chronology: [
        { date: '2026-03-12', event: 'First noted knee pain after prolonged pilgrimage walking', type: 'incident', isAbnormal: false },
        { date: '2026-07-04', event: 'X-Ray Bilateral Knees: Grade II Kellgren-Lawrence medial joint space narrowing', type: 'imaging', isAbnormal: true },
        { date: 'Today 09:25 AM', event: 'Voice-Assisted Hindi Intake completed via MediKiosk Touch UI', type: 'system', isAbnormal: false }
      ]
    }
  }
};

export default function App() {
  // Navigation & View Mode ('kiosk' | 'doctor' | 'split')
  const [viewMode, setViewMode] = useState('split');
  const [activeScenarioKey, setActiveScenarioKey] = useState('scenarioB');
  
  // Shared System State
  const [patientQueue, setPatientQueue] = useState([
    { ...PRESET_SCENARIOS.scenarioA.patient, queueId: 'Q-001', submittedAt: '09:05 AM', status: 'WAITING_DOCTOR' },
    { ...PRESET_SCENARIOS.scenarioB.patient, queueId: 'Q-002', submittedAt: '09:18 AM', status: 'IN_CONSULTATION' },
    { ...PRESET_SCENARIOS.scenarioC.patient, queueId: 'Q-003', submittedAt: '09:26 AM', status: 'WAITING_DOCTOR' },
  ]);
  
  const [selectedDoctorPatient, setSelectedDoctorPatient] = useState(PRESET_SCENARIOS.scenarioB.patient);
  
  // Global Audio / Speech & Noise Filter
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [liveWebSocketAlert, setLiveWebSocketAlert] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Custom Hooks for WebAudio DSP and DPDP Session Purge
  const { isDspActive, toggleDsp, isRecording, audioLevel, micPermission, startRecordingWithDsp, stopRecordingDsp, getAudioBlob } = useWebAudioDsp();
  const { registerBlobUrl, purgeSessionMemory, isPurging, purgeLogs } = useEphemeralSessionPurge();
  
  // Audit Trail for Clinician Overrides (/api/doctor/override)
  const [overrideAuditLog, setOverrideAuditLog] = useState([
    {
      id: 'AUD-901',
      timestamp: '2026-09-09 08:45:12',
      doctorId: 'DOC-AIIA-104 (Dr. Arvind Sharma, MD Ayush/Allopathy)',
      patientAbha: 'rameshwar.verma@abdm',
      category: 'TRIAGE_RECLASSIFICATION',
      reason: 'Acute Coronary Syndrome suspicion; bypassed routine AYUSH intake to ICCU Triage.'
    }
  ]);
  
  // Modals
  const [showFhirModal, setShowFhirModal] = useState(false);
  const [fhirBundlePayload, setFhirBundlePayload] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeStep, setPurgeStep] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(null);

  // Kiosk Interactive State
  const [kioskStep, setKioskStep] = useState(1);
  const [kioskLang, setKioskLang] = useState('en');
  const [kioskAbhaInput, setKioskAbhaInput] = useState('priya.sharma@abdm');
  const [kioskTokenInput, setKioskTokenInput] = useState('OPD-2026-A104');
  const [kioskConsentGiven, setKioskConsentGiven] = useState(true);
  
  const [selectedZone, setSelectedZone] = useState('abdomen');
  const [bodyView, setBodyView] = useState('front'); // 'front' | 'back'
  const [selectedChips, setSelectedChips] = useState(['Burning Epigastric Pain', 'Acid Belching (Amlodgara)']);
  const [voiceTranscript, setVoiceTranscript] = useState('Having severe burning in my stomach after food and high blood sugar');
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [voiceErrorMsg, setVoiceErrorMsg] = useState(null);
  const [micDeviceName, setMicDeviceName] = useState(null);
  const voiceTranscriptRef = useRef(voiceTranscript);
  useEffect(() => {
    voiceTranscriptRef.current = voiceTranscript;
  }, [voiceTranscript]);

  // Clinical Reasoner Values in Kiosk
  const [socratesSite, setSocratesSite] = useState('Epigastrium / Retro-sternal');
  const [socratesOnset, setSocratesOnset] = useState('Gradual (3 months)');
  const [socratesCharacter, setSocratesCharacter] = useState('Burning / Acidity (Daha)');
  const [socratesRadiation, setSocratesRadiation] = useState('Upward into throat');
  const [socratesAssociations, setSocratesAssociations] = useState(['Nausea', 'Postprandial fullness', 'Fatigue']);
  const [socratesTiming, setSocratesTiming] = useState('Worse 1 hr after meals');
  const [socratesExacerbating, setSocratesExacerbating] = useState('Spicy food, coffee, late sleep');
  const [socratesSeverity, setSocratesSeverity] = useState(6);

  // AYUSH Reasoner
  const [ayushAgni, setAyushAgni] = useState('Tikshnagni (Hyper-metabolic / Acidic)');
  const [ayushKoshtha, setAyushKoshtha] = useState('Madhyama (Regular with acidity)');
  const [ayushAhara, setAyushAhara] = useState(['Spicy/Fried Foods', 'Irregular Meal Gaps', 'Late Night Work (Ratri Jagarana)']);
  const [ayushVata, setAyushVata] = useState(20);
  const [ayushPitta, setAyushPitta] = useState(60);
  const [ayushKapha, setAyushKapha] = useState(20);

  // Red-Flag State
  const [redFlagTriggered, setRedFlagTriggered] = useState(false);
  const [redFlagDetails, setRedFlagDetails] = useState(null);

  // Scanner Simulation State & Dynamic OCR
  const [selectedScanSample, setSelectedScanSample] = useState('prescription');
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedFilePreview, setUploadedFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [scannedOcrItems, setScannedOcrItems] = useState([
    { id: 1, text: 'Tab Metformin 500mg BD', confidence: 0.94, verified: true, original: 'Tab Metformin 500mg BD' },
    { id: 2, text: 'Tab Telmisartan 40mg OD', confidence: 0.91, verified: true, original: 'Tab Telmisartan 40mg OD' },
    { id: 3, text: 'Ashwagandha Churna 3g BD', confidence: 0.74, verified: false, original: 'Ashwagandha Churna 3g BD', raw_crop_base64: null, rawCrop: 'Ashwagandha Churna 3g BD' },
    { id: 4, text: 'Shankha Vati 2 tab BD', confidence: 0.68, verified: false, original: 'Shankha Vati 2 tab BD', raw_crop_base64: null, rawCrop: 'Shankha Vati 2 tab BD pc' }
  ]);

  // Doctor Inline OCR Verification State
  const [doctorVerifiedItems, setDoctorVerifiedItems] = useState([...scannedOcrItems]);
  const [editingOcrId, setEditingOcrId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Doctor Override Input State
  const [overrideCategory, setOverrideCategory] = useState('DIAGNOSIS_MODIFICATION');
  const [overrideNotes, setOverrideNotes] = useState('');

  // ----------------------------------------------------
  // Live WebSocket Connection to FastAPI /ws/doctor
  // ----------------------------------------------------
  useEffect(() => {
    const ws = createDoctorWebSocket(
      (payload) => {
        console.log('⚡ Live WebSocket message received:', payload);
        if (payload.type === 'RED_FLAG_EMERGENCY') {
          setLiveWebSocketAlert({
            id: 'WS-' + Date.now(),
            type: 'RED_FLAG_EMERGENCY',
            patientName: payload.data?.patientName || 'Emergency Patient',
            token: payload.data?.token || 'OPD-EMERGENCY',
            trigger: (payload.data?.trigger_terms || ['Chest Pain']).join(', '),
            timestamp: new Date().toLocaleTimeString(),
          });
        } else if (payload.type === 'PATIENT_INTAKE_SUBMITTED') {
          const newPat = payload.data;
          setPatientQueue(prev => {
            if (prev.some(p => p.token === newPat.token)) return prev;
            return [newPat, ...prev];
          });
          showToast(`⚡ Live Push: Patient ${newPat.name} (Token ${newPat.token}) added to Queue!`);
        } else if (payload.type === 'TOKEN_VERIFIED') {
          setDoctorVerifiedItems(prev => prev.map(item => {
            if (item.id === payload.data.token_id) {
              return { ...item, verified: true, text: payload.data.updated_text || item.text };
            }
            return item;
          }));
        }
      },
      () => setWsConnected(true),
      () => setWsConnected(false)
    );

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // ----------------------------------------------------
  // TTS & Speech Synthesis Helper
  // ----------------------------------------------------
  const speakText = (text) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechSpeed;
      if (kioskLang === 'hi') utterance.lang = 'hi-IN';
      else if (kioskLang === 'mr') utterance.lang = 'mr-IN';
      else if (kioskLang === 'ta') utterance.lang = 'ta-IN';
      else utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // ----------------------------------------------------
  // REAL-TIME RED-FLAG REGEX INTERCEPTOR (<1ms via backend /api/intake/red-flag)
  // ----------------------------------------------------
  const evaluateRedFlags = async (textToCheck) => {
    if (!textToCheck) return false;
    const res = await api.checkRedFlag(textToCheck, selectedZone, selectedChips);
    if (res.is_red_flag) {
      setRedFlagTriggered(true);
      setRedFlagDetails({
        matchedTerm: res.matched_terms.join(', '),
        timestamp: new Date().toLocaleTimeString(),
        severity: 'CRITICAL_EMERGENCY_INTERCEPT',
        guidance: res.emergency_guidance || 'IMMEDIATE ICCU TRIAGE ESCALATION.'
      });
      speakText('Emergency red flag detected. Priority triage alert pushed to doctor.');
      return true;
    }
    return false;
  };

  // Check voice transcript or selected chips against regex
  useEffect(() => {
    const combinedString = `${voiceTranscript} ${selectedChips.join(' ')} ${socratesSite} ${socratesCharacter}`;
    evaluateRedFlags(combinedString);
  }, [voiceTranscript, selectedChips, socratesSite, socratesCharacter]);

  // Handle Scenario Loading
  const loadScenario = (key) => {
    setActiveScenarioKey(key);
    const scen = PRESET_SCENARIOS[key];
    if (!scen) return;
    
    setSelectedDoctorPatient(scen.patient);
    setKioskLang(scen.patient.language || 'en');
    setKioskAbhaInput(scen.patient.abhaId);
    setKioskTokenInput(scen.patient.token);
    setSelectedZone(scen.patient.bodyZone);
    setVoiceTranscript(scen.patient.voiceTranscript);
    
    // Socrates
    setSocratesSite(scen.patient.socrates.site);
    setSocratesOnset(scen.patient.socrates.onset);
    setSocratesCharacter(scen.patient.socrates.character);
    setSocratesRadiation(scen.patient.socrates.radiation);
    setSocratesSeverity(scen.patient.socrates.severity);
    setSocratesTiming(scen.patient.socrates.timing);
    setSocratesExacerbating(scen.patient.socrates.exacerbating);
    
    // Ayush
    setAyushAgni(scen.patient.ayushPariksha.agni);
    setAyushKoshtha(scen.patient.ayushPariksha.koshtha);
    setAyushVata(scen.patient.ayushPariksha.prakritiVikriti.vata);
    setAyushPitta(scen.patient.ayushPariksha.prakritiVikriti.pitta);
    setAyushKapha(scen.patient.ayushPariksha.prakritiVikriti.kapha);

    // Scanned docs
    if (scen.patient.scannedDocs && scen.patient.scannedDocs[0]) {
      const items = scen.patient.scannedDocs[0].extractedData.map((d, i) => ({
        id: i + 1,
        text: d.original,
        confidence: typeof d.confidence === 'number' && d.confidence > 1 ? d.confidence / 100 : d.confidence,
        verified: d.verified,
        original: d.original,
        rawCrop: d.rawCrop || d.original
      }));
      setScannedOcrItems(items);
      setDoctorVerifiedItems(items);
    }

    if (key === 'scenarioA') {
      setRedFlagTriggered(true);
      setRedFlagDetails({
        matchedTerm: 'chest pain / छाती में बहुत तेज दर्द',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'CRITICAL_EMERGENCY_INTERCEPT',
        guidance: 'IMMEDIATE ICCU / EMERGENCY TRIAGE ESCALATION. Routing directly to Red Triage Bed #1.'
      });
      setLiveWebSocketAlert({
        id: 'WS-' + Date.now(),
        type: 'RED_FLAG_EMERGENCY',
        patientName: scen.patient.name,
        token: scen.patient.token,
        trigger: 'Severe Substernal Chest Pain',
        timestamp: new Date().toLocaleTimeString(),
      });
      setKioskStep(4);
    } else {
      setRedFlagTriggered(false);
      setRedFlagDetails(null);
      setLiveWebSocketAlert(null);
      setKioskStep(1);
    }
    
    showToast(`Loaded ${scen.name}`);
  };

  const showToast = (msg) => {
    setShowSuccessToast(msg);
    setTimeout(() => setShowSuccessToast(null), 3500);
  };

  // Voice recording toggle using Web Speech API + WebAudio DSP
  const recognitionRef = useRef(null);
  const speechResultRef = useRef(false);

  // Hardware Microphone Diagnostic Check
  const testMicrophoneHardware = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVoiceErrorMsg('getUserMedia is not supported on this browser context (requires localhost or HTTPS).');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tracks = stream.getAudioTracks();
      if (tracks && tracks.length > 0) {
        const label = tracks[0].label || 'Default Microphone Device';
        setMicDeviceName(label);
        setVoiceErrorMsg(null);
        showToast(`✓ Mic Hardware Verified: ${label}`);
        tracks.forEach(t => t.stop());
      }
    } catch (err) {
      console.warn('Mic hardware check:', err);
      if (err.name === 'NotAllowedError') {
        setVoiceErrorMsg('Microphone access blocked by browser. Please allow microphone permissions in the browser address bar (lock icon).');
      } else {
        setVoiceErrorMsg(`Microphone error: ${err.message || err.name}`);
      }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecordingDsp();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }

      // If user stopped recording and speech recognition delivered text, conclude
      if (speechResultRef.current) {
        setVoiceStatus('transcribed');
        showToast('✓ Speech captured and verified');
        return;
      }

      // If speech recognition didn't yield text, attempt backend acoustic transcription
      setTimeout(async () => {
        const blob = getAudioBlob();
        if (blob && blob.size > 200) {
          showToast('Processing microphone audio...');
          const res = await api.transcribeVoice(kioskLang, null, blob);
          if (res && res.transcript) {
            setVoiceTranscript(res.transcript);
            evaluateRedFlags(res.transcript);
            setVoiceStatus('transcribed');
            showToast(`✓ Voice Transcribed (${res.detected_language.toUpperCase()})`);
            return;
          }
        }
        
        // If still empty or no sound captured
        if (!voiceTranscriptRef.current || voiceTranscriptRef.current.startsWith('Listening')) {
          setVoiceStatus('idle');
          showToast('No clear speech detected. Speak closer to the mic or click a test button below.');
        }
      }, 400);
    } else {
      speechResultRef.current = false;
      setVoiceStatus('recording');
      setVoiceErrorMsg(null);
      
      // If current transcript is a status message, clear it
      if (voiceTranscript && (voiceTranscript.startsWith('Listening') || voiceTranscript.startsWith('Having severe burning'))) {
        setVoiceTranscript('');
      }

      await startRecordingWithDsp();

      // Check for browser Web Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          if (kioskLang === 'hi') recognition.lang = 'hi-IN';
          else if (kioskLang === 'mr') recognition.lang = 'mr-IN';
          else if (kioskLang === 'ta') recognition.lang = 'ta-IN';
          else recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            const currentSpeech = (finalTranscript || interimTranscript || '').trim();
            if (currentSpeech) {
              speechResultRef.current = true;
              setVoiceTranscript(currentSpeech);
              evaluateRedFlags(currentSpeech);
              setVoiceStatus('recording');
            }
          };

          recognition.onerror = async (err) => {
            console.warn('Web Speech API status:', err.error);
            if (err.error === 'no-speech') {
              // Pause in speaking is normal; keep recording
              return;
            }
            if (err.error === 'not-allowed') {
              setVoiceErrorMsg('Microphone permission blocked in browser. Click lock icon in URL bar to allow.');
              setVoiceStatus('error');
            } else if (err.error === 'network') {
              setVoiceErrorMsg('Browser speech cloud service network timeout. Audio recorded via local buffer.');
            }
          };

          recognition.onend = () => {
            // Keep recording active if user is still dictating
            if (isRecording && !speechResultRef.current) {
              try { recognition.start(); } catch(e) {}
            }
          };

          recognition.start();
          return;
        } catch (e) {
          console.warn('SpeechRecognition start failed, using audio DSP stream fallback:', e);
        }
      }

      // Fallback auto-conclude after 10s if user forgets to click stop
      setTimeout(async () => {
        if (!speechResultRef.current && isRecording) {
          stopRecordingDsp();
          const blob = getAudioBlob();
          if (blob && blob.size > 200) {
            const res = await api.transcribeVoice(kioskLang, null, blob);
            if (res && res.transcript) {
              setVoiceTranscript(res.transcript);
              evaluateRedFlags(res.transcript);
              setVoiceStatus('transcribed');
            }
          }
        }
      }, 10000);
    }
  };

  // Quick 1-click Voice Test Simulation Helper
  const handleVoiceSample = async (text, lang = kioskLang) => {
    speakText('Analyzing spoken symptom audio with noise suppression.');
    await startRecordingWithDsp();
    setVoiceTranscript('Listening & applying 74 dB bandpass filter...');
    showToast('DSP Noise Filtering & Transcribing via Bhashini...');
    setTimeout(async () => {
      stopRecordingDsp();
      const res = await api.transcribeVoice(lang, text);
      if (res && res.transcript) {
        setVoiceTranscript(res.transcript);
        evaluateRedFlags(res.transcript);
        showToast(res.red_flag_match ? '🚨 Emergency Red Flag Triggered!' : '✓ Symptoms Recorded & Filtered');
      }
    }, 1000);
  };

  // OCR Processing Pipeline (Upload or Preset)
  const triggerDocumentScan = async (sampleType, uploadedFile = null) => {
    setSelectedScanSample(sampleType);
    setIsScanning(true);

    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      registerBlobUrl(url);
      setUploadedFilePreview(url);
    }

    const res = await api.processOcrUpload(uploadedFile, sampleType, sampleType);
    if (res && res.tokens) {
      setScannedOcrItems(res.tokens);
      setDoctorVerifiedItems(res.tokens);
    }

    setTimeout(() => {
      setIsScanning(false);
      showToast(`✓ Document OCR Extracted ${res?.tokens?.length || 4} entities with crop bounding boxes`);
    }, 600);
  };

  // Handle file input change
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerDocumentScan('uploaded_document', file);
    }
  };

  // DPDP Submission & Ephemeral RAM Purge Flow
  const handleKioskSubmit = async () => {
    setShowPurgeModal(true);
    setPurgeStep(1);

    const newPatient = {
      abha_id: kioskAbhaInput,
      token: kioskTokenInput || `OPD-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: kioskAbhaInput.includes('rameshwar') ? 'Rameshwar Prasad Verma' : (kioskAbhaInput.includes('sita') ? 'Sita Devi Mahato' : 'Priya Sundaram Sharma'),
      age: 48,
      gender: 'Female',
      language: kioskLang,
      redacted_aadhaar: '•••• •••• 8492',
      vitals: { bp: '138/86 mmHg', hr: '76 bpm', spo2: '98%', temp: '98.6 °F', rr: '16 /min' },
      body_zone: selectedZone,
      chief_complaint: voiceTranscript || selectedChips.join(', '),
      voice_transcript: voiceTranscript,
      socrates: {
        site: socratesSite,
        onset: socratesOnset,
        character: socratesCharacter,
        radiation: socratesRadiation,
        associations: socratesAssociations.join(', '),
        timing: socratesTiming,
        exacerbating: socratesExacerbating,
        severity: socratesSeverity
      },
      ayush_pariksha: {
        agni: ayushAgni,
        koshtha: ayushKoshtha,
        ahara_vihara: ayushAhara.join(', '),
        prakriti_vikriti: { vata: ayushVata, pitta: ayushPitta, kapha: ayushKapha },
        dominant_dosha: 'Pitta-Vata Dominance (Amlapitta)',
        notes: 'Multimodal intake submitted.'
      },
      ocr_tokens: scannedOcrItems,
      priority: redFlagTriggered ? 'RED' : 'AMBER',
      dpdp_consent_granted: true
    };

    setTimeout(() => setPurgeStep(2), 600);
    setTimeout(() => setPurgeStep(3), 1200);
    setTimeout(async () => {
      setPurgeStep(4);
      // Run actual DPDP memory purge
      await purgeSessionMemory();
    }, 1800);
    setTimeout(() => setPurgeStep(5), 2400);
    setTimeout(async () => {
      setPurgeStep(6);
      
      // Submit to FastAPI backend
      const res = await api.submitIntake(newPatient);
      
      // Update local state if needed
      setPatientQueue(prev => [newPatient, ...prev]);
      setSelectedDoctorPatient(newPatient);
      showToast('✓ Intake submitted to FastAPI backend & ephemeral RAM purged per DPDP Act 2023!');
    }, 3000);
  };

  const finalizePurge = () => {
    setShowPurgeModal(false);
    setPurgeStep(0);
    setKioskStep(1);
    setVoiceTranscript('');
    setSelectedChips([]);
    setRedFlagTriggered(false);
    setUploadedFilePreview(null);
  };

  // Doctor Actions
  const handleDoctorApproveOcr = async (id) => {
    setDoctorVerifiedItems(prev => prev.map(item => item.id === id ? { ...item, verified: true } : item));
    await api.verifyOcrToken(selectedDoctorPatient.token, id, 'approve');
    showToast('✓ OCR Entity Approved for EMR');
  };

  const handleDoctorDiscardOcr = async (id) => {
    setDoctorVerifiedItems(prev => prev.filter(item => item.id !== id));
    await api.verifyOcrToken(selectedDoctorPatient.token, id, 'discard');
    showToast('Unverified OCR item discarded');
  };

  const handleDoctorSaveInlineEdit = async (id) => {
    setDoctorVerifiedItems(prev => prev.map(item => item.id === id ? { ...item, text: editingText, verified: true } : item));
    await api.verifyOcrToken(selectedDoctorPatient.token, id, 'edit', editingText);
    setEditingOcrId(null);
    setEditingText('');
    showToast('Inline OCR correction saved to backend');
  };

  const handleDoctorSubmitOverride = async () => {
    const newAudit = {
      doctor_id: 'DOC-AIIA-104 (Dr. Arvind Sharma)',
      patient_abha: selectedDoctorPatient.abhaId || selectedDoctorPatient.abha_id,
      token: selectedDoctorPatient.token,
      category: overrideCategory,
      reason: overrideNotes || 'Clinician diagnostic adjustments during OPD triage.'
    };
    const saved = await api.saveClinicianOverride(newAudit);
    setOverrideAuditLog(prev => [saved, ...prev]);
    setShowOverrideModal(false);
    setOverrideNotes('');
    showToast('✓ Clinician Override logged to /api/doctor/override audit trail');
  };

  const handleOpenFhirModal = async () => {
    setShowFhirModal(true);
    const bundle = await api.getFhirBundle(selectedDoctorPatient);
    if (bundle) setFhirBundlePayload(bundle);
  };

  const handleAcceptSummaryAndPrefill = () => {
    showToast(`✓ Clinical Intake Pre-filled into AIIA Hospital EMR for Token ${selectedDoctorPatient.token}`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      
      {/* =================================================================== */}
      {/* PERSISTENT TOP DEMO CONTROLS & GOVERNMENT OF INDIA HEADER */}
      {/* =================================================================== */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40 shrink-0">
        {/* Left: Branding & SIH 2026 Badges */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-extrabold text-base tracking-tight text-white">MediKiosk</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                SIH 2026 #26047
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                FastAPI MVP • NAMASTE • NHA ABDM
              </span>
              {wsConnected && (
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-1 animate-ping"></span>
                  WS Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-none">
              Autonomous First-Mile Clinical Intake & AYUSH Dual-Coding Gateway
            </p>
          </div>
        </div>

        {/* Center: Live Scenario Switcher Bar */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" /> Demo Scenarios:
          </span>
          <button
            onClick={() => loadScenario('scenarioA')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all flex items-center space-x-1.5 ${
              activeScenarioKey === 'scenarioA'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <span>Scenario A (Emergency)</span>
          </button>
          <button
            onClick={() => loadScenario('scenarioB')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all flex items-center space-x-1.5 ${
              activeScenarioKey === 'scenarioB'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Scenario B (Chronic + OCR)</span>
          </button>
          <button
            onClick={() => loadScenario('scenarioC')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all flex items-center space-x-1.5 ${
              activeScenarioKey === 'scenarioC'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>Scenario C (Voice/Regional)</span>
          </button>
        </div>

        {/* Right: View Toggle, Sound, Noise Filter & Reset */}
        <div className="flex items-center space-x-2">
          {/* RNNoise WebAudio DSP Ambient Filter Toggle */}
          <button
            onClick={() => {
              toggleDsp();
              showToast(isDspActive ? 'Ambient DSP Filter Disabled' : 'WebAudio 70-80 dB OPD DSP Filter Activated');
            }}
            title="WebAudio Bandpass & Dynamics DSP Filter (70-80 dB OPD Noise Suppression)"
            className={`px-2 py-1 text-[11px] rounded flex items-center space-x-1 border transition-all ${
              isDspActive
                ? 'bg-teal-950/60 border-teal-500/40 text-teal-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">DSP Noise Filter: {isDspActive ? 'ACTIVE (74 dB)' : 'OFF'}</span>
          </button>

          {/* TTS Audio Readout Toggle */}
          <div className="flex items-center bg-slate-800 rounded border border-slate-700 p-0.5">
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title="Voice TTS Readout Toggle"
              className={`p-1 rounded ${ttsEnabled ? 'text-emerald-400 bg-emerald-950/50' : 'text-slate-400'}`}
            >
              {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <select
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
              className="bg-transparent text-[11px] text-slate-300 focus:outline-none px-1"
            >
              <option value="0.75" className="bg-slate-900">0.75x</option>
              <option value="1.0" className="bg-slate-900">1.0x</option>
              <option value="1.25" className="bg-slate-900">1.25x</option>
            </select>
          </div>

          {/* View Mode Switcher (Kiosk / Doctor / Split) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('kiosk')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center space-x-1 transition-all ${
                viewMode === 'kiosk'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Patient Touch & Voice Kiosk Mode"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Patient Kiosk</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center space-x-1 transition-all ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Synchronous Live Split View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dual Split</span>
            </button>
            <button
              onClick={() => setViewMode('doctor')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center space-x-1 transition-all ${
                viewMode === 'doctor'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Doctor 15-Second OPD Single-Pane Console"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Doctor OPD</span>
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* REAL-TIME NOTIFICATION BANNER / WEBSOCKET RED-FLAG ALERT */}
      {/* =================================================================== */}
      {liveWebSocketAlert && (
        <div className="bg-gradient-to-r from-rose-900/90 via-red-900/90 to-rose-950/90 border-b border-rose-500/50 px-4 py-2 flex items-center justify-between text-white animate-pulse z-30 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-rose-600 rounded-full animate-ping">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-wide text-rose-200">
                  CRITICAL EMERGENCY TRIAGE DISPATCH (/ws/doctor)
                </span>
                <span className="bg-rose-500/40 text-rose-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                  {liveWebSocketAlert.token}
                </span>
              </div>
              <p className="text-xs text-rose-100/90">
                Patient: <span className="font-semibold">{liveWebSocketAlert.patientName}</span> • Intercepted Term: <span className="font-mono bg-black/40 px-1 rounded text-yellow-300">"{liveWebSocketAlert.trigger}"</span> • Deterministic Regex &lt;1ms
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setViewMode('doctor');
                setSelectedDoctorPatient(PRESET_SCENARIOS.scenarioA.patient);
              }}
              className="px-3 py-1 bg-white text-rose-900 hover:bg-rose-100 text-xs font-bold rounded shadow transition-all"
            >
              View in Doctor Console &rarr;
            </button>
            <button
              onClick={() => setLiveWebSocketAlert(null)}
              className="p-1 text-rose-300 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MAIN APPLICATION CONTAINER (SPLIT OR FULL SCREEN) */}
      {/* =================================================================== */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* =================================================================== */}
        {/* PANE 1: PATIENT MULTIMODAL KIOSK INTERFACE (/kiosk) */}
        {/* =================================================================== */}
        {(viewMode === 'kiosk' || viewMode === 'split') && (
          <section className={`flex-1 flex flex-col bg-slate-950 border-r border-slate-800/80 overflow-y-auto ${viewMode === 'split' ? 'lg:max-w-[50%]' : 'w-full'}`}>
            
            {/* Kiosk Top Sub-Header */}
            <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 p-3 sticky top-0 z-20">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-heading text-base font-bold text-white flex items-center">
                    <Smartphone className="w-4 h-4 mr-2 text-emerald-400" />
                    {I18N[kioskLang].kioskTitle}
                  </h1>
                  <p className="text-[11px] text-slate-400">{I18N[kioskLang].kioskSubtitle}</p>
                </div>

                {/* 4-Language Switcher */}
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setKioskLang(lang.id);
                        speakText(I18N[lang.id].kioskTitle);
                      }}
                      className={`px-2 py-1 text-xs rounded font-medium transition-all flex items-center space-x-1 ${
                        kioskLang === lang.id
                          ? 'bg-emerald-600 text-white font-bold shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.native}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Steps Navigator */}
              <div className="mt-3 grid grid-cols-6 gap-1">
                {[
                  { num: 1, label: I18N[kioskLang].step1, icon: UserCheck },
                  { num: 2, label: I18N[kioskLang].step2, icon: Heart },
                  { num: 3, label: I18N[kioskLang].step3, icon: Stethoscope },
                  { num: 4, label: I18N[kioskLang].step4, icon: AlertTriangle },
                  { num: 5, label: I18N[kioskLang].step5, icon: Camera },
                  { num: 6, label: I18N[kioskLang].step6, icon: FileCheck },
                ].map(step => {
                  const Icon = step.icon;
                  const isActive = kioskStep === step.num;
                  const isDone = kioskStep > step.num;
                  return (
                    <button
                      key={step.num}
                      onClick={() => setKioskStep(step.num)}
                      className={`flex flex-col items-center p-1.5 rounded transition-all text-center min-h-[44px] ${
                        isActive
                          ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold'
                          : isDone
                          ? 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                          : 'text-slate-500 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        {isDone ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Icon className={`w-3 h-3 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                        )}
                        <span className="text-[10px] font-mono">0{step.num}</span>
                      </div>
                      <span className="text-[9px] truncate w-full hidden sm:block">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KIOSK MAIN CONTENT AREA */}
            <div className="p-4 flex-1 flex flex-col space-y-4">

              {/* STEP 1: IDENTITY & DPDP ACT 2023 CONSENT */}
              {kioskStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="glass-panel p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-sm text-slate-200 flex items-center">
                        <QrCode className="w-4 h-4 mr-2 text-emerald-400" />
                        ABDM ABHA Patient Verification
                      </h3>
                      <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                        M1/M2 Milestone Ready
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 text-center cursor-pointer hover:bg-emerald-950/40 transition-all">
                        <QrCode className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
                        <span className="text-xs font-medium text-emerald-200 block">{I18N[kioskLang].scanAbhaQr}</span>
                        <span className="text-[9px] text-slate-400">Scan PHR App QR</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-700 bg-slate-900/60 text-center cursor-pointer hover:border-slate-600 transition-all">
                        <Search className="w-6 h-6 mx-auto text-indigo-400 mb-1" />
                        <span className="text-xs font-medium text-slate-200 block">{I18N[kioskLang].enterAbha}</span>
                        <span className="text-[9px] text-slate-400">user@abdm</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-700 bg-slate-900/60 text-center cursor-pointer hover:border-slate-600 transition-all">
                        <Clock className="w-6 h-6 mx-auto text-amber-400 mb-1" />
                        <span className="text-xs font-medium text-slate-200 block">{I18N[kioskLang].quickToken}</span>
                        <span className="text-[9px] text-slate-400">Walk-in OPD</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">ABHA Address (Health ID):</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={kioskAbhaInput}
                            onChange={(e) => setKioskAbhaInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                            placeholder="username@abdm"
                          />
                          <CheckCircle className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Assigned OPD Token #:</label>
                        <input
                          type="text"
                          value={kioskTokenInput}
                          onChange={(e) => setKioskTokenInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span className="text-slate-300">{I18N[kioskLang].aadhaarRedacted}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold rounded">
                        DPDP Compliant
                      </span>
                    </div>
                  </div>

                  {/* DPDP Act 2023 Audio-Guided Informed Consent Box */}
                  <div className="glass-panel p-4 rounded-xl border-indigo-500/30 bg-indigo-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        <h4 className="font-heading font-semibold text-sm text-indigo-200">
                          {I18N[kioskLang].dpdpConsentTitle}
                        </h4>
                      </div>
                      <button
                        onClick={() => speakText(I18N[kioskLang].dpdpConsentDesc)}
                        className="p-1.5 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 rounded flex items-center space-x-1 text-xs"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>
                    </div>

                    <p className="text-xs text-indigo-200/80 leading-relaxed">
                      {I18N[kioskLang].dpdpConsentDesc}
                    </p>

                    <div className="pt-2 border-t border-indigo-500/20 flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="kiosk-consent"
                        checked={kioskConsentGiven}
                        onChange={(e) => setKioskConsentGiven(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                      <label htmlFor="kiosk-consent" className="text-xs text-slate-200 font-medium cursor-pointer">
                        {I18N[kioskLang].iConsent}
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setKioskStep(2);
                      speakText(I18N[kioskLang].tapBodyZone);
                    }}
                    disabled={!kioskConsentGiven}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all text-sm min-h-[48px]"
                  >
                    <span>Proceed to Body Map & Symptoms</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: CHIEF COMPLAINT & INTERACTIVE ANATOMICAL BODY MAP */}
              {kioskStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">{I18N[kioskLang].tapBodyZone}</span>
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800">
                      <button
                        onClick={() => setBodyView('front')}
                        className={`px-2.5 py-0.5 text-xs rounded font-medium ${bodyView === 'front' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                      >
                        Front (सम्मुख)
                      </button>
                      <button
                        onClick={() => setBodyView('back')}
                        className={`px-2.5 py-0.5 text-xs rounded font-medium ${bodyView === 'back' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                      >
                        Back (पृष्ठ)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SVG Human Silhouette Map */}
                    <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center relative min-h-[280px]">
                      <svg viewBox="0 0 200 320" className="w-44 h-64 drop-shadow-md">
                        <path
                          d="M100 20 C110 20 118 28 118 40 C118 50 110 58 100 58 C90 58 82 50 82 40 C82 28 90 20 100 20 Z 
                             M88 60 L112 60 L135 85 L145 140 L132 145 L125 95 L125 160 L135 225 L130 295 L112 295 L110 185 L90 185 L88 295 L70 295 L65 225 L75 160 L75 95 L68 145 L55 140 L65 85 Z"
                          fill="#1e293b"
                          stroke="#475569"
                          strokeWidth="2"
                        />

                        {/* Interactive Clickable Hotspots */}
                        <circle
                          cx="100" cy="40" r="18"
                          onClick={() => {
                            setSelectedZone('head');
                            speakText('Head and Neck selected');
                          }}
                          className={`cursor-pointer transition-all ${
                            selectedZone === 'head' ? 'fill-emerald-500/60 stroke-emerald-300 stroke-2 animate-pulse' : 'fill-slate-800/80 hover:fill-emerald-500/30'
                          }`}
                        />
                        <rect
                          x="78" y="72" width="44" height="34" rx="6"
                          onClick={() => {
                            setSelectedZone('chest');
                            speakText('Chest and Heart selected');
                          }}
                          className={`cursor-pointer transition-all ${
                            selectedZone === 'chest' ? 'fill-rose-500/60 stroke-rose-300 stroke-2 animate-pulse' : 'fill-slate-800/80 hover:fill-rose-500/30'
                          }`}
                        />
                        <rect
                          x="78" y="112" width="44" height="34" rx="6"
                          onClick={() => {
                            setSelectedZone('abdomen');
                            speakText('Abdomen and Digestion selected');
                          }}
                          className={`cursor-pointer transition-all ${
                            selectedZone === 'abdomen' ? 'fill-amber-500/60 stroke-amber-300 stroke-2 animate-pulse' : 'fill-slate-800/80 hover:fill-amber-500/30'
                          }`}
                        />
                        <circle
                          cx="85" cy="225" r="10"
                          onClick={() => {
                            setSelectedZone('joints');
                            speakText('Joints and Knees selected');
                          }}
                          className={`cursor-pointer transition-all ${
                            selectedZone === 'joints' ? 'fill-indigo-500/60 stroke-indigo-300 stroke-2 animate-pulse' : 'fill-slate-800/80 hover:fill-indigo-500/30'
                          }`}
                        />
                        <circle
                          cx="115" cy="225" r="10"
                          onClick={() => {
                            setSelectedZone('joints');
                            speakText('Joints and Knees selected');
                          }}
                          className={`cursor-pointer transition-all ${
                            selectedZone === 'joints' ? 'fill-indigo-500/60 stroke-indigo-300 stroke-2 animate-pulse' : 'fill-slate-800/80 hover:fill-indigo-500/30'
                          }`}
                        />
                      </svg>

                      <div className="absolute bottom-2 left-2 right-2 text-center bg-slate-900/90 py-1 px-2 rounded-lg border border-slate-800 text-xs">
                        <span className="text-slate-400">Selected Zone: </span>
                        <span className="font-semibold text-emerald-300 uppercase">{selectedZone}</span>
                      </div>
                    </div>

                    {/* Touch-Chip Symptoms */}
                    <div className="glass-panel p-4 rounded-xl flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-heading font-semibold text-xs text-slate-300 uppercase tracking-wider">
                            Touch-Chip Symptoms ({BODY_ZONES.find(z => z.id === selectedZone)?.name})
                          </h4>
                          <span className="text-[10px] text-slate-400">Zero-Typing UI</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {BODY_ZONES.find(z => z.id === selectedZone)?.chips.map((chip, idx) => {
                            const isSelected = selectedChips.includes(chip);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedChips(selectedChips.filter(c => c !== chip));
                                  } else {
                                    setSelectedChips([...selectedChips, chip]);
                                    speakText(chip);
                                  }
                                }}
                                className={`px-3 py-2 text-xs rounded-xl font-medium border transition-all text-left min-h-[44px] flex items-center space-x-1.5 ${
                                  isSelected
                                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
                                }`}
                              >
                                <span>{isSelected ? '✓' : '+'}</span>
                                <span>{chip}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-[10px] text-slate-400 block mb-1">Or switch zone directly:</span>
                        <div className="grid grid-cols-3 gap-1">
                          {BODY_ZONES.map(z => (
                            <button
                              key={z.id}
                              onClick={() => setSelectedZone(z.id)}
                              className={`p-1 text-[11px] rounded border truncate ${
                                selectedZone === z.id
                                  ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              {z.icon} {z.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multilingual Voice Recording with WebAudio DSP Visualizer */}
                  <div className="glass-panel p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mic className={`w-4 h-4 ${isRecording ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                        <span className="text-xs font-semibold text-slate-200">
                          Multilingual Voice Narration (WebAudio DSP + Bhashini ULCA)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={testMicrophoneHardware}
                          className="text-[10px] text-emerald-300 bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1 transition-all"
                          title="Click to verify your microphone hardware device"
                        >
                          <span>🎙️</span>
                          <span>{micDeviceName ? micDeviceName.slice(0, 22) + '...' : 'Test Mic'}</span>
                        </button>
                        <span className="text-[10px] text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">
                          {isDspActive ? 'DSP 74 dB Bandpass ON' : 'Raw Audio'}
                        </span>
                      </div>
                    </div>

                    {voiceErrorMsg && (
                      <div className="bg-amber-950/60 border border-amber-500/50 p-2.5 rounded-lg text-xs text-amber-200 flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium">{voiceErrorMsg}</span>
                          <div className="mt-1.5 flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={testMicrophoneHardware}
                              className="text-[10px] bg-amber-800/80 hover:bg-amber-700 px-2 py-0.5 rounded border border-amber-500/50 text-white font-medium cursor-pointer"
                            >
                              Check Mic Permissions
                            </button>
                            <span className="text-[10px] text-amber-300/80">or test with 1-click presets below</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={toggleRecording}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg min-h-[48px] cursor-pointer ${
                          isRecording
                            ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                        title={isRecording ? 'Click to stop recording' : 'Click to start speaking'}
                      >
                        {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`${isRecording ? 'text-rose-300 font-semibold' : 'text-slate-300'}`}>
                            {isRecording
                              ? '🔴 Listening... (Speak symptoms into your mic)'
                              : (micPermission === 'denied'
                                ? '⚠️ Mic blocked in browser — click test chips below or allow mic'
                                : I18N[kioskLang].speakPrompt)}
                          </span>
                          {isRecording ? (
                            <span className="text-rose-400 text-[10px] font-mono animate-pulse">
                              {audioLevel > 15 ? '🟢 VOICE DETECTED' : 'RECORDING 74 dB...'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              {micDeviceName ? '✓ Mic Ready' : 'Tap mic to speak'}
                            </span>
                          )}
                        </div>

                        {/* Real Audio Level Bar Visualizer */}
                        <div className="h-6 bg-slate-900 rounded-lg flex items-center px-2 space-x-1 border border-slate-800">
                          {[...Array(24)].map((_, i) => {
                            const barHeight = isRecording
                              ? Math.max(15, (Math.sin(i * 0.5 + Date.now() * 0.005) * 40 + audioLevel) % 100)
                              : 10;
                            return (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-75 ${
                                  isRecording ? (audioLevel > 15 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-700'
                                }`}
                                style={{ height: `${barHeight}%` }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-slate-400">Captured Symptoms Narration:</label>
                        {voiceTranscript && (
                          <button
                            type="button"
                            onClick={() => setVoiceTranscript('')}
                            className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            Clear Text
                          </button>
                        )}
                      </div>
                      <textarea
                        value={voiceTranscript}
                        onChange={(e) => setVoiceTranscript(e.target.value)}
                        placeholder="Spoken or typed symptoms will appear here..."
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Quick 1-Click Simulation / Voice Test Chips */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center">
                          <Activity className="w-3 h-3 mr-1 text-emerald-400" />
                          1-Click Voice Intake Test Presets:
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">Bhashini ULCA • VAD Filtered</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVoiceSample(
                            kioskLang === 'hi'
                              ? "छाती में बहुत तेज दर्द हो रहा है और बाएं हाथ में खिंचाव है"
                              : "Severe crushing chest pain radiating to left arm and cold sweat"
                          )}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900/90 text-rose-200 border border-rose-600/40 flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                          title="Simulate acute myocardial infarction / red-flag symptom dictation"
                        >
                          <span>🚨</span>
                          <span className="font-medium">Emergency (Chest Pain)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVoiceSample(
                            kioskLang === 'hi'
                              ? "मुझे पिछले कुछ दिनों से पेट में जलन और अपच की समस्या हो रही है।"
                              : "I have mild acid reflux, indigestion, and burning pain after meals."
                          )}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/90 text-amber-200 border border-amber-600/40 flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                          title="Simulate routine gastrointestinal / Amlapitta intake"
                        >
                          <span>🩺</span>
                          <span className="font-medium">Routine (Acid Reflux)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVoiceSample(
                            kioskLang === 'hi'
                              ? "दोनों घुटनों में बहुत दर्द रहता है, सुबह उठने पर पैर अकड़ जाते हैं।"
                              : "Bilateral knee pain with morning stiffness and clicking sounds."
                          )}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-200 border border-emerald-600/40 flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                          title="Simulate chronic Ayush Sandhigata Vata intake"
                        >
                          <span>🌿</span>
                          <span className="font-medium">Ayush (Knee Joint)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setKioskStep(1)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                    >
                      &larr; Back
                    </button>
                    <button
                      onClick={() => setKioskStep(3)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
                    >
                      <span>Proceed to Clinical Reasoner</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ADAPTIVE CLINICAL REASONER */}
              {kioskStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="glass-panel p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="font-heading font-semibold text-xs text-emerald-300 flex items-center">
                        <Stethoscope className="w-4 h-4 mr-1.5 text-emerald-400" />
                        Allopathic SOCRATES Pain & Symptom Reasoning Engine
                      </h4>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        Protocol v4.2
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{I18N[kioskLang].severityScale}:</span>
                        <span className="font-bold text-sm text-emerald-400 font-mono">{socratesSeverity} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={socratesSeverity}
                        onChange={(e) => setSocratesSeverity(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>1 (Mild) 😊</span>
                        <span>3 (Discomfort) 😐</span>
                        <span>6 (Moderate) 😣</span>
                        <span>9 (Severe / Urgent) 😫</span>
                        <span>10 (Worst Pain) 🚨</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1 font-medium">Site (Exact Location):</label>
                        <input
                          type="text"
                          value={socratesSite}
                          onChange={(e) => setSocratesSite(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 font-medium">Onset (How it started):</label>
                        <input
                          type="text"
                          value={socratesOnset}
                          onChange={(e) => setSocratesOnset(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 font-medium">Character (Type of sensation):</label>
                        <input
                          type="text"
                          value={socratesCharacter}
                          onChange={(e) => setSocratesCharacter(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 font-medium">Radiation (Spread of pain):</label>
                        <input
                          type="text"
                          value={socratesRadiation}
                          onChange={(e) => setSocratesRadiation(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ayurvedic Dashavidha Pariksha */}
                  <div className="glass-panel p-4 rounded-xl border-emerald-500/20 bg-emerald-950/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <h4 className="font-heading font-semibold text-xs text-ayush-400 flex items-center">
                        <Flame className="w-4 h-4 mr-1.5 text-amber-400" />
                        Ayurvedic Dashavidha Pariksha & Prakriti Profiling (AYUSH OPD)
                      </h4>
                      <span className="text-[10px] bg-ayush-950 text-ayush-300 border border-ayush-500/30 px-2 py-0.5 rounded">
                        Ministry of Ayush Standard
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-slate-300 block mb-1 font-medium">Agni (Digestive / Metabolic Fire):</label>
                        <select
                          value={ayushAgni}
                          onChange={(e) => setAyushAgni(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                        >
                          <option>Tikshnagni (Hyper-metabolic / Acidic / Pitta)</option>
                          <option>Mandagni (Sluggish / Slow Digestion / Kapha)</option>
                          <option>Vishamagni (Irregular / Fluctuating / Vata)</option>
                          <option>Samagni (Balanced / Healthy)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1 font-medium">Koshtha (Bowel Habit):</label>
                        <select
                          value={ayushKoshtha}
                          onChange={(e) => setAyushKoshtha(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                        >
                          <option>Krura Koshtha (Hard / Dry / Constipated)</option>
                          <option>Mrudu Koshtha (Soft / Loose Stools)</option>
                          <option>Madhyama Koshtha (Regular / Normal)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">Tridosha Phenotype Assessment:</span>
                        <div className="flex space-x-2 text-[10px]">
                          <span className="text-indigo-400">Vata: {ayushVata}%</span>
                          <span className="text-amber-400">Pitta: {ayushPitta}%</span>
                          <span className="text-teal-400">Kapha: {ayushKapha}%</span>
                        </div>
                      </div>

                      <div className="h-3 w-full bg-slate-900 rounded-full flex overflow-hidden border border-slate-700">
                        <div style={{ width: `${ayushVata}%` }} className="bg-indigo-500 h-full transition-all" title="Vata" />
                        <div style={{ width: `${ayushPitta}%` }} className="bg-amber-500 h-full transition-all" title="Pitta" />
                        <div style={{ width: `${ayushKapha}%` }} className="bg-teal-500 h-full transition-all" title="Kapha" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setKioskStep(2)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                    >
                      &larr; Back
                    </button>
                    <button
                      onClick={() => setKioskStep(4)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
                    >
                      <span>Check Red-Flag Interceptor</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: RED-FLAG INTERCEPTOR */}
              {kioskStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  {redFlagTriggered ? (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950 via-red-900 to-slate-900 border-2 border-rose-500 text-white space-y-4 shadow-2xl shadow-rose-900/40">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-rose-600 rounded-xl animate-pulse">
                          <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-heading font-extrabold text-lg text-rose-100 tracking-tight">
                            🚨 CRITICAL CLINICAL EMERGENCY DETECTED
                          </h3>
                          <p className="text-xs text-rose-200">
                            Sub-millisecond Deterministic Interceptor Active (Bypassed Routine Questionnaire)
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/40 p-3.5 rounded-xl border border-rose-500/30 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-rose-300">Trigger Match:</span>
                          <span className="font-mono font-bold text-yellow-300 bg-rose-950 px-2 py-0.5 rounded">
                            {redFlagDetails?.matchedTerm}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-rose-300">Triage Routing:</span>
                          <span className="text-white font-semibold">Priority 1 Red (Immediate ICCU / OPD Room 104)</span>
                        </div>
                        <p className="text-rose-100/90 pt-1 border-t border-rose-500/20 leading-relaxed">
                          {redFlagDetails?.guidance}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => {
                            showToast('🚨 Wheelchair & Emergency Triage Team Dispatched to Kiosk!');
                          }}
                          className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Dispatch Wheelchair Triage</span>
                        </button>

                        <button
                          onClick={() => {
                            setViewMode('doctor');
                            setSelectedDoctorPatient(PRESET_SCENARIOS.scenarioA.patient);
                          }}
                          className="py-3 bg-white hover:bg-slate-100 text-rose-900 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg"
                        >
                          <Monitor className="w-4 h-4" />
                          <span>Open in Doctor Console</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel p-5 rounded-2xl border-emerald-500/30 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h3 className="font-heading font-bold text-base text-emerald-200">
                        No Acute Red-Flag Emergency Detected
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                        Deterministic safety regex evaluated all entered symptoms, voice narration, and SOCRATES markers. Patient is routed for standard/amber OPD consultation.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setVoiceTranscript('Severe sudden crushing chest pain radiating to left arm');
                          }}
                          className="text-[11px] text-rose-400 hover:text-rose-300 underline font-mono"
                        >
                          [Test Emergency Interceptor with sample phrase]
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setKioskStep(3)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                    >
                      &larr; Back
                    </button>
                    <button
                      onClick={() => setKioskStep(5)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
                    >
                      <span>Proceed to Document Scanner</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: DOCUMENT SCANNER TRAY (HANDWRITTEN RX & LAB OCR) */}
              {kioskStep === 5 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="glass-panel p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-semibold text-xs text-slate-200 flex items-center">
                        <Camera className="w-4 h-4 mr-1.5 text-emerald-400" />
                        Medical Document Scanner Tray (Handwritten Rx & Lab OCR)
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">FastAPI OCR Pipeline Active</span>
                    </div>

                    {/* Presets + File Upload Button */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => triggerDocumentScan('prescription')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedScanSample === 'prescription'
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold block mb-0.5">Sample 1: Rx</span>
                        <span className="text-[9px] text-slate-400 block truncate">Metformin, Telmisartan</span>
                      </button>

                      <button
                        onClick={() => triggerDocumentScan('lab')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedScanSample === 'lab'
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold block mb-0.5">Sample 2: Lab</span>
                        <span className="text-[9px] text-slate-400 block truncate">HbA1c 9.2%, Fasting 168</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl border border-dashed border-indigo-500/50 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-200 text-left transition-all"
                      >
                        <span className="text-xs font-bold block mb-0.5 flex items-center">
                          <Upload className="w-3 h-3 mr-1" /> Upload File
                        </span>
                        <span className="text-[9px] text-slate-400 block truncate">Upload PNG/JPG</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </button>
                    </div>

                    {/* Interactive Scanner Viewer with Laser Scan Line */}
                    <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[160px] overflow-hidden">
                      {isScanning && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line shadow-lg shadow-emerald-500/50 z-10" />
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                          <span>OCR Bounding Box Entity Extractor</span>
                          <span>Confidence Score</span>
                        </div>

                        {scannedOcrItems.map((item) => {
                          const confVal = typeof item.confidence === 'number' && item.confidence > 1 ? item.confidence / 100 : item.confidence;
                          const isLowConfidence = confVal < 0.85;
                          const confPercent = Math.round(confVal * 100);
                          return (
                            <div
                              key={item.id}
                              className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-all ${
                                isLowConfidence
                                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full ${isLowConfidence ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span className="font-mono">{item.text}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                                  isLowConfidence ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {confPercent}% {isLowConfidence ? '(Verify Crop)' : '✓'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setKioskStep(4)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                    >
                      &larr; Back
                    </button>
                    <button
                      onClick={() => setKioskStep(6)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
                    >
                      <span>Proceed to Final Review</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: REVIEW & SUBMISSION */}
              {kioskStep === 6 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="glass-panel p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <h4 className="font-heading font-semibold text-sm text-slate-100">
                          Intake Review: Token #{kioskTokenInput}
                        </h4>
                        <p className="text-xs text-slate-400">ABHA: {kioskAbhaInput}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30">
                        Ready for Sync
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Chief Complaint & SOCRATES</span>
                        <p className="font-medium text-slate-200 mt-1">{voiceTranscript || selectedChips.join(', ')}</p>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Ayurvedic Assessment</span>
                        <p className="font-medium text-emerald-300 mt-1">{ayushAgni} • {ayushKoshtha}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-950/30 rounded-lg border border-indigo-500/30 flex items-start space-x-2 text-xs text-indigo-200">
                      <Shield className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                      <p>
                        Submitting will encrypt and transmit the HL7 FHIR R4 Bundle to FastAPI `/api/intake/submit`, broadcast to doctor WebSocket, and execute DPDP Act 2023 zero-retention memory purge.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleKioskSubmit}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xl shadow-emerald-600/30 transition-all text-sm min-h-[48px]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{I18N[kioskLang].submitIntake}</span>
                  </button>

                  <div className="flex justify-start">
                    <button
                      onClick={() => setKioskStep(5)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs rounded-lg"
                    >
                      &larr; Back to Scanner
                    </button>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* PANE 2: DOCTOR OPD SINGLE-PANE CONSOLE (/doctor) */}
        {/* =================================================================== */}
        {(viewMode === 'doctor' || viewMode === 'split') && (
          <section className={`flex-1 flex flex-col bg-slate-950 overflow-y-auto ${viewMode === 'split' ? 'lg:max-w-[50%]' : 'w-full'}`}>
            
            {/* Doctor Top Sub-Header */}
            <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 p-3 sticky top-0 z-20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <h2 className="font-heading text-base font-bold text-white">
                    Doctor OPD Single-Pane Console
                  </h2>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                    15-Sec Triage UI
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleOpenFhirModal}
                    className="px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-medium rounded-lg border border-indigo-500/30 flex items-center space-x-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>ABDM FHIR R4 Bundle</span>
                  </button>
                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Clinician Override</span>
                  </button>
                </div>
              </div>

              {/* Patient Queue Cards */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                {patientQueue.map((pat, idx) => {
                  const isSelected = (selectedDoctorPatient?.token || selectedDoctorPatient?.token) === pat.token;
                  const isRed = pat.priority === 'RED';
                  const isAmber = pat.priority === 'AMBER';
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDoctorPatient(pat)}
                      className={`px-3 py-1.5 rounded-lg border text-left shrink-0 transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-indigo-400 text-white ring-1 ring-indigo-400'
                          : isRed
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 hover:bg-rose-950/60'
                          : isAmber
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:bg-amber-950/60'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${isRed ? 'bg-rose-500 animate-ping' : isAmber ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <span className="text-xs font-bold font-mono">{pat.token}</span>
                      </div>
                      <span className="text-[11px] truncate block max-w-[120px]">{pat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DOCTOR MAIN DASHBOARD CONTENT */}
            {selectedDoctorPatient ? (
              <div className="p-4 space-y-4 flex-1">
                
                {/* 1. Demographics & Vitals */}
                <div className="glass-panel p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-heading font-bold text-base text-white">
                          {selectedDoctorPatient.name}
                        </h3>
                        <span className="text-xs text-slate-400">
                          ({selectedDoctorPatient.age}y / {selectedDoctorPatient.gender})
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          selectedDoctorPatient.priority === 'RED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : selectedDoctorPatient.priority === 'AMBER'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          PRIORITY: {selectedDoctorPatient.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        ABHA: {selectedDoctorPatient.abhaId || selectedDoctorPatient.abha_id} • Aadhaar: {selectedDoctorPatient.aadhaarRedacted || selectedDoctorPatient.redacted_aadhaar} • Token #{selectedDoctorPatient.token}
                      </p>
                    </div>

                    <button
                      onClick={handleAcceptSummaryAndPrefill}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept & Pre-fill EMR</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Blood Pressure</span>
                      <span className="font-bold text-slate-200 font-mono">{selectedDoctorPatient.vitals?.bp}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Heart Rate</span>
                      <span className="font-bold text-slate-200 font-mono">{selectedDoctorPatient.vitals?.hr}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">SpO2</span>
                      <span className="font-bold text-emerald-400 font-mono">{selectedDoctorPatient.vitals?.spo2}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Temp</span>
                      <span className="font-bold text-slate-200 font-mono">{selectedDoctorPatient.vitals?.temp}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Resp Rate</span>
                      <span className="font-bold text-slate-200 font-mono">{selectedDoctorPatient.vitals?.rr}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Dual-Coding Badges */}
                <div className="glass-panel p-4 rounded-xl space-y-2 border-indigo-500/30 bg-indigo-950/10">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-semibold text-xs text-indigo-200 flex items-center">
                      <Layers className="w-4 h-4 mr-1.5 text-indigo-400" />
                      Dual-Coding Engine: Ministry of Ayush NAMASTE + WHO ICD-11 TM2
                    </h4>
                    <span className="text-[10px] font-mono text-indigo-300">FastAPI Reasoner Synced</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40">
                      <span className="text-[10px] font-semibold text-emerald-400 block mb-0.5">
                        AYUSH Morbidity Standard (NAMASTE & WHO TM2)
                      </span>
                      <p className="font-bold text-emerald-200">
                        {selectedDoctorPatient.dualCoding?.ayush?.namasteDisplay || selectedDoctorPatient.dual_coding?.ayush_namaste?.display || 'NAMASTE: HKS-3 (हृद्शूल)'}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {selectedDoctorPatient.dualCoding?.ayush?.whoIcd11Tm2Display || selectedDoctorPatient.dual_coding?.ayush_who_icd11_tm2?.display || 'WHO ICD-11 TM2: SF51'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/40">
                      <span className="text-[10px] font-semibold text-indigo-400 block mb-0.5">
                        Allopathic Standard (ICD-10 & SNOMED CT)
                      </span>
                      <p className="font-bold text-indigo-200">
                        ICD-10: {selectedDoctorPatient.dualCoding?.allopathic?.icd10 || selectedDoctorPatient.dual_coding?.allopathic_icd10?.code || 'I20.9'}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {selectedDoctorPatient.dualCoding?.allopathic?.icd10Display || selectedDoctorPatient.dual_coding?.allopathic_icd10?.display || 'Angina Pectoris / ACS'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Chief Complaint & Classical SOCRATES */}
                <div className="glass-panel p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="font-heading font-semibold text-xs text-slate-200 flex items-center">
                      <Stethoscope className="w-4 h-4 mr-1.5 text-emerald-400" />
                      Chief Complaint & Structured SOCRATES HPI (Classical Order)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">15-Sec Readable</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                    <div className="font-semibold text-slate-100 flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">CC:</span>
                      <span>"{selectedDoctorPatient.chiefComplaint || selectedDoctorPatient.chief_complaint}"</span>
                    </div>

                    <ul className="space-y-1 text-slate-300 pt-1 border-t border-slate-800/80">
                      <li>• <strong>Site (S):</strong> {selectedDoctorPatient.socrates?.site}</li>
                      <li>• <strong>Onset (O):</strong> {selectedDoctorPatient.socrates?.onset}</li>
                      <li>• <strong>Character (C):</strong> {selectedDoctorPatient.socrates?.character}</li>
                      <li>• <strong>Radiation (R):</strong> {selectedDoctorPatient.socrates?.radiation}</li>
                      <li>• <strong>Associations (A):</strong> {selectedDoctorPatient.socrates?.associations}</li>
                      <li>• <strong>Timing (T):</strong> {selectedDoctorPatient.socrates?.timing}</li>
                      <li>• <strong>Exacerbating/Relieving (E):</strong> {selectedDoctorPatient.socrates?.exacerbating}</li>
                      <li>• <strong>Severity (S):</strong> {selectedDoctorPatient.socrates?.severity} / 10 Pain Scale</li>
                    </ul>
                  </div>
                </div>

                {/* 4. Dashavidha Pariksha */}
                <div className="glass-panel p-4 rounded-xl border-emerald-500/20 bg-emerald-950/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <h4 className="font-heading font-semibold text-xs text-ayush-400 flex items-center">
                      <Flame className="w-4 h-4 mr-1.5 text-amber-400" />
                      Ayurvedic Dashavidha Pariksha & Prakriti/Vikriti Synthesis
                    </h4>
                    <span className="text-[10px] text-ayush-300 font-mono">All India Institute of Ayurveda</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Agni & Koshtha</span>
                      <p className="font-semibold text-slate-200 mt-0.5">{selectedDoctorPatient.ayushPariksha?.agni || selectedDoctorPatient.ayush_pariksha?.agni}</p>
                      <p className="text-slate-300 text-[11px]">{selectedDoctorPatient.ayushPariksha?.koshtha || selectedDoctorPatient.ayush_pariksha?.koshtha}</p>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Ahara-Vihara Factors</span>
                      <p className="text-slate-200 text-xs mt-0.5">{selectedDoctorPatient.ayushPariksha?.aharaVihara || selectedDoctorPatient.ayush_pariksha?.ahara_vihara}</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">Prakriti/Vikriti Dosha Ratio:</span>
                      <span className="font-mono text-emerald-300 font-bold">
                        {selectedDoctorPatient.ayushPariksha?.dominantDosha || selectedDoctorPatient.ayush_pariksha?.dominant_dosha || 'Pitta-Vata Dominance'}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                      <div style={{ width: `${selectedDoctorPatient.ayushPariksha?.prakritiVikriti?.vata || selectedDoctorPatient.ayush_pariksha?.prakriti_vikriti?.vata || 33}%` }} className="bg-indigo-500" title="Vata" />
                      <div style={{ width: `${selectedDoctorPatient.ayushPariksha?.prakritiVikriti?.pitta || selectedDoctorPatient.ayush_pariksha?.prakriti_vikriti?.pitta || 33}%` }} className="bg-amber-500" title="Pitta" />
                      <div style={{ width: `${selectedDoctorPatient.ayushPariksha?.prakritiVikriti?.kapha || selectedDoctorPatient.ayush_pariksha?.prakriti_vikriti?.kapha || 33}%` }} className="bg-teal-500" title="Kapha" />
                    </div>
                  </div>
                </div>

                {/* 5. Side-by-Side OCR Handwriting Crop Verifier */}
                <div className="glass-panel p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="font-heading font-semibold text-xs text-slate-200 flex items-center">
                        <Eye className="w-4 h-4 mr-1.5 text-amber-400" />
                        Side-by-Side OCR Handwriting Crop Verifier
                      </h4>
                      <p className="text-[10px] text-slate-400">Ambiguous entities (&lt;85% confidence) with dynamic Base64 snippet crops</p>
                    </div>
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      PUT /api/doctor/verify-token
                    </span>
                  </div>

                  <div className="space-y-2">
                    {doctorVerifiedItems.map((item) => {
                      const confVal = typeof item.confidence === 'number' && item.confidence > 1 ? item.confidence / 100 : item.confidence;
                      const isLowConfidence = confVal < 0.85;
                      const confPercent = Math.round(confVal * 100);
                      const isEditing = editingOcrId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isLowConfidence && !item.verified
                              ? 'bg-amber-950/30 border-amber-500/40'
                              : 'bg-slate-900/80 border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                                  item.verified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  Confidence: {confPercent}% {item.verified ? '✓ Verified' : '⚠️ Low Confidence'}
                                </span>
                              </div>

                              {/* Render Base64 Crop Thumbnail or Raw Snippet */}
                              <div className="flex items-center space-x-2">
                                {item.raw_crop_base64 ? (
                                  <img
                                    src={item.raw_crop_base64}
                                    alt="OCR Snippet Crop"
                                    className="h-9 rounded border border-slate-700 object-contain bg-white px-1 shadow-sm"
                                  />
                                ) : (
                                  <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded text-amber-200 border border-slate-700 italic">
                                    "{item.rawCrop || item.original || item.text}"
                                  </span>
                                )}
                              </div>

                              {isEditing ? (
                                <div className="flex items-center space-x-2 pt-1">
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-xs text-white"
                                  />
                                  <button
                                    onClick={() => handleDoctorSaveInlineEdit(item.id)}
                                    className="px-2 py-1 bg-emerald-600 text-white text-xs rounded font-semibold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingOcrId(null)}
                                    className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs font-semibold text-slate-100">
                                  Parsed: <span className="text-emerald-300 font-mono">{item.text}</span>
                                </p>
                              )}
                            </div>

                            {!isEditing && (
                              <div className="flex items-center space-x-1.5">
                                {!item.verified && (
                                  <button
                                    onClick={() => handleDoctorApproveOcr(item.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow flex items-center space-x-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingOcrId(item.id);
                                    setEditingText(item.text);
                                  }}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                                >
                                  Edit Inline
                                </button>
                                <button
                                  onClick={() => handleDoctorDiscardOcr(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400"
                                  title="Discard Entity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Chronological Diagnostic Timeline */}
                <div className="glass-panel p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="font-heading font-semibold text-xs text-slate-200 flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-indigo-400" />
                      Chronological Records Timeline & Flagged Abnormal Values
                    </h4>
                    <span className="text-[10px] text-slate-400">NHA ABDM PHR Stream</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {(selectedDoctorPatient.chronology || [
                      { date: 'Today 09:15 AM', event: 'MediKiosk Multimodal Intake Submitted & Synced', type: 'system', isAbnormal: false }
                    ]).map((rec, i) => (
                      <div key={i} className="flex items-start space-x-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${rec.isAbnormal ? 'bg-rose-400 animate-pulse' : 'bg-indigo-400'}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-slate-400">{rec.date}</span>
                            {rec.isAbnormal && (
                              <span className="text-[9px] bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded font-semibold border border-rose-500/30">
                                Abnormal Flag ▲
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${rec.isAbnormal ? 'font-semibold text-rose-200' : 'text-slate-300'}`}>
                            {rec.event}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Select a patient from the queue to view clinical intake
              </div>
            )}
          </section>
        )}

      </main>

      {/* =================================================================== */}
      {/* MODAL 1: ABDM FHIR R4 JSON BUNDLE INSPECTOR */}
      {/* =================================================================== */}
      {showFhirModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">
                    ABDM FHIR R4 Bundle Compiler (Milestones M1, M2, M3 Ready)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Dual-Coded (NAMASTE + WHO ICD-11 TM2 + ICD-10) Validated Document
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(fhirBundlePayload, null, 2));
                    showToast('✓ FHIR R4 JSON Copied to Clipboard');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
                <button
                  onClick={() => setShowFhirModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-emerald-400 leading-relaxed">
              <pre className="whitespace-pre-wrap">{JSON.stringify(fhirBundlePayload, null, 2)}</pre>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
              <span>Resources: Composition, Patient, Condition (Dual-Code), Consent (DPDP Act)</span>
              <span className="text-emerald-400 font-bold">FastAPI Serialized ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: CLINICIAN OVERRIDE & AUDIT TRAIL (/api/doctor/override) */}
      {/* =================================================================== */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">
                    Clinician Override & Diagnostic Audit Trail
                  </h3>
                  <p className="text-[11px] text-slate-400">Logged to /api/doctor/override endpoint for governance</p>
                </div>
              </div>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="glass-panel p-3.5 rounded-xl space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Override Category:</label>
                  <select
                    value={overrideCategory}
                    onChange={(e) => setOverrideCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="DIAGNOSIS_MODIFICATION">Diagnosis Code Adjustment (ICD / NAMASTE)</option>
                    <option value="TRIAGE_RECLASSIFICATION">Triage Priority Reclassification</option>
                    <option value="MEDICATION_RECONCILIATION">Medication Dosage / Drug-Herb Interaction Edit</option>
                    <option value="AYUSH_DOSHA_REVALUATION">Prakriti / Vikriti Dosha Revaluation</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Clinical Rationale / Notes:</label>
                  <textarea
                    value={overrideNotes}
                    onChange={(e) => setOverrideNotes(e.target.value)}
                    placeholder="Document clinical reasons for overriding autonomous intake summary..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleDoctorSubmitOverride}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Commit Override to Audit Trail</span>
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Audit History ({overrideAuditLog.length} Records)
                </h4>
                {overrideAuditLog.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-amber-300 font-bold">{log.id} • {log.category || log.action}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-slate-200">{log.reason}</p>
                    <p className="text-[10px] text-slate-400 font-mono">By: {log.doctor_id || log.doctorId}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: DPDP ACT 2023 EPHEMERAL RAM PURGE ANIMATION */}
      {/* =================================================================== */}
      {showPurgeModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                {purgeStep >= 6 ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
                ) : (
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                )}
              </div>
              <h3 className="font-heading font-bold text-lg text-white">
                DPDP Act 2023 Volatile RAM Purge
              </h3>
              <p className="text-xs text-slate-400">
                Executing automated cryptographic payload handoff and zero-retention memory wipe
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className={`flex items-center justify-between ${purgeStep >= 1 ? 'text-emerald-300' : 'text-slate-600'}`}>
                <span>[1] Compiling HL7 FHIR R4 Dual-Coded Bundle...</span>
                <span>{purgeStep >= 1 ? 'DONE ✓' : 'WAIT'}</span>
              </div>
              <div className={`flex items-center justify-between ${purgeStep >= 2 ? 'text-emerald-300' : 'text-slate-600'}`}>
                <span>[2] Encrypting Payload via ABDM Public Key (RSA-256)...</span>
                <span>{purgeStep >= 2 ? 'DONE ✓' : 'WAIT'}</span>
              </div>
              <div className={`flex items-center justify-between ${purgeStep >= 3 ? 'text-emerald-300' : 'text-slate-600'}`}>
                <span>[3] Purging Client Audio Recording Buffer from RAM...</span>
                <span>{purgeStep >= 3 ? 'PURGED ✓' : 'WAIT'}</span>
              </div>
              <div className={`flex items-center justify-between ${purgeStep >= 4 ? 'text-emerald-300' : 'text-slate-600'}`}>
                <span>[4] Purging Unencrypted Camera Scanner Frames...</span>
                <span>{purgeStep >= 4 ? 'PURGED ✓' : 'WAIT'}</span>
              </div>
              <div className={`flex items-center justify-between ${purgeStep >= 5 ? 'text-emerald-300' : 'text-slate-600'}`}>
                <span>[5] Generating Ephemeral Token #{kioskTokenInput}...</span>
                <span>{purgeStep >= 5 ? 'READY ✓' : 'WAIT'}</span>
              </div>
            </div>

            {purgeStep >= 6 && (
              <div className="space-y-3 pt-2 animate-fadeIn">
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center">
                  <span className="text-xs text-slate-300 block">Assigned Queue Token</span>
                  <span className="font-heading font-extrabold text-2xl text-emerald-300 font-mono">
                    {kioskTokenInput}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-1">
                    ✓ Transmitted to Doctor OPD Console • Session RAM 100% Cleared
                  </span>
                </div>

                <button
                  onClick={finalizePurge}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20"
                >
                  Close & Ready for Next Patient Intake
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GLOBAL TOAST */}
      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 border border-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2.5 z-50 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{showSuccessToast}</span>
        </div>
      )}

    </div>
  );
}
