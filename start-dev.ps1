

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Launching the SecondHand Application Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Kill any process holding port 3000 to avoid lock conflicts
$portProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($portProcess) {
    Write-Host "Stopping process on port 3000 (PID $($portProcess.OwningProcess))..." -ForegroundColor DarkYellow
    Stop-Process -Id $portProcess.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Remove stale Next.js dev lock so startup is never blocked
$lockFile = Join-Path $root ".next\dev\lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "Removed stale .next/dev/lock" -ForegroundColor DarkYellow
}

# ---------------------------------------------------------------------------
# Ngrok tunnel for SePay webhook (local dev only)
# ---------------------------------------------------------------------------
$ngrokPublicUrl = ""

# Check if ngrok is installed
$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
$ngrokExe = if ($ngrokCmd) { $ngrokCmd.Source } elseif (Test-Path "$env:LOCALAPPDATA\ngrok\ngrok.exe") { "$env:LOCALAPPDATA\ngrok\ngrok.exe" } else { $null }

if (-not $ngrokExe) {
    Write-Host ""
    Write-Host "[WARNING] ngrok is not installed or not in PATH." -ForegroundColor Red
    Write-Host "  SePay webhooks will NOT work in local dev without ngrok." -ForegroundColor Red
    Write-Host "  Install: https://ngrok.com/download  |  winget install ngrok" -ForegroundColor DarkYellow
    Write-Host "  After install: ngrok config add-authtoken <YOUR_TOKEN>" -ForegroundColor DarkYellow
    Write-Host ""
} else {
    # Kill any existing ngrok process to avoid port conflicts
    Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500

    Write-Host "Starting ngrok tunnel on port 8000..." -ForegroundColor Magenta
    Start-Process $ngrokExe -ArgumentList "http 8000" -WindowStyle Minimized

    # Wait for ngrok to be ready (poll local API)
    $maxRetries = 15
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        Start-Sleep -Milliseconds 500
        $retryCount++
        try {
            $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
            $httpsTunnel = $tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
            if ($httpsTunnel) {
                $ngrokPublicUrl = $httpsTunnel.public_url
                break
            }
        } catch {
            # ngrok not ready yet, keep waiting
        }
    }

    if ($ngrokPublicUrl) {
        Write-Host ""
        Write-Host "  ngrok tunnel ready!" -ForegroundColor Green
        Write-Host "  Public URL: $ngrokPublicUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  SePay Webhook URL (set in https://my.sepay.vn):" -ForegroundColor Yellow
        Write-Host "    $ngrokPublicUrl/api/payment/sepay-webhook" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "[WARNING] ngrok started but could not get public URL." -ForegroundColor Red
        Write-Host "  Check ngrok status: http://127.0.0.1:4040" -ForegroundColor DarkYellow
        Write-Host "  You may need to run: ngrok config add-authtoken <TOKEN>" -ForegroundColor DarkYellow
        Write-Host ""
    }
}

# ---------------------------------------------------------------------------
# Python Backend
# ---------------------------------------------------------------------------
Write-Host "Launching Python Backend (port 8000)..." -ForegroundColor Yellow

# Build the backend command — inject NGROK_PUBLIC_URL if available
$backendEnv = ""
if ($ngrokPublicUrl) {
    $backendEnv = "`$env:NGROK_PUBLIC_URL='$ngrokPublicUrl'; "
}

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root'; Write-Host ' Python Backend' -ForegroundColor Yellow; .\.venv\Scripts\Activate.ps1; cd backend; $($backendEnv)uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
)

# Wait for backend to start
Start-Sleep -Seconds 2

# ---------------------------------------------------------------------------
# Next.js Frontend
# ---------------------------------------------------------------------------
Write-Host "Launching Next.js Frontend (port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root'; Write-Host ' Next.js Frontend' -ForegroundColor Green; npm run dev"
)

Write-Host ""
Write-Host "Successfully launched all services!" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
if ($ngrokPublicUrl) {
    Write-Host "   Ngrok:    $ngrokPublicUrl" -ForegroundColor Gray
    Write-Host "   Webhook:  $ngrokPublicUrl/api/payment/sepay-webhook" -ForegroundColor Gray
    Write-Host "   Inspect:  http://127.0.0.1:4040" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Close the terminal windows when you want to stop." -ForegroundColor Gray
