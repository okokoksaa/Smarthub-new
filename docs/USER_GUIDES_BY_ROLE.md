# User Documentation by Role

## 1) System Admin
- Configure environment variables and service health monitoring.
- Verify API health at `/api/v1/health`.
- Manage CORS, rate limits, and JWT secret rotation.

## 2) Finance Officer
- Use payment routes under `/api/v1/payments`.
- Follow approval chain: create -> panel A -> panel B -> disburse.
- Validate budget utilization before disbursement.

## 3) Project Officer
- Use `/api/v1/projects` for lifecycle workflow.
- Record milestones, progress, and M&E reports.
- Track WDC/CDFC/TAC/ministry decision states.

## 4) Public Portal User
- Read-only data via `/api/v1/public/*` endpoints.
- Submit feedback via `/api/v1/public/feedback`.

## 5) Operations / DevOps
- Frontend deploy on Vercel (`frontend/vercel.json`).
- Backend deploy on Railway/Render (`backend/railway.json`, `backend/render.yaml`).
- Follow `docs/DEPLOYMENT_PLAN.md` and `docs/DNS_SSL_DOMAIN_SETUP.md`.
