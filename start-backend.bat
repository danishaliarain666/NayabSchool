@echo off
title Nayab SMS - Backend API
cd /d "%~dp0backend"
set "PATH=%PATH%;C:\Program Files\nodejs"

if not defined DB_PORT (
  set "DB_PORT=3306"
  netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
  if errorlevel 1 set "DB_PORT=3307"
)

echo Starting Backend API on http://localhost:5000
echo MySQL port: %DB_PORT% ^(DB nayab_sms^)
set "DB_PORT=%DB_PORT%"
npm run dev
if errorlevel 1 (
  echo.
  echo ERROR: Backend failed to start. Run: cd backend ^&^& npm install
  pause
)
