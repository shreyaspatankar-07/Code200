#!/usr/bin/env bash
# MediKiosk Concurrent Dev Runner (Bash)
# Launches FastAPI Backend (Port 8000) and Vite React Frontend (Port 3000)

echo "=========================================================="
echo " Starting MediKiosk: Autonomous Clinical Intake & AYUSH "
echo " Ministry of Ayush / AIIA • SIH 2026 Problem Statement 26047"
echo "=========================================================="

# Trap SIGINT to terminate background jobs cleanly
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# Start FastAPI Backend
echo "Starting FastAPI Backend on http://localhost:8000 ..."
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &

# Start Vite Frontend
echo "Starting Vite Frontend on http://localhost:3000 ..."
npm run dev
