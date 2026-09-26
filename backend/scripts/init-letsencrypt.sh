#!/usr/bin/env bash
# ==============================================================================
# SettleCart - Let's Encrypt SSL Initialization Script
# Bootstraps initial SSL certificate using Certbot Webroot challenge without
# causing Nginx startup failures due to missing certificates.
# ==============================================================================
set -euo pipefail

# Load environment variables if present
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
cd "$SCRIPT_DIR"

if [ -f .env ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs -0) 2>/dev/null || true
fi

DOMAIN="${DOMAIN_NAME:-api.settlecart.com}"
EMAIL="${CERTBOT_EMAIL:-admin@settlecart.com}"
STAGING="${CERTBOT_STAGING:-0}" # Set to 1 for Let's Encrypt Staging API (rate limit safe testing)
RSA_KEY_SIZE=4096

CERT_DIR="./certbot/conf/live/$DOMAIN"

echo "=========================================================="
echo "SettleCart SSL Bootstrap for: $DOMAIN"
echo "=========================================================="

if [ -d "$CERT_DIR" ] && [ -f "$CERT_DIR/fullchain.pem" ]; then
  read -r -p "Existing certificate found for $DOMAIN. Continue and replace certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    echo "SSL certificate initialization aborted by user."
    exit 0
  fi
fi

echo "--> [1/5] Ensuring certbot directory structure exists..."
mkdir -p "./certbot/conf/live/$DOMAIN"
mkdir -p "./certbot/www"

echo "--> [2/5] Creating temporary self-signed dummy certificate for Nginx boot..."
openssl req -x509 -nodes -newkey "rsa:$RSA_KEY_SIZE" -days 1 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=localhost" 2>/dev/null

echo "--> [3/5] Starting Nginx container with dummy certificate..."
docker compose up -d nginx

echo "--> [4/5] Removing dummy certificate and requesting real Let's Encrypt certificate..."
rm -rf "$CERT_DIR"

# Select Let's Encrypt server (staging vs production)
STAGING_ARG=""
if [ "$STAGING" != "0" ]; then
  STAGING_ARG="--staging"
  echo "    (Using Let's Encrypt Staging environment)"
fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    -d $DOMAIN \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

echo "--> [5/5] Reloading Nginx with authentic production certificate..."
docker compose exec nginx nginx -s reload

echo "=========================================================="
echo "SSL Initialization Complete! Domain: https://$DOMAIN"
echo "=========================================================="
