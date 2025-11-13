@echo off
setlocal
cd /d "%~dp0"

echo Starting DonBeeWorld backend...
start "DonBeeWorld Server" cmd /c "cd /d "%~dp0server" && npm run dev"

REM ????????????
timeout /t 2 >nul

echo Starting DonBeeWorld frontend...
start "DonBeeWorld Client" cmd /c "cd /d "%~dp0client" && npm run dev"

echo.
echo DonBeeWorld server and client have been started in separate windows.
echo Close the spawned windows to stop the services.
pause
endlocal
