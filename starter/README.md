# Squilla Starter Site

A minimal, standalone starter kit for building and deploying a website powered by [Squilla CMS](https://github.com/erikkubica/squilla).

This directory contains **zero CMS backend or admin source code** — only your site-specific theme, configurations, and deployment definitions.

---

## Quick Start (Local Development)

1. **Copy environment variables**:
   ```bash
   cp .env.example .env
   ```

2. **Start the containers**:
   ```bash
   docker compose up -d
   ```

3. **Open the site**:
   - Website: [http://localhost:8099](http://localhost:8099)
   - Admin Panel: [http://localhost:8099/admin](http://localhost:8099/admin)

On first run, check logs for the generated admin credentials if `ADMIN_PASSWORD` was left empty:
```bash
docker compose logs app | grep -i "admin"
```

---

## Directory Structure

```
starter/
├── .env.example           # Environment variables (DB credentials, secrets)
├── docker-compose.yml     # Local orchestration with PostgreSQL and Squilla
├── Dockerfile             # 2-line Dockerfile for standalone immutable deploys
├── themes/
│   └── sample/            # Your custom theme
│       ├── theme.json
│       ├── layouts/
│       └── templates/
```

---

## Deploying to Production (Coolify / VPS / PaaS)

### Option A: Compose Deploy (Coolify / Docker Compose)
Point your Coolify Docker Compose resource or VPS to this folder:
- Squilla pulls `ghcr.io/erikkubica/squilla:latest`
- Mounts `./themes:/app/data/themes`
- Mounts persistent volumes for database and uploaded media

### Option B: Immutable Dockerfile Build
If your platform builds from a Git repository Dockerfile:
```bash
docker build -t my-squilla-site .
```
The Dockerfile simply layers your `themes/` directory onto the official pre-built Squilla image in under 2 seconds.
