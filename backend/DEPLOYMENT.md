# SettleCart Backend Production Deployment Runbook

Comprehensive production deployment guide for the **SettleCart FastAPI Backend** using **AWS EC2, Docker Compose, Nginx, Neon PostgreSQL, and GitHub Actions CI/CD**.

---

## 1. Target Architecture Overview

```text
                                  [ Internet / Clients ]
                                             │
                                             │ HTTP (:80) / HTTPS (:443)
                                             ▼
┌────────────────────────────────────── AWS EC2 ──────────────────────────────────────┐
│                                                                                     │
│  [ AWS Security Group: Allow TCP 22 (admin IP), TCP 80, TCP 443 ]                   │
│                                                                                     │
│  ┌─────────────────────── Docker Compose Network (internal_net) ─────────────────┐  │
│  │                                                                               │  │
│  │   ┌───────────────┐     Proxy Pass     ┌─────────────────┐                    │  │
│  │   │     Nginx     │ ─────────────────> │   FastAPI API   │                    │  │
│  │   │  (:80 / :443) │  http://api:8000   │  (:8000 internal)│                    │  │
│  │   └───────┬───────┘                    └────────┬────────┘                    │  │
│  │           │                                     │                             │  │
│  │           │ ACME Webroot (when domain linked)   │ Task Broker                 │  │
│  │           ▼                                     ▼                             │  │
│  │   ┌───────────────┐                    ┌─────────────────┐                    │  │
│  │   │    Certbot    │                    │      Redis      │                    │  │
│  │   │ (Auto-Renew)  │                    │ (:6379 internal)│                    │  │
│  │   └───────────────┘                    └────────┬────────┘                    │  │
│  │                                                 │                             │  │
│  │                                   ┌─────────────┴─────────────┐               │  │
│  │                                   │                           │               │  │
│  │                            ┌──────▼──────┐             ┌──────▼──────┐        │  │
│  │                            │Celery Worker│             │ Celery Beat │        │  │
│  │                            └─────────────┘             └─────────────┘        │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────┬────────────────────────────────────────┘
                                             │
                                             │ TLS 1.3 (External Managed Database)
                                             ▼
                             ┌────────────────────────────────┐
                             │       Neon PostgreSQL          │
                             │ (Serverless Pooled Connection) │
                             └────────────────────────────────┘
```

### Key Security & Architecture Guarantees
- **Immediate Server IP Support**: Configured to serve public traffic over HTTP on port 80 using the EC2 Server IP until a custom domain is linked.
- **No Database on EC2**: PostgreSQL runs exclusively on Neon Serverless over TLS.
- **Strict Port Isolation**:
  - FastAPI (`:8000`) and Redis (`:6379`) are exposed **only** within the internal Docker bridge network (`internal_net`).
  - No external traffic can access `:8000`, `:5432`, or `:6379`.
  - Only ports `22` (SSH), `80` (HTTP), and optionally `443` (HTTPS) are open on EC2.
- **PR-to-Production CI/CD**:
  - Automated CI tests, linting, and vulnerability scans run on any Pull Request targeting `production`.
  - Automated deployment to EC2 executes strictly when the Pull Request is **confirmed and merged** into `production`.


---

## 2. AWS EC2 Provisioning & Security Group

### Recommended Instance Specifications
- **Instance Type**: `t3.small` (2 vCPU, 2GB RAM) or `t3.medium` (2 vCPU, 4GB RAM)
- **AMI**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS (64-bit x86_64)
- **Storage**: 25 GB gp3 SSD
- **Networking**: Allocate an **AWS Elastic IP (EIP)** and associate it with the EC2 instance so the public IP remains static across restarts.

### AWS Security Group Rules
Configure the security group attached to the EC2 instance with the following **Inbound Rules**:

| Type | Protocol | Port Range | Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | `YOUR_ADMIN_IP/32` (or restricted corporate CIDR) | Secure shell administration |
| **HTTP** | TCP | `80` | `0.0.0.0/0`, `::/0` | Let's Encrypt ACME challenge & HTTPS redirect |
| **HTTPS** | TCP | `443` | `0.0.0.0/0`, `::/0` | Public production API traffic |

