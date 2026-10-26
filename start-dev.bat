@echo off
REM Double-click to start IMovies.
REM If server\.env has a MongoDB Atlas URI (mongodb+srv://...) it uses Atlas,
REM otherwise a local MongoDB that saves to server\.data.
REM Opens two windows: API (port 5000) and website (port 5173).
REM Output is also saved to logs\server.log and logs\client.log.
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org and run this again.
  pause
  exit /b 1
)

if not exist logs mkdir logs

set DBSCRIPT=dev:local
findstr /B /L /C:"MONGO_URI=mongodb+srv" server\.env >nul 2>&1 && set DBSCRIPT=dev:atlas
if "%DBSCRIPT%"=="dev:atlas" (
  findstr /L /C:":<password>@" server\.env >nul 2>&1 && (
    echo.
    echo server\.env still has ^<password^> in the MONGO_URI line.
    echo Notepad will open: replace ^<password^> with your Atlas password, save, close, and run this again.
    echo.
    start notepad "%~dp0server\.env"
    pause
    exit /b 1
  )
  echo Using MongoDB Atlas
) else (
  echo Using local MongoDB in server\.data
)

if not exist server\node_modules (
  echo Installing server packages...
  pushd server & call npm install & popd
)
if not exist client\node_modules (
  echo Installing client packages...
  pushd client & call npm install & popd
)

start "IMovies API" /D "%~dp0server" powershell -NoExit -ExecutionPolicy Bypass -Command "cmd /c 'npm run %DBSCRIPT% 2>&1' | Tee-Object -FilePath '%~dp0logs\server.log'"
start "IMovies website" /D "%~dp0client" powershell -NoExit -ExecutionPolicy Bypass -Command "cmd /c 'npm run dev 2>&1' | Tee-Object -FilePath '%~dp0logs\client.log'"

echo.
echo Starting... the browser will open in about 25 seconds.
echo First run downloads MongoDB (about 100 MB), so the API may take longer.
timeout /t 25 /nobreak >nul
start "" http://localhost:5173
