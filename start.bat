@echo off
rem THE WHITE TRAIL - start a local server and open the game in the default browser.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org or serve this folder with any static web server.
  pause
  exit /b 1
)
rem open the browser a moment after the server starts
start "" /b cmd /c "ping -n 2 127.0.0.1 >nul & start "" http://localhost:8080"
node tools\serve.mjs 8080
