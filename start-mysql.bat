@echo off
title Nayab SMS - MySQL Server
set MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.4\bin
set DATA_DIR=%~dp0mysql-data

if not exist "%DATA_DIR%" (
  echo Initializing MySQL database...
  "%MYSQL_BIN%\mysqld.exe" --initialize-insecure --datadir="%DATA_DIR%"
)

echo Starting MySQL on port 3307...
"%MYSQL_BIN%\mysqld.exe" --datadir="%DATA_DIR%" --port=3307 --console
