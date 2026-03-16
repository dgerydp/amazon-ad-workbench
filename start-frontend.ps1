Set-Location $PSScriptRoot\frontend

if (-not (Test-Path node_modules)) {
  npm install
}

& .\node_modules\.bin\vite.cmd --host 127.0.0.1 --port 5173 --strictPort
