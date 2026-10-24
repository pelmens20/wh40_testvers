@echo off
setlocal
cd /d "%~dp0"
where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo Windows PowerShell was not found. Open the project with PowerShell and run tools\import-user-assets.ps1.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\import-user-assets.ps1" -SourcePath "D:\game\wh40_testvers\assets"
echo.
echo Review ASSET_IMPORT_REPORT.txt for imported and missing files.
pause
endlocal
