"""
MediKiosk Backend Configuration
Smart India Hackathon 2026 - Problem Statement 26047
Ministry of Ayush / All India Institute of Ayurveda (AIIA)
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "MediKiosk Autonomous First-Mile Intake API"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # NHA ABDM Gateway Configuration (Sandbox)
    ABDM_GATEWAY_URL: str = "https://dev.abdm.gov.in/gateway"
    ABDM_CLIENT_ID: str = "AIIA_MEDIKIOSK_SANDBOX_2026"
    
    # Ministry of Ayush NAMASTE Portal Endpoint
    NAMASTE_PORTAL_URL: str = "https://namstp.ayush.gov.in"
    
    # OCR Confidence Threshold for Flagging Human Verification
    OCR_CONFIDENCE_THRESHOLD: float = 0.85
    
    # Allowed CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
