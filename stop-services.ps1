# Stop JH Contract Builder Services
# Kills all node processes running on port 5001 and 3002

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   STOPPING JH CONTRACT BUILDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Function to get process by port
function Get-ProcessByPort {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connection) {
            return $connection.OwningProcess
        }
    } catch {
        return $null
    }
    return $null
}

# Stop Backend (Port 5001)
Write-Host "`n► Stopping Backend (port 5001)..." -ForegroundColor Yellow
$backendPid = Get-ProcessByPort -Port 5001
if ($backendPid -and $backendPid -ne 0) {
    try {
        Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Backend stopped (PID: $backendPid)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to stop backend" -ForegroundColor Red
    }
} else {
    Write-Host "  ℹ Backend not running" -ForegroundColor Gray
}

Start-Sleep -Seconds 1

# Stop Frontend (Port 3002)
Write-Host "`n► Stopping Frontend (port 3002)..." -ForegroundColor Yellow
$frontendPid = Get-ProcessByPort -Port 3002
if ($frontendPid -and $frontendPid -ne 0) {
    try {
        Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Frontend stopped (PID: $frontendPid)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to stop frontend" -ForegroundColor Red
    }
} else {
    Write-Host "  ℹ Frontend not running" -ForegroundColor Gray
}

# Additional cleanup: Kill any orphaned node processes
Write-Host "`n► Cleaning up orphaned processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*JH Contract Builder*"
}

if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Cleaned up process (PID: $($_.Id))" -ForegroundColor Green
        } catch {
            # Ignore errors
        }
    }
} else {
    Write-Host "  ℹ No orphaned processes found" -ForegroundColor Gray
}

# Verify services are stopped
Start-Sleep -Seconds 2
$backend = Test-NetConnection localhost -Port 5001 -WarningAction SilentlyContinue -InformationLevel Quiet
$frontend = Test-NetConnection localhost -Port 3002 -WarningAction SilentlyContinue -InformationLevel Quiet

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   FINAL STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not $backend) {
    Write-Host "✓ Backend  (port 5001): STOPPED" -ForegroundColor Green
} else {
    Write-Host "✗ Backend  (port 5001): STILL RUNNING" -ForegroundColor Red
}

if (-not $frontend) {
    Write-Host "✓ Frontend (port 3002): STOPPED" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend (port 3002): STILL RUNNING" -ForegroundColor Red
}

if (-not $backend -and -not $frontend) {
    Write-Host "`n✓ Semua service berhasil dihentikan!" -ForegroundColor Green
} else {
    Write-Host "`n⚠ Beberapa service masih berjalan" -ForegroundColor Yellow
    Write-Host "  Coba jalankan script ini lagi atau restart komputer" -ForegroundColor Yellow
}

Write-Host ""
