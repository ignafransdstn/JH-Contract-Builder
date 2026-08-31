# Check JH Contract Builder Services Status
# Shows detailed information about running services

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   JH CONTRACT BUILDER STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Function to get process info by port
function Get-ProcessInfoByPort {
    param([int]$Port)
    
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($connection) {
        $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            return @{
                Running = $true
                PID = $connection.OwningProcess
                ProcessName = $process.ProcessName
                StartTime = $process.StartTime
                Memory = [math]::Round($process.WorkingSet64 / 1MB, 2)
            }
        }
    }
    
    return @{ Running = $false }
}

# Check Backend
Write-Host "`n► Backend Service (Port 5001):" -ForegroundColor White
Write-Host "  ----------------------------------------"
$backendInfo = Get-ProcessInfoByPort -Port 5001

if ($backendInfo.Running) {
    Write-Host "  Status       : " -NoNewline; Write-Host "RUNNING" -ForegroundColor Green
    Write-Host "  Process ID   : $($backendInfo.PID)"
    Write-Host "  Process Name : $($backendInfo.ProcessName)"
    Write-Host "  Start Time   : $($backendInfo.StartTime)"
    Write-Host "  Memory Usage : $($backendInfo.Memory) MB"
    Write-Host "  URL          : " -NoNewline; Write-Host "http://localhost:5001" -ForegroundColor Cyan
    
    $health = Invoke-WebRequest -Uri "http://localhost:5001/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($health -and $health.StatusCode -eq 200) {
        Write-Host "  Health Check : " -NoNewline; Write-Host "OK" -ForegroundColor Green
    }
} else {
    Write-Host "  Status       : " -NoNewline; Write-Host "STOPPED" -ForegroundColor Red
    Write-Host "  Service tidak berjalan"
}

# Check Frontend
Write-Host "`n► Frontend Service (Port 3002):" -ForegroundColor White
Write-Host "  ----------------------------------------"
$frontendInfo = Get-ProcessInfoByPort -Port 3002

if ($frontendInfo.Running) {
    Write-Host "  Status       : " -NoNewline; Write-Host "RUNNING" -ForegroundColor Green
    Write-Host "  Process ID   : $($frontendInfo.PID)"
    Write-Host "  Process Name : $($frontendInfo.ProcessName)"
    Write-Host "  Start Time   : $($frontendInfo.StartTime)"
    Write-Host "  Memory Usage : $($frontendInfo.Memory) MB"
    Write-Host "  URL          : " -NoNewline; Write-Host "http://localhost:3002" -ForegroundColor Cyan
    
    # Calculate uptime
    if ($frontendInfo.StartTime) {
        $uptime = New-TimeSpan -Start $frontendInfo.StartTime -End (Get-Date)
        Write-Host "  Uptime       : $($uptime.Hours)h $($uptime.Minutes)m $($uptime.Seconds)s"
    }
} else {
    Write-Host "  Status       : " -NoNewline; Write-Host "STOPPED" -ForegroundColor Red
    Write-Host "  Service tidak berjalan"
}

# Database Status
Write-Host "`n► Database Service (PostgreSQL):" -ForegroundColor White
Write-Host "  ----------------------------------------"

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "  Status       : " -NoNewline; Write-Host "RUNNING" -ForegroundColor Green
        Write-Host "  Service Name : $($pgService.Name)"
        Write-Host "  Display Name : $($pgService.DisplayName)"
    } else {
        Write-Host "  Status       : " -NoNewline; Write-Host "STOPPED" -ForegroundColor Red
    }
} else {
    Write-Host "  Status       : " -NoNewline; Write-Host "NOT FOUND" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$allRunning = $backendInfo.Running -and $frontendInfo.Running

if ($allRunning) {
    Write-Host "Semua service berjalan normal" -ForegroundColor Green
    Write-Host ""
    Write-Host "Akses Aplikasi:" -ForegroundColor White
    Write-Host "  - Frontend : http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  - Backend  : http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Admin Login:" -ForegroundColor White
    Write-Host "  - Email    : adminjimbaranhijau@jhilltown.com" -ForegroundColor Yellow
    Write-Host "  - Password : Jimbaranadmin@2026" -ForegroundColor Yellow
} elseif ($backendInfo.Running -or $frontendInfo.Running) {
    Write-Host "Beberapa service berjalan" -ForegroundColor Yellow
    Write-Host ""
    Write-Host 'Jalankan: .\start-services.ps1 untuk start semua service' -ForegroundColor White
} else {
    Write-Host "Semua service tidak berjalan" -ForegroundColor Red
    Write-Host ""
    Write-Host 'Jalankan: .\start-services.ps1 untuk start service' -ForegroundColor White
}

Write-Host ""
