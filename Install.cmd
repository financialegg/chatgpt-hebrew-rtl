@echo off
setlocal
cd /d "%~dp0"
echo FinancialEgg Hebrew RTL - Codex Desktop installer
echo Runs in your normal Windows user account. Administrator rights are not required.
echo You may inspect scripts\install-windows.ps1 before continuing.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-windows.ps1"
set "result=%ERRORLEVEL%"
echo.
if not "%result%"=="0" (
  echo INSTALLATION DID NOT COMPLETE. Read the error above.
  echo If the error says permission denied, run this file from Windows Explorer outside Codex.
) else (
  echo Installer finished. Check each component's status above.
  echo The RTL desktop engine still needs to be launched and tested.
)
echo.
pause
exit /b %result%
