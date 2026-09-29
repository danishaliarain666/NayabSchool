@echo off
title Install XAMPP for Nayab SMS
echo.
echo Nayab SMS uses MySQL from XAMPP (port 3306).
echo Database import file: xamp-database\nayab_sms.sql
echo.
echo Trying to install XAMPP via winget (needs internet)...
winget install --id ApacheFriends.Xampp.8.2 -e --accept-source-agreements --accept-package-agreements 2>nul
if errorlevel 1 (
  echo.
  echo winget install failed. Please download manually:
  echo https://www.apachefriends.org/download.html
  echo.
) else (
  echo XAMPP install started or already installed.
)
echo.
echo After install:
echo   1. Open XAMPP Control Panel
echo   2. Start MySQL
echo   3. Import xamp-database\nayab_sms.sql in phpMyAdmin
echo   4. Run RUN-WEBSITE.bat
echo.
pause
