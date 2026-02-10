# Environment Audit (Redacted)

## Files audited
- `/.env`
- `/.env.local`
- `/frontend/.env`
- `/frontend/.env.example`
- `/frontend/.env.production`
- `/backend/.env`
- `/backend/.env.example`
- `/backend/.env.docker`
- `/backend/.env.docker.example`
- `/backend/services/api-gateway/.env`
- `/backend/services/api-gateway/.env.production`

## Required secrets and usage

### Frontend (public build-time vars)
- `VITE_SUPABASE_URL` -> `frontend/src/integrations/supabase/client.ts`
- `VITE_SUPABASE_PUBLISHABLE_KEY` -> `frontend/src/integrations/supabase/client.ts`
- `VITE_API_GATEWAY_URL` -> `frontend/src/lib/api.ts`, `frontend/src/hooks/usePublicPortal.tsx`
- `VITE_AI_SERVICE_URL` (optional) -> `frontend/src/hooks/useAIChat.tsx`
- `VITE_SENTRY_DSN` (optional) -> `frontend/src/lib/monitoring.ts`

### Backend API Gateway
- `SUPABASE_URL` -> auth/data integration
- `SUPABASE_SERVICE_ROLE_KEY` -> privileged Supabase calls
- `JWT_SECRET` -> token signing
- `JWT_REFRESH_SECRET` -> refresh token signing
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL_ENABLED` -> DB connectivity
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` -> cache/session store
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` -> throttling
- `CORS_ORIGIN` -> browser access policy
- `SENDGRID_API_KEY` (optional) -> notifications
- `AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME` (optional) -> SMS
- `SENTRY_DSN` (optional) -> backend error monitoring hook point

## Redaction status
- Rotate and replace any keys currently committed in `.env.production` files.
- Keep all secrets in platform env settings (Vercel/Railway/Render), not Git.
