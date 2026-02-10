# Supabase Deployment Flow (Frontend + Backend)

This repo is configured to use **Supabase for Auth, Database, and Storage**.

## Architecture
- **Frontend (Vercel + Vite)** uses Supabase client with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY` (anon/publishable key)
- **Backend (NestJS API Gateway)** uses:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - Postgres connection via `SUPABASE_DB_URL` (aliased to `DATABASE_URL`)

---

## Required Environment Variables

### Frontend (Vercel Project Env)
```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

### Backend (API service env)
```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_JWT_SECRET=<supabase-jwt-secret-or-jwt-secret>

SUPABASE_DB_URL=postgresql://postgres:<db-password>@db.<project-ref>.supabase.co:5432/postgres
DATABASE_URL=${SUPABASE_DB_URL}
```

> Never expose `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, or DB password to frontend/public logs.

---

## Local Verification

### Frontend
```bash
cd frontend
npm run build
npm run dev -- --host 127.0.0.1 --port 5173
```
Check app loads at `http://127.0.0.1:5173`.

### Backend (API Gateway)
```bash
cd backend
pnpm --filter api-gateway run build
pnpm --filter api-gateway run start:dev
```
Health check:
```bash
curl http://127.0.0.1:3000/api/v1/health
```

---

## Vercel Deployment Notes

1. Connect repo to Vercel.
2. Set frontend env vars in Vercel Project Settings.
3. Deploy frontend.
4. Deploy backend on your runtime (Node host/container) with backend env vars above.
5. Ensure backend CORS includes frontend domain(s).

---

## Common Pitfalls
- Missing `VITE_SUPABASE_*` vars causes frontend bootstrap failure.
- Wrong/rotated service role key breaks privileged backend queries.
- Using transaction pooler URL where direct DB URL is required for migrations.
- Mismatched Supabase project refs between frontend and backend envs.
