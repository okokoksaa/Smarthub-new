# CDF Smart Hub – Architecture Overview

This document summarizes the structure of the codebase and how components interact at runtime. It complements PROGRESS_TRACKER.md and IMPLEMENTATION_PLAN.md.

## High-Level Diagram (ASCII)

```
+-----------------------+          +---------------------------+
|    Frontend (React)   |  HTTPS   |     API Gateway (NestJS)  |
|   Vite + TS + Query   +--------->+  Auth, RBAC, Modules      |
|   supabase-js auth    |          |  Ports: 3000              |
+-----------+-----------+          +-----------+---------------+
            |                                   |
            |                                   | HTTP/RPC
            |                                   v
            |                        +----------+-----------+
            |                        |  Microservices       |
            |                        |  - Workflow (3003)   |
            |                        |  - AI (3004)         |
            |                        +----------+-----------+
            |                                   |
            |                                   |
            v                                   v
+-----------+-----------+            +----------+-----------+
|  Supabase (Postgres)  |<-----------+  API Data Access     |
|  RLS, Functions, DDL  |   SQL      |  (via services/repo) |
+-----------------------+            +----------------------+
```

- Identity & Auth: Supabase Auth (JWT) is used by the frontend; API Gateway validates tokens and applies role guards.
- Authorization: Enforced by both API (role checks) and DB (RLS policies and helper functions).
- Workflows & AI: API delegates long-running or analytical tasks to the Workflow and AI services.

## Codebase Layout

- `frontend/`: React app (hooks, pages, components). Talks to API Gateway via `src/lib/api.ts`.
- `backend/services/api-gateway/`: NestJS monolith exposing REST endpoints per domain (projects, budgets, payments, committees, wdc, geography, calendar).
- `backend/services/*`: Microservices (workflow, AI, others scaffolded).
- `frontend/supabase/migrations/`: SQL migrations for schema, functions, RLS, helpers.
- `.github/workflows/`: CI to apply migrations and verify integrity.

## Key Database Elements

- RLS: Multi-tenant + role-scoped via functions like `can_access_constituency(auth.uid(), ...)`.
- Working Days: `public.working_days_calendar` with helpers `is_working_day(date)`, `business_days_add(date, int)`, `working_days_between(date, date)`.
- NRC Rules:
  - `public.normalize_nrc(text)` and `public.is_valid_nrc(text)`
  - Normalized-unique on `empowerment_grants.applicant_nrc` and `bursary_applications.student_nrc`
  - `public.people` central registry ensures global NRC uniqueness; triggers link module rows to `*_person_id` FKs.

## Typical Request Flows

1) Authentication (Frontend → API)
- Frontend logs in with Supabase; stores JWT.
- Requests include `Authorization: Bearer <jwt>`.
- API validates JWT, checks role guard, then queries DB (RLS applies).

2) Project Workflow
- Frontend submits project → `POST /projects`
- API validates preconditions, stores data, logs audit.
- Workflow Service may be invoked to progress states (draft → submitted → reviews → approved).
- Calendar helpers compute SLA deadlines (working days only).

3) Payments (Two-Panel)
- Panel A approval: `POST /payments/:id/approve` with role in A (e.g., MP, CDFC Chair, Finance Officer)
- Panel B approval: `POST /payments/:id/approve` with role in B (e.g., PLGO, Ministry Official)
- API enforces ordering and prevents same user approving both panels; DB stores immutable audit trail.

4) Bursary/Empowerment with NRC
- Frontend submits forms with NRCs.
- DB validates NRC format (regex) and uniqueness where applicable.
- Triggers populate `*_person_id` via `ensure_person_id_from_nrc` for global linkage.

## Example Endpoints

- Geography
  - `GET /geography/provinces` | `GET /geography/constituencies?district_id=...`
- Calendar
  - `GET /calendar/working-days?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
  - `GET /calendar/deadline?start_date=YYYY-MM-DD&working_days=N`
- Projects
  - `POST /projects` | `GET /projects/:id` | `PATCH /projects/:id/status`
- Payments
  - `POST /payments` | `POST /payments/:id/approve` (Panel A/B logic enforced)
- Bursary / Empowerment (Tier 3 wiring in progress)

## Minimal cURL Examples

Assume `API=http://localhost:3000/api/v1` and `TOKEN=<supabase-jwt>`.

- Get provinces:
```
curl -H "Authorization: Bearer $TOKEN" "$API/geography/provinces"
```

- Compute deadline 14 working days from today:
```
curl -H "Authorization: Bearer $TOKEN" \
  "$API/calendar/deadline?start_date=$(date +%F)&working_days=14"
```

- Approve a payment (Panel A or B depending on role):
```
curl -X POST -H "Authorization: Bearer $TOKEN" "$API/payments/<id>/approve"
```

## Environment & Config

- Frontend `.env`:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_GATEWAY_URL`
- Supabase `frontend/supabase/config.toml`:
  - `project_id = "bwcqjrsuzvsqnmkznmiy"`
- API Gateway `.env`:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `API_GATEWAY_PORT`, `JWT_SECRET`

## CI & Verification

- `verify-nrc.yml`: Postgres service; applies migrations; runs NRC integrity checks.
- `verify-nrc-supabase.yml`: Supabase CLI local stack; `supabase db reset`; runs checks.
- `scripts/verify_nrc_integrity.{sql,sh}`: Verifies functions/constraints/indexes, duplicate NRCs, and FK links.

## Extension Points

- Add new modules to API Gateway as NestJS modules; expose REST endpoints.
- Add DB tables via migrations; enforce RLS and link NRC-bearing rows to `people` where relevant.
- Extend microservices (notifications, integrations) as the system grows.

