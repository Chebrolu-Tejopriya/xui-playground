@echo off
REM Double-click this. It sets the Console up on Windows.
REM
REM The counterpart to start.command on macOS. Opening a terminal and knowing
REM what to type in it is the real barrier for a designer, so this removes both.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed, and everything else needs it.
  echo.
  echo   Install it, then double-click this file again:
  echo.
  echo       winget install OpenJS.NodeJS.LTS
  echo.
  echo   Or get the installer from https://nodejs.org ^(choose LTS^).
  echo.
  pause
  exit /b 1
)

node scripts\setup.mjs
echo.
pause
