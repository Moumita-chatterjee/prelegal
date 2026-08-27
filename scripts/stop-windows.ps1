$ErrorActionPreference = "Stop"

docker stop prelegal 2>$null | Out-Null
docker rm prelegal 2>$null | Out-Null

Write-Host "Prelegal stopped"
