@echo off
title Nayab SMS - Production (single port 5000)
cd /d "%~dp0"
set "PATH=%PATH%;C:\Program Files\nodejs"

if not defined DB_PORT (
  set "DB_PORT=3306"
  netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
  if errorlevel 1 set "DB_PORT=3307"
)

echo Building frontend...
cd frontend
call npm run build
if errorlevel 1 exit /b 1
cd ..

echo.
echo Starting API + website on http://127.0.0.1:5000
echo MySQL port: %DB_PORT%
set "DB_PORT=%DB_PORT%"
set "NODE_ENV=production"
set "SERVE_FRONTEND=1"
cd backend
node src/server.js