> [!CAUTION]
> **Never add inbound rules for ports 8000, 5432, or 6379.** All internal services communicate strictly across Docker's private bridge network.

---

## 3. Fresh EC2 Instance Setup (One-Time)

Log in to your Ubuntu EC2 instance via SSH:

```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Execute the following setup commands:

### Step 3.1: Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ufw fail2ban jq
```

### Step 3.2: Configure Ubuntu Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

### Step 3.3: Install Docker Engine & Docker Compose
```bash
# Install Docker using the official automated script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add the ubuntu user to the docker group
sudo usermod -aG docker $USER
rm get-docker.sh

# Verify Docker installation
docker --version
docker compose version
```
*(Log out and log back in for docker group permissions to take effect)*

### Step 3.4: Clone Repository & Create Project Directory
```bash
# Clone the repository
git clone https://github.com/Techpronnet/SettleCart.git /home/ubuntu/settlecart

# Navigate to backend directory
cd /home/ubuntu/settlecart/backend

# Make operational scripts executable
chmod +x scripts/deploy.sh scripts/rollback.sh scripts/init-letsencrypt.sh
```

---

## 4. Neon PostgreSQL Setup

1. Create a project in [Neon Console](https://console.neon.tech).
2. Choose your nearest region (e.g., `us-east-2`).
3. Neon will generate a connection string. Select **Connection pooling** (`-pooler` endpoint) and **Pooled connection**.
   Example:
   ```text
   postgresql://alex:YourSecurePassword@ep-crimson-fog-123456-pooler.us-east-2.aws.neon.tech/settlecart?sslmode=require
   ```
4. SettleCart automatically normalizes `postgres(ql)://` into `postgresql+asyncpg://` and translates `sslmode=require` into an asyncpg TLS context.
5. In addition, connection pool parameters are automatically tuned:
   - `pool_pre_ping=True` (discards stale connections after Neon serverless idle spin-downs)
   - `pool_recycle=300` (recycles connections every 5 minutes)
   - `pool_size=10`, `max_overflow=5` (avoids exhausting serverless pool limits)

---

## 5. Production Environment Configuration (`.env`)

On the EC2 instance, create `/home/ubuntu/settlecart/backend/.env`:

```bash
cd /home/ubuntu/settlecart/backend
cp .env.example .env
nano .env
```

Populate `.env` with production secrets:

```env
APP_NAME=SettleCart
APP_ENV=production
DEBUG=false
SECRET_KEY=<64_CHAR_HEX_SECRET>
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=["https://settle-cart.vercel.app","https://settlecart.com"]
ADMIN_REGISTRATION_SECRET=<SECURE_ADMIN_SECRET>
WEB_CONCURRENCY=2

# Neon Connection String
DATABASE_URL=postgresql+asyncpg://<USER>:<PASSWORD>@<EP_ID>-pooler.<REGION>.aws.neon.tech/<DB_NAME>?sslmode=require

# Internal Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# JWT Security
JWT_SECRET_KEY=<64_CHAR_HEX_SECRET>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Domain & SSL
DOMAIN_NAME=api.settlecart.com
CERTBOT_EMAIL=admin@settlecart.com
CERTBOT_STAGING=0

# Third-party Integrations
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Secure permissions on `.env`:
```bash
chmod 600 /home/ubuntu/settlecart/backend/.env
```

---

## 6. DNS Configuration & Let's Encrypt SSL Bootstrap

### Step 6.1: Point DNS to EC2 Elastic IP
In your DNS provider (e.g., Cloudflare, Route53, Namecheap):
- Create an **A Record**:
  - **Host / Name**: `api` (resolves to `api.settlecart.com`)
  - **Type**: `A`
  - **Value**: `<EC2_ELASTIC_IP>`
  - **TTL**: 300 (5 minutes)
- Verify DNS propagation:
  ```bash
  dig +short api.settlecart.com
  ```

### Step 6.2: Run Zero-Downtime SSL Bootstrap
On EC2:
```bash
cd /home/ubuntu/settlecart/backend
./scripts/init-letsencrypt.sh
```

What this script does:
1. Creates temporary self-signed dummy certificates so Nginx can start up without configuration errors.
2. Brings up Nginx on ports 80 and 443.
3. Certbot executes the ACME webroot challenge against `api.settlecart.com`.
4. Replaces dummy certs with genuine Let's Encrypt certificates.
5. Gracefully reloads Nginx.

### Step 6.3: Automated SSL Certificate Renewal
The `certbot` service in `docker-compose.yml` automatically checks for renewal every 12 hours:
```bash
# Check renewal status or perform a dry-run test
docker compose run --rm certbot renew --dry-run
```

---

## 7. GitHub Actions CI/CD Pipeline Setup

Automated deployments occur on every push to `main` when backend files change.

### Required GitHub Secrets
In your GitHub repository, navigate to **Settings -> Secrets and variables -> Actions** and create:

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `EC2_HOST` | Static Public IPv4 or Elastic IP of the EC2 instance | `54.123.45.67` |
| `EC2_USER` | Ubuntu SSH username | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH Key (OpenSSH PEM format) authorized on EC2 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### Authorizing the GitHub Actions SSH Key on EC2
On your local machine or build machine:
```bash
# Generate dedicated CI deployment key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f id_ed25519_deploy

# On EC2, append the public key to authorized_keys
cat id_ed25519_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```
Copy the contents of `id_ed25519_deploy` (the private key) into the GitHub secret `EC2_SSH_KEY`.

---

## 8. Deployment Workflow & Safety Verification

When code is pushed to `main`, GitHub Actions performs:
1. **Automated Unit Tests**: Runs `pytest` against SQLite in-memory test database.
2. **Code Quality**: Ruff lint and formatting checks.
3. **Security Analysis**:
   - Bandit static application security scanning (`-ll -ii`).
   - `pip-audit` scanning production dependencies against known CVEs.
4. **Docker Image Build & Trivy Scan**: Builds production image and scans for critical OS/package vulnerabilities.
5. **Deployment to EC2**:
   - Tags the running image as `settlecart-backend:previous`.
   - Runs `docker compose build`.
   - Executes database migrations via one-off container: `docker compose run --rm api alembic upgrade head`.
   - Updates containers: `docker compose up -d`.
   - Polls `GET /health` up to 60 seconds.
   - Cleans dangling images on success, or triggers automated rollback on failure.

---

## 9. Rollback Procedures

### Automated Rollback
If the newly deployed container fails health checks (`/health` does not respond with 200 within 60 seconds), `scripts/deploy.sh` automatically aborts and executes `scripts/rollback.sh`, restoring the `settlecart-backend:previous` image without database corruption.

### Manual Rollback
If you need to roll back to the previous version manually at any time:

```bash
cd /home/ubuntu/settlecart/backend
./scripts/rollback.sh
```

To roll back to an earlier git commit:
```bash
cd /home/ubuntu/settlecart/backend
git log -n 5 --oneline
git checkout <COMMIT_SHA>
docker compose up -d --build
```

---

## 10. Daily Operations & Troubleshooting

### Viewing Logs in Real Time
```bash
# FastAPI application logs (stdout/stderr)
docker compose logs -f api

# Nginx access and error logs
docker compose logs -f nginx

# Celery worker and beat logs
docker compose logs -f celery_worker celery_beat

# All services combined
docker compose logs -f
```

### Health & Readiness Probes
```bash
# Lightweight liveness check
curl -i https://api.settlecart.com/health

# Dependency readiness check (tests Neon DB connection & Redis ping)
curl -i https://api.settlecart.com/ready
```

### Running Database Migrations Manually
```bash
cd /home/ubuntu/settlecart/backend
docker compose run --rm api alembic upgrade head
```

### Checking System & Container Resources
```bash
# Container CPU and memory usage
docker stats --no-stream

# Host memory and disk space
free -m
df -h
```
