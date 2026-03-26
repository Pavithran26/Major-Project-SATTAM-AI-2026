param(
  [string]$HostIp = "0.0.0.0",
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$projectPattern = [Regex]::Escape($projectRoot)

$projectNextDev = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq "node.exe" -and
  $_.CommandLine -match $projectPattern -and
  $_.CommandLine -match "next" -and
  $_.CommandLine -match "dev"
}

if ($projectNextDev) {
  $ids = ($projectNextDev | Select-Object -ExpandProperty ProcessId) -join ", "
  $reuseHost = if ($HostIp -eq "0.0.0.0" -or $HostIp -eq "::") { "127.0.0.1" } else { $HostIp }
  Write-Host "Next.js already running for this project (PID: $ids)."
  Write-Host "Reuse: http://$reuseHost`:$Port"
  exit 0
}

$listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
  Select-Object -First 1

if ($listener) {
  $owner = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
  $ownerName = if ($owner) { $owner.ProcessName } else { "unknown" }
  Write-Error "Port $Port is already used by PID $($listener.OwningProcess) ($ownerName). Not modifying other processes."
  exit 1
}

$lockPath = Join-Path $projectRoot ".next\dev\lock"
if (Test-Path $lockPath) {
  Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
}

Set-Location $projectRoot
$nextCmd = Join-Path $projectRoot "node_modules\.bin\next.cmd"
if (-not (Test-Path $nextCmd)) {
  Write-Error "Missing $nextCmd. Run npm install in $projectRoot first."
  exit 1
}

& $nextCmd dev --hostname $HostIp --port $Port
exit $LASTEXITCODE
