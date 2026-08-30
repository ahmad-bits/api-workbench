@echo off
echo ========================================================
echo   Starting API Workbench Full-Stack Environment
echo ========================================================
echo.

start "API Workbench - Backend (FastAPI)" cmd /k "cd /d %~dp0..\backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

start "API Workbench - Frontend (Vite)" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo.
echo [OK] Backend starting at:  http://127.0.0.1:8000
echo [OK] Frontend starting at: http://localhost:5173
echo.
echo Login Credentials:
echo   Username: ahmad
echo   Password: Password123!
echo.
pause
