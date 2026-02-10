# Deployment Plan (Vercel + Railway/Render)

## Detected Targets
- Frontend: `frontend/` (Vite + React + TypeScript)
- Backend: `backend/services/api-gateway/` (NestJS)

## Frontend (Vercel)
1. Import repo into Vercel.
2. Set project root to `frontend`.
3. Build settings:
   - Install: `npm install --legacy-peer-deps`
   - Build: `npm run build`
   - Output: `dist`
4. Add env vars:
   - `VITE_API_GATEWAY_URL=https://api.<your-domain>/api/v1`
   - `VITE_SUPABASE_URL=<...>`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<...>`
   - optional `VITE_AI_SERVICE_URL`, `VITE_SENTRY_DSN`
5. Use included `frontend/vercel.json` for SPA rewrites.

## Backend (Railway)
1. Create Railway service from repo with root `backend`.
2. Build: `pnpm install && pnpm --filter api-gateway run build`
3. Start: `cd services/api-gateway && pnpm run start:prod`
4. Set env vars from checklist in `docs/ENV_SECRETS_CHECKLIST.md`.
5. Set health check to `/api/v1/health`.
6. Add Redis service and connect via `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.

## Backend (Render alternative)
- Use `backend/render.yaml` blueprint.
- Confirm service root/path matches your Render repository root.

## Post-deploy validation
- `GET https://api.<domain>/api/v1/health` -> 200
- `GET https://api.<domain>/api/docs` -> expected (if enabled)
- Frontend loads and can call API endpoints without CORS errors
