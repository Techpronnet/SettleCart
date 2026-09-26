# SettleCart Marketplace

Production-ready multi-vendor connected commerce platform for **SettleCart**, an African commerce ecosystem integrating digital storefronts, order orchestration, dispatch & delivery verification, and financial settlement.

---

## Architecture Overview

SettleCart operates as a decoupled architecture:
- **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS) deployed on Vercel (`https://settle-cart.vercel.app`).
- **Backend**: FastAPI (Python 3.12, Gunicorn + UvicornWorker) deployed on AWS EC2 inside Docker Compose behind an Nginx reverse proxy with Let's Encrypt SSL (`https://api.settlecart.com`).
- **Database**: Managed Serverless PostgreSQL over TLS on [Neon](https://neon.tech) (external to EC2, using connection pooling).
- **Background Tasks**: Redis & Celery workers (transactional emails, SMS alerts, notifications) networked internally on EC2.
- **CI/CD**: GitHub Actions automated pipeline with strict test, lint (Ruff), security (Bandit, pip-audit), container build (Trivy), and automated SSH deployment.

```text
Developer ──> GitHub (main) ──> GitHub Actions CI/CD
                                     ├── 1. pytest tests
                                     ├── 2. Ruff lint & format
                                     ├── 3. Bandit & pip-audit scans
                                     └── 4. Docker build & Trivy scan
                                                │
                                                ▼ (on success)
                                         SSH to AWS EC2
                                                │
                                                ├── git pull origin main
                                                ├── docker compose build
                                                ├── alembic upgrade head
                                                ├── docker compose up -d
                                                └── health check & auto-rollback
                                                        │
                                                        ▼
                                              Nginx (:80/:443 HTTPS)
                                                        │
                                                        ▼
                                            FastAPI Docker (:8000)
                                                        │
                                                        ▼
                                            Neon PostgreSQL (TLS)
```

---

## Repository Structure

```text
SettleCart/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline (Test, Lint, Security, Docker, EC2 Deploy)
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint (/health and /ready endpoints)
│   │   ├── core/                 # Config, security, database (Neon serverless pool)
│   │   ├── api/v1/               # API routes (auth, orders, dispatch, payments, etc.)
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── tasks/                # Celery tasks (email, SMS, notifications)
│   │   └── realtime/             # WebSockets & SSE live tracking
│   ├── migrations/               # Alembic database migration versions
│   ├── nginx/
│   │   ├── nginx.conf            # Production Nginx reverse proxy configuration
│   │   └── conf.d/api.conf       # HTTP->HTTPS redirect, SSL, WebSockets, and SSE proxies
│   ├── scripts/
│   │   ├── deploy.sh             # Production EC2 deployment script
│   │   ├── rollback.sh           # Instant rollback script (settlecart-backend:previous)
│   │   └── init-letsencrypt.sh   # Zero-downtime SSL bootstrap script
│   ├── tests/                    # Backend automated test suite (pytest)
│   ├── Dockerfile                # Production multi-stage Dockerfile (non-root appuser, Gunicorn)
│   ├── docker-compose.yml        # Production Compose stack (API, Nginx, Certbot, Redis, Celery)
│   ├── docker-compose.dev.yml    # Local development Compose stack (with local Postgres & reload)
│   ├── requirements.txt          # Production Python dependencies
│   ├── requirements-dev.txt      # Development & security audit tools
│   ├── DEPLOYMENT.md             # Complete AWS EC2 production deployment runbook
│   └── .env.example              # Backend environment variables template
├── frontend/                     # Next.js 16 frontend application
├── .gitignore                    # Root gitignore rules
└── README.md                     # System documentation
```

---

## Backend Deployment (AWS EC2 + Docker + Nginx + Neon)

For complete step-by-step instructions on provisioning an AWS EC2 instance, configuring Security Groups, connecting to Neon, bootstrapping Let's Encrypt SSL, and configuring GitHub Secrets, see the dedicated guide:

👉 **[Backend Production Deployment Runbook (backend/DEPLOYMENT.md)](backend/DEPLOYMENT.md)**

### Key Deployment Characteristics
1. **Zero Database on EC2**: Neon is the sole PostgreSQL provider. Port `5432` is never exposed.
2. **Strict Port Hardening**: Only ports `22` (SSH), `80` (HTTP), and `443` (HTTPS) are exposed on EC2. FastAPI (`8000`) and Redis (`6379`) are isolated to Docker's internal bridge network.
3. **Database Migration Safety**: Migrations execute in a temporary one-off container (`alembic upgrade head`) before bringing up the new API container.
4. **Automated Rollback**: The deployment script tags the existing image as `settlecart-backend:previous`. If post-deployment health verification fails, the stack automatically rolls back to the previous image.

### Production Commands on EC2
```bash
cd /home/ubuntu/settlecart/backend

# View live container logs
docker compose logs -f api
docker compose logs -f nginx

# Health & Readiness Checks
curl -i https://api.settlecart.com/health
curl -i https://api.settlecart.com/ready

# Manual Rollback
./scripts/rollback.sh

# Run Migrations Manually
docker compose run --rm api alembic upgrade head
```

---

## Local Development

### 1. Backend Local Setup (Docker)

To run the backend locally with a local PostgreSQL database and hot-reloading:

```bash
cd backend
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```
The FastAPI API will be available at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

To run the backend test suite:
```bash
docker compose -f docker-compose.dev.yml exec api pytest
```

### 2. Frontend Local Setup (Next.js)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
The Next.js frontend will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend Configuration (`backend/.env`)
See [backend/.env.example](backend/.env.example) for the full list of variables. Key production variables:
- `APP_ENV=production`
- `DEBUG=false`
- `DATABASE_URL=postgresql+asyncpg://...?...sslmode=require` (Neon connection pooler)
- `DOMAIN_NAME=api.settlecart.com`
- `BACKEND_CORS_ORIGINS=["https://settle-cart.vercel.app","https://settlecart.com"]`

### Frontend Configuration (`frontend/.env.local`)
- `NEXT_PUBLIC_APP_URL=https://settle-cart.vercel.app`
- `NEXT_PUBLIC_API_URL=https://api.settlecart.com`
