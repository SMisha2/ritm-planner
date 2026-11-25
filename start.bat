@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  set "PYTHON_CMD=python"
) else (
  set "PYTHON_CMD=py"
)
start "RITM local server" cmd /k %PYTHON_CMD% -m http.server 8000
 timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8000/
echo.
echo RITM is running at http://127.0.0.1:8000/
echo Close the server window to stop it.
endlocal
