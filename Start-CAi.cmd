@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>&1
if errorlevel 1 (
  if exist "%LOCALAPPDATA%\Temp\cai-m1-work\node-v24.22.1-win-x64\node.exe" (
    set "PATH=%LOCALAPPDATA%\Temp\cai-m1-work\node-v24.22.1-win-x64;%PATH%"
  ) else (
    echo Node.js 24.15+ ^(24.x^) is required. See README.md for setup.
    exit /b 1
  )
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Dependencies are missing. Run npm.cmd ci first. See README.md.
  exit /b 1
)
echo CAi synthetic prototype: http://127.0.0.1:5173
echo Press Ctrl+C to stop the local server.
call npm.cmd run dev
exit /b %errorlevel%
