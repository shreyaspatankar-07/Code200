# MediKiosk Concurrent Dev Runner (PowerShell)
# Starts FastAPI Backend (Port 8000) & Vite React Frontend (Port 3000)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting MediKiosk: Autonomous Clinical Intake & AYUSH " -ForegroundColor Green
Write-Host " Ministry of Ayush / AIIA • SIH 2026 Problem Statement 26047" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Start FastAPI in background job
Write-Host "Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload" -PassThru

# Start Vite Frontend
Write-Host "Starting Vite Frontend on http://localhost:3000 ..." -ForegroundColor Green
npm run dev

# Cleanup on exit
Stop-Process -Id $backendProcess.Id -Force
