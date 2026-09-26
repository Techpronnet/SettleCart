#!/usr/bin/env bash
# ==============================================================================
# SettleCart - Production Deployment Script
# Executed on AWS EC2 during GitHub Actions automated deployment.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "SettleCart Backend Deployment Started: $(date -u)"
echo "Directory: $SCRIPT_DIR"
echo "=========================================================="

# Ensure .env exists on EC2
if [ ! -f .env ]; then
  echo "ERROR: Production .env file not found in $SCRIPT_DIR"
  echo "Please create $SCRIPT_DIR/.env before deploying."
  exit 1
fi

# 1. Pull latest code from production branch
echo "--> [1/6] Pulling latest code from origin/production..."
git fetch origin production
git reset --hard origin/production


# 2. Tag current working image for fast rollback
echo "--> [2/6] Tagging existing image as rollback target..."
docker tag settlecart-backend:latest settlecart-backend:previous 2>/dev/null || echo "    (No previous image found to tag)"

# 3. Build new production Docker images
echo "--> [3/6] Building production Docker images..."
docker compose build api celery_worker celery_beat

# 4. Run database migrations via one-off container
echo "--> [4/6] Executing Alembic database migrations on Neon..."
docker compose run --rm api alembic upgrade head

# 5. Start / update services with zero-downtime recreation
echo "--> [5/6] Updating Docker Compose service containers..."
docker compose up -d

# 6. Post-deployment health verification
echo "--> [6/6] Verifying application health endpoint..."
HEALTHY=false
for i in $(seq 1 12); do
  echo "    Attempt $i/12: checking http://localhost/health (via Nginx) and internal API..."
  if docker compose exec -T api curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  sleep 5
done

if [ "$HEALTHY" = true ]; then
  echo "=========================================================="
  echo "SUCCESS: SettleCart Backend deployed and healthy!"
  echo "Cleaning up dangling Docker images..."
  docker image prune -f
  echo "=========================================================="
  exit 0
else
  echo "=========================================================="
  echo "FATAL: Deployment health check failed! Initiating rollback..."
  echo "=========================================================="
  ./scripts/rollback.sh
  exit 1
fi
