# Start JH Contract Builder Services
# Backend: Node.js Express API (Port 5001)
# Frontend: React Application (Port 3002)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   STARTING JH CONTRACT BUILDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get the project root directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if services are already running
$backendRunning = Test-NetConnection localhost -Port 5001 -WarningAction SilentlyContinue -InformationLevel Quiet
$frontendRunning = Test-NetConnection localhost -Port 3002 -WarningAction SilentlyContinue -InformationLevel Quiet

if ($backendRunning) {
    Write-Host "⚠ Backend already running on port 5001" -ForegroundColor Yellow
} else {
    Write-Host "► Starting Backend..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; Write-Host 'JH Contract Builder - Backend Server' -ForegroundColor Cyan; Write-Host '====================================='; node src/server.js"
    Start-Sleep -Seconds 3
}

if ($frontendRunning) {
    Write-Host "⚠ Frontend already running on port 3002" -ForegroundColor Yellow
} else {
    Write-Host "► Starting Frontend..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host 'JH Contract Builder - Frontend Server' -ForegroundColor Cyan; Write-Host '====================================='; npm start"
    Start-Sleep -Seconds 3
}

# Verify services are running
Write-Host "`n► Verifying services..." -ForegroundColor Green
Start-Sleep -Seconds 2

$backend = Test-NetConnection localhost -Port 5001 -WarningAction SilentlyContinue -InformationLevel Quiet
$frontend = Test-NetConnection localhost -Port 3002 -WarningAction SilentlyContinue -InformationLevel Quiet

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   SERVICE STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($backend) {
    Write-Host "✓ Backend  (port 5001): RUNNING" -ForegroundColor Green
} else {
    Write-Host "✗ Backend  (port 5001): FAILED TO START" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "✓ Frontend (port 3002): RUNNING" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend (port 3002): FAILED TO START" -ForegroundColor Red
}

if ($backend -and $frontend) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "   AKSES APLIKASI" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Backend API : http://localhost:5001" -ForegroundColor White
    Write-Host "Frontend UI : http://localhost:3002" -ForegroundColor White
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "   ADMIN LOGIN" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Email    : adminjimbaranhijau@jhilltown.com" -ForegroundColor Yellow
    Write-Host "Password : Jimbaranadmin@2026" -ForegroundColor Yellow
    Write-Host "`n✓ Semua service berhasil dijalankan!" -ForegroundColor Green
    Write-Host "✓ Buka http://localhost:3002 di browser" -ForegroundColor Green
}

Write-Host ""
