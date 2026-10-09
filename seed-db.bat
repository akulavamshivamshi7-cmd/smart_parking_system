@echo off
title Seed Smart Parking Database
echo ========================================================
echo  Seeding Smart Parking MongoDB Database
echo ========================================================
echo.
cd /d %~dp0server
npm run seed
echo.
pause
