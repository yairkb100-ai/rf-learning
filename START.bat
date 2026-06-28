@echo off
setlocal

echo Starting Learning System...
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not installed
    pause
    exit /b 1
)
echo Node.js found

REM Kill any existing node processes
taskkill /F /IM node.exe >nul 2>&1

REM Get script directory
set SCRIPT_DIR=%~dp0

REM Install dependencies
echo Step 1: Installing dependencies...
cd /d "%SCRIPT_DIR%backend"
call npm install >nul 2>&1

cd /d "%SCRIPT_DIR%frontend"
call npm install >nul 2>&1

REM Start servers in new windows
echo Step 2: Starting Backend (Port 3000)...
cd /d "%SCRIPT_DIR%backend"
start "Backend" cmd /c "npm run dev"

echo Step 3: Starting Frontend (Port 5173)...
cd /d "%SCRIPT_DIR%frontend"
start "Frontend" cmd /c "npm run dev"

REM Wait for servers to start
echo Step 4: Waiting for servers to be ready...
timeout /t 12 /nobreak

REM Open browser
echo Step 5: Opening browser...

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
    goto done
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:5173"
    goto done
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" "http://localhost:5173"
    goto done
)

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "http://localhost:5173"
    goto done
)

start http://localhost:5173

:done
echo.
echo ============================================
echo System Started Successfully!
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Login:
echo - Admin: 999999999 / postgres123
echo - Student: 123456789 / password123
echo.
echo Close the Backend/Frontend windows to stop
echo ============================================
echo.
pause
