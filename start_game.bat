@echo off
setlocal
cd /d "%~dp0"
REM Import the user's full asset folder before the HTTP server starts.
where powershell.exe >nul 2>nul
if %errorlevel%==0 (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\import-user-assets.ps1" -SourcePath "D:\game\wh40_testvers\assets"
)
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 "%~dp0launch_server.py"
  if not errorlevel 1 exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  python "%~dp0launch_server.py"
  if not errorlevel 1 exit /b
)
echo Python was not found. Opening the local HTML file directly.
echo If some browser features do not work in file mode, install Python 3 and run this launcher again.
timeout /t 3 >nul
start "" "%~dp0index.html"
endlocal
