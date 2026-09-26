#!/usr/bin/env bash
# ==============================================================================
# SettleCart - Production Rollback Script
# Restores previous working Docker image without affecting Neon database.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "SettleCart Backend Rollback Triggered: $(date -u)"
echo "=========================================================="

if docker image inspect settlecart-backend:previous > /dev/null 2>&1; then
  echo "--> [1/3] Found previous stable image (settlecart-backend:previous)."
  echo "    Restoring settlecart-backend:previous as settlecart-backend:latest..."
  docker tag settlecart-backend:previous settlecart-backend:latest

  echo "--> [2/3] Restarting application containers with previous image..."
  docker compose up -d --no-build api celery_worker celery_beat

  echo "--> [3/3] Verifying health of rolled-back services..."
  sleep 5
  if docker compose exec -T api curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "=========================================================="
    echo "SUCCESS: Rollback complete. Application restored to previous version."
    echo "=========================================================="
    exit 0
  else
    echo "=========================================================="
    echo "CRITICAL: Rollback image also failed health check!"
    echo "Please inspect container logs: docker compose logs api"
    echo "=========================================================="
    exit 1
  fi
else
  echo "--> No previous Docker image (settlecart-backend:previous) found on this host."
  echo "--> Manual rollback instructions:"
  echo "    1. View recent git commits: git log -n 5 --oneline"
  echo "    2. Checkout last known good commit: git checkout <COMMIT_SHA>"
  echo "    3. Rebuild and deploy: docker compose up -d --build"
  echo "=========================================================="
  exit 1
fi
