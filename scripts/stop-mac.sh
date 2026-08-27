#!/usr/bin/env bash
set -euo pipefail

docker stop prelegal >/dev/null 2>&1 || true
docker rm prelegal >/dev/null 2>&1 || true

echo "Prelegal stopped"
