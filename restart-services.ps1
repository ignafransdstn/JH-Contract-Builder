# Restart JH Contract Builder Services
# Stops and starts both backend and frontend services

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RESTARTING JH CONTRACT BUILDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get the project root directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Step 1: Stop services
Write-Host "`n[1/2] Stopping services..." -ForegroundColor Yellow
& "$projectRoot\stop-services.ps1"

# Wait for ports to be released
Write-Host "`nWaiting for ports to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 2: Start services
Write-Host "`n[2/2] Starting services..." -ForegroundColor Green
& "$projectRoot\start-services.ps1"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RESTART COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Final status check
Start-Sleep -Seconds 2
$backend = Test-NetConnection localhost -Port 5001 -WarningAction SilentlyContinue -InformationLevel Quiet
$frontend = Test-NetConnection localhost -Port 3002 -WarningAction SilentlyContinue -InformationLevel Quiet

if ($backend -and $frontend) {
    Write-Host '✓ Restart berhasil! Semua service berjalan' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Akses: http://localhost:3002' -ForegroundColor Cyan
} else {
    Write-Host '⚠ Restart selesai tapi ada service yang gagal' -ForegroundColor Yellow
    Write-Host '  Jalankan .\status-services.ps1 untuk detail' -ForegroundColor White
}

Write-Host ""
