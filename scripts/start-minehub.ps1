$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$hostAddress = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$port = if ($env:PORT) { $env:PORT } else { "4173" }
$uri = "http://${hostAddress}:${port}"

function Get-MineHubHealth {
  try {
    return Invoke-RestMethod -Uri "$uri/api/health" -TimeoutSec 2
  } catch {
    return $null
  }
}

$health = Get-MineHubHealth
if ($health -and $health.name -eq "MineHub Agent") {
  Start-Process $uri
  exit 0
}

$listener = Get-NetTCPConnection -State Listen -LocalPort ([int]$port) -ErrorAction SilentlyContinue
if ($listener) {
  throw "Le port $port est déjà utilisé par une autre application."
}

if (-not $env:MINECRAFT_ROOT) {
  $existingData = Join-Path $env:USERPROFILE "Desktop\minehub\data"
  if ((Test-Path (Join-Path $existingData "state.json")) -or (Test-Path (Join-Path $existingData "servers"))) {
    $env:MINECRAFT_ROOT = $existingData
  }
}

$env:HOST = $hostAddress
$env:PORT = $port
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$logDirectory = Join-Path $env:LOCALAPPDATA "MineHub\logs"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

$agent = Start-Process -FilePath $nodePath `
  -ArgumentList "server.mjs" `
  -WorkingDirectory $projectRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $logDirectory "agent-$stamp.log") `
  -RedirectStandardError (Join-Path $logDirectory "agent-$stamp-error.log") `
  -PassThru

for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
  if ($agent.HasExited) {
    throw "MineHub s'est arrêté au démarrage. Consulte les journaux dans $logDirectory."
  }

  $health = Get-MineHubHealth
  if ($health -and $health.name -eq "MineHub Agent") {
    Start-Process $uri
    exit 0
  }

  Start-Sleep -Seconds 1
}

throw "MineHub n'a pas répondu après 30 secondes. Consulte les journaux dans $logDirectory."
