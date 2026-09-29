@echo off
title Nayab SMS - Start Website (XAMPP MySQL)
cd /d "%~dp0"

echo ============================================
echo  Nayab Grammar School SMS - Mirwah
echo  Database folder: xamp-database\
echo ============================================
echo.

set "PATH=%PATH%;C:\Program Files\nodejs"

:: Prefer XAMPP MySQL (3306). Fallback: project mysql-data (3307).
set "MYSQL_PORT=3306"
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
  set "MYSQL_PORT=3307"
  tasklist /FI "IMAGENAME eq mysqld.exe" 2>nul | find /I "mysqld.exe" >nul
  if errorlevel 1 (
    echo [1/4] MySQL not running.
    echo.
    echo OPTION A - XAMPP ^(recommended^):
    echo   Open XAMPP Control Panel - Start MySQL
    echo   Import xamp-database\nayab_sms.sql in phpMyAdmin if first time
    echo   Or run INSTALL-XAMPP.bat
    echo.
    echo OPTION B - Portable MySQL:
    echo   start-mysql.bat ^(port 3307^)
    echo.
    start "" "https://www.apachefriends.org/download.html" 2>nul
    start "Nayab SMS - MySQL 3307" /MIN cmd /c "%~dp0start-mysql.bat"
    set "MYSQL_PORT=3307"
  )
)

echo Waiting for MySQL on port %MYSQL_PORT%...
set /a MYSQL_WAIT=0
:wait_mysql
netstat -ano | findstr ":%MYSQL_PORT%" | findstr "LISTENING" >nul
if not errorlevel 1 goto mysql_ready
set /a MYSQL_WAIT+=1
if %MYSQL_WAIT% GEQ 45 (
  echo ERROR: MySQL not ready on port %MYSQL_PORT%.
  echo Start XAMPP MySQL or start-mysql.bat then run this file again.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
goto wait_mysql
:mysql_ready
echo MySQL ready on port %MYSQL_PORT%.

set "DB_PORT=%MYSQL_PORT%"
cd /d "%~dp0backend"
echo [2/4] Staff accounts ^& class teachers...
call npm run ensure-runtime
echo [3/4] Export snapshot to xamp-database ^(optional^)...
call npm run export-xampp-db 2>nul
cd /d "%~dp0"

netstat -ano | findstr ":5000" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo [4/4] Starting Backend...
  start "Nayab SMS - Backend" cmd /k "set DB_PORT=%MYSQL_PORT%&& %~dp0start-backend.bat"
  timeout /t 4 /nobreak >nul
) else (
  echo Backend already on port 5000.
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo Starting Frontend...
  start "Nayab SMS - Frontend" cmd /k "%~dp0start-frontend.bat"
  timeout /t 3 /nobreak >nul
) else (
  echo Frontend already on port 5173.
)

echo.
echo ============================================
echo  Website:  http://127.0.0.1:5173
echo  Admin:    http://127.0.0.1:5173/login
echo  phpMyAdmin ^(XAMPP^): http://localhost/phpmyadmin
echo  DB file:  xamp-database\nayab_sms.sql
echo ============================================
echo.
start "" "http://127.0.0.1:5173"
pause
