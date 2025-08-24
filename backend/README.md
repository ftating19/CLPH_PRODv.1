# Backend local setup

This folder contains a simple Express + MySQL backend for local development.

Prereqs:
- Docker & docker-compose (optional) or a local MySQL server
- Node.js 18+

Quick start using Docker (no DB password required for local dev):

1. Start local MySQL using docker-compose:

```powershell
cd backend
docker-compose up -d
```

2. Copy `.env.example` (or use the provided `.env`) and ensure values are correct:

```powershell
copy .env.example .env
# edit .env if needed
```

3. Install node deps and start server:

```powershell
npm install
npm run dev
```

4. Verify:
- Health: http://localhost:4000/health
- Signup: POST http://localhost:4000/api/signup

Notes:
- The MySQL container in this setup uses an empty root password for quick local testing. Do NOT use this in production.
- To change the DB password, set `MYSQL_ROOT_PASSWORD` in `docker-compose.yml` and update `.env`.
