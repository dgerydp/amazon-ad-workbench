$ErrorActionPreference = "Stop"

function Test-Command {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command "python")) {
  Write-Host "Python was not found in PATH. Please install Python 3.11+ first." -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

if (-not (Test-Command "npm")) {
  Write-Host "npm was not found in PATH. Please install Node.js 20+ first." -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

Write-Host "Starting Amazon Ad Workbench..." -ForegroundColor Cyan

$backend = Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$PSScriptRoot\start-backend.ps1`"" -PassThru
Start-Sleep -Seconds 4
$frontend = Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$PSScriptRoot\start-frontend.ps1`"" -PassThru

Start-Sleep -Seconds 6
Start-Process "http://127.0.0.1:5173"

Write-Host "Backend PID: $($backend.Id)"
Write-Host "Frontend PID: $($frontend.Id)"
Write-Host "Browser opening at http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "If the page is blank for a short time, wait for dependency installation to finish." -ForegroundColor Yellow

Read-Host "Press Enter to close this launcher window"
