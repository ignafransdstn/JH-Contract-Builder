# Script untuk menjalankan Backend dan Frontend JH Contract Builder

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " JH Contract Builder - Start Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Backend Directory
$backendPath = "C:\Users\ignaf\JIMBARAN HIJAU\Development\JH Contract Builder\backend"
# Frontend Directory
$frontendPath = "C:\Users\ignaf\JIMBARAN HIJAU\Development\JH Contract Builder\frontend"

# Start Backend
Write-Host "[1/2] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server Running on http://localhost:5001' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/2] Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server Running on http://localhost:3002' -ForegroundColor Green; npm start"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host " Servers Started Successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each terminal window to stop the servers" -ForegroundColor Yellow
