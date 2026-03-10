# Atrium Infrastructure

## Architecture Overview

```
                    ┌─────────────────────────────┐
                    │   Firebase Hosting (CDN)     │
                    │   your-firebase-project.web.app       │
                    │   SSL, caching, edge         │
                    └──────────┬──────────────────┘
                               │ rewrites all requests
                               ▼
                    ┌─────────────────────────────┐
                    │   Google Cloud Run           │
                    │   Single container           │
                    │                              │
                    │ ┌─────────────────────────┐  │
                    │ │  Caddy (:8080)           │  │
                    │ │  Reverse proxy           │  │
                    │ └────┬──────────────┬─────┘  │
                    │      │              │         │
                    │  /api/*        everything     │
                    │      │           else          │
                    │      ▼              ▼         │
                    │ ┌──────────┐ ┌────────────┐  │
                    │ │ NestJS   │ │ Next.js    │  │
                    │ │ API      │ │ Frontend   │  │
                    │ │ :3001    │ │ :3000      │  │
                    │ └────┬─────┘ └────────────┘  │
                    └──────┼───────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
   ┌───────────────────┐    ┌───────────────────┐
   │ Supabase Postgres │    │ Supabase Storage  │
   │ (Database)        │    │ (S3-compatible)   │
   │ Port 6543 pooler  │    │ File uploads      │
   │ Port 5432 direct  │    │                   │
   └───────────────────┘    └───────────────────┘
```

## Services

### Firebase Hosting
- **URL**: https://your-firebase-project.web.app
- **Purpose**: CDN, SSL termination, domain routing
- **Config**: `firebase.json` — rewrites all traffic to Cloud Run
- **Cost**: Free tier

### Google Cloud Run
- **Service name**: `atrium`
- **Region**: `us-central1`
- **Image**: `us-central1-docker.pkg.dev/your-firebase-project/atrium/atrium`
- **Port**: 8080 (Caddy)
- **Memory**: 512 Mi
- **Scaling**: 0–3 instances (scale-to-zero = free when idle, cold starts ~10s)
- **Cost**: Free tier (2M requests/month)

### Supabase
- **Project ref**: `your-supabase-ref`
- **PostgreSQL**: Transaction pooler (port 6543) for app queries, direct (port 5432) for Prisma migrations
- **Storage**: S3-compatible bucket `atrium` for file uploads
- **Cost**: Free tier (500 MB database, 1 GB storage)

### Stripe
- **Webhook URL**: `https://your-firebase-project.web.app/api/billing/webhook`
- **Mode**: Switchable between `test` and `live` via `STRIPE_MODE` env var

## Inside the Container

The unified Docker container runs three processes:

1. **Caddy** (port 8080) — Reverse proxy, PID 1
   - `/api/*` → NestJS on port 3001
   - Everything else → Next.js on port 3000
   - Config: `docker/Caddyfile`

2. **NestJS API** (port 3001) — Backend
   - Auth, projects, files, billing, email
   - Talks to Supabase Postgres + Storage
   - Handles Stripe webhooks

3. **Next.js** (port 3000) — Frontend
   - Server-side rendered (reads cookies for auth)
   - Dashboard, portal, auth pages
   - Calls API via localhost:3001 (SSR) or same-origin (browser)

Startup order (see `docker/unified-entrypoint.sh`):
1. `prisma db push` — syncs schema to Supabase
2. NestJS starts (background)
3. Next.js starts (background)
4. Caddy starts (foreground, receives traffic)

## Request Flow

```
Browser → your-firebase-project.web.app
       → Firebase Hosting CDN
       → Cloud Run container
       → Caddy (:8080)
       → /api/* → NestJS (:3001) → Supabase DB/Storage
       → /*    → Next.js (:3000) → SSR with API calls to localhost:3001
```

## Deployment

### Deploy Script
```bash
bash scripts/deploy.sh
```

This script:
1. Builds the unified Docker image
2. Pushes to Google Artifact Registry
3. Deploys to Cloud Run
4. Deploys Firebase Hosting config

### Environment Variables (Cloud Run)

Set once via GCP Console or `gcloud run services update`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase transaction pooler connection string |
| `DIRECT_URL` | Supabase direct connection (for migrations) |
| `BETTER_AUTH_SECRET` | Auth signing key (32+ chars) |
| `BETTER_AUTH_URL` | `https://your-firebase-project.web.app` |
| `WEB_URL` | `https://your-firebase-project.web.app` |
| `API_URL` | `http://localhost:3001` (internal) |
| `STORAGE_PROVIDER` | `s3` |
| `S3_ENDPOINT` | Supabase S3 endpoint |
| `S3_BUCKET` | `atrium` |
| `S3_ACCESS_KEY` | Supabase S3 access key |
| `S3_SECRET_KEY` | Supabase S3 secret key |
| `STRIPE_MODE` | `test` or `live` |
| `STRIPE_*` | Stripe keys (test + live) |
| `BILLING_ENABLED` | `true` |

### Build Arg

`NEXT_PUBLIC_API_URL` is baked into the Next.js build at image creation time (set to `https://your-firebase-project.web.app`). It cannot be changed at runtime.

## Docker Files

| File | Purpose |
|------|---------|
| `docker/unified.Dockerfile` | Single container for Cloud Run (API + Web + Caddy) |
| `docker/unified-entrypoint.sh` | Startup script for the unified container |
| `docker/Caddyfile` | Reverse proxy config |
| `docker/api.Dockerfile` | API-only container (for Unraid/docker-compose) |
| `docker/web.Dockerfile` | Web-only container (for Unraid/docker-compose) |
| `docker/api-entrypoint.sh` | API startup script (for standalone API container) |
| `docker-compose.yml` | Full stack with separate containers (for self-hosting) |

## Two Deployment Modes

### Cloud (Firebase + Cloud Run + Supabase)
- Uses `docker/unified.Dockerfile` — single container
- Deploy with `scripts/deploy.sh`
- Free tier, scale-to-zero, cold starts

### Self-Hosted (Unraid / VPS / Docker Compose)
- Uses `docker-compose.yml` with separate `api.Dockerfile` + `web.Dockerfile`
- Runs its own PostgreSQL container
- Local file storage or S3
- Always warm, no cold starts
