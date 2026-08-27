$ErrorActionPreference = "Stop"

try { docker stop prelegal 2>$null | Out-Null } catch {}
try { docker rm prelegal 2>$null | Out-Null } catch {}

Write-Host "Prelegal stopped"
