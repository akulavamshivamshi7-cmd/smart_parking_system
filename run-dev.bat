@echo off
title Smart Parking System Launcher
echo ========================================================
echo  Starting Smart Parking Management System (MERN Stack)
echo ========================================================
echo.
echo [1/2] Launching Backend API Server (Port 5000)...
start "Smart Parking Server (Port 5000)" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend React Client (Vite)...
start "Smart Parking Client (Vite)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ========================================================
echo  Backend API Server : http://localhost:5000
echo  Frontend UI Web App: http://localhost:5173
echo ========================================================
echo Both services are running in their respective windows.
pause
