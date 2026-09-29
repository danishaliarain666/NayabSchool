@echo off
title Nayab SMS - Frontend
cd /d "%~dp0frontend"
set "PATH=%PATH%;C:\Program Files\nodejs"
echo Starting Frontend on http://localhost:5173
npm run dev
if errorlevel 1 (
  echo.
  echo ERROR: Frontend failed to start. Run: cd frontend ^&^& npm install
  pause
)
