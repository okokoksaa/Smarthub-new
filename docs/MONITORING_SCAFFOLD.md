# Monitoring Scaffolding Added

## Backend
- File changed: `backend/services/api-gateway/src/main.ts`
- Added request/response timing logs:
  - method
  - URL
  - status
  - duration ms

## Frontend
- File added: `frontend/src/lib/monitoring.ts`
- File changed: `frontend/src/main.tsx`
- Added browser-level listeners for:
  - `window.error`
  - `window.unhandledrejection`
- Reads optional `VITE_SENTRY_DSN` as hook point for future Sentry enablement.

## Next optional step
- Install and initialize Sentry SDKs when DSNs are ready.
