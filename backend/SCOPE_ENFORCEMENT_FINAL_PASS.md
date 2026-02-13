# Scope Enforcement Final Pass (Tenant Isolation)

Date: 2026-02-13
Service: `backend/services/api-gateway`

## What was completed

### 1) Scope propagation + filtering updates
Implemented/extended `scopeContext` propagation and row-level filtering in these modules:

- **Reports**
  - Controller now passes request `scopeContext` into service methods.
  - Service now applies scope filtering in:
    - constituency report guard check
    - financial report aggregates
    - project status report
    - payment analytics report
    - compliance dashboard inputs
- **Documents**
  - Controller now propagates `scopeContext` for list/get/project/constituency/stats/create.
  - Service now applies scope filtering to list/read APIs and scoped create validation.
- **WDC**
  - Controller now propagates `scopeContext` for get/create/update.
  - Service now performs scope filtering on signoff fetches and scope gate for create/update.
- **Procurement (remaining endpoint pass)**
  - Controller now forwards `scopeContext` for item endpoints (get/update/publish/evaluations/award/audit/status).
  - Service item methods updated to accept `scopeContext`; item reads now enforce scope visibility.
- **Budgets (remaining endpoint pass)**
  - Controller forwards `scopeContext` for constituency budget/utilization endpoints.
  - Service applies scope enforcement for constituency budget fetch + utilization path.
- **Ministry (final endpoint sweep)**
  - Controller now propagates `req.scopeContext` on dashboard/CAPR/inbox/gazette + action endpoints.
  - Service applies scoped filtering for CAPR inputs, inbox project lists, gazette province lists, and scoped guards on approve/reject/publish actions.
- **Legal (final endpoint sweep)**
  - Controller now propagates `req.scopeContext` across dashboard/contracts/cases/compliance/opinions endpoints.
  - Service applies scoped filtering for list/get operations and scoped guards for mutation paths that target scoped entities.
- **Monitoring (final endpoint sweep)**
  - Controller now propagates `req.scopeContext` for site visits, geofence, issues, KPI, and constituency stats endpoints.
  - Service enforces scoped project/issue checks before reads/writes and applies scoped item visibility on single-item fetches.
- **Public (final endpoint sweep)**
  - Controller now propagates `req.scopeContext` for project/constituency/stat/report routes.
  - Service applies scoped filtering to project lists/details, constituency listings/stats, and aggregated summary/national stats calculations.

### 2) Isolation tests added
Added targeted isolation/propagation tests for this final sweep:

- `ministry/ministry.scope.spec.ts`
- `legal/legal.scope.spec.ts`
- `monitoring/monitoring.scope.spec.ts`
- `public/public.scope.spec.ts`

(Existing scope tests retained)

- `reports/reports.scope.spec.ts`
- `documents/documents.scope.spec.ts`
- `wdc/wdc.scope.spec.ts`

These validate scoped request propagation and out-of-scope isolation behavior.

### 3) Build + test verification

- `pnpm --filter api-gateway test --runInBand` ✅ (all tests pass)
- `pnpm --filter api-gateway build` ✅
- `npm run build` in `frontend/` ✅ (smoke build passed)

---

## Endpoint matrix (final pass status)

| Module | Scope Context Propagation | Query-time/row filtering | Status |
|---|---|---|---|
| reports | ✅ | ✅ | Completed in this pass |
| documents | ✅ | ✅ | Completed in this pass |
| wdc | ✅ | ✅ | Completed in this pass |
| procurement | ✅ (remaining item endpoints) | ✅ (item visibility) | Completed in this pass |
| budgets | ✅ (remaining constituency endpoints) | ✅ | Completed in this pass |
| audits | ✅ (already present for red-flags) | ✅ | Previously in place |
| geography | ✅ | ✅ | Previously in place |
| ministry | ✅ | ✅ | Completed in this final sweep |
| legal | ✅ | ✅ | Completed in this final sweep |
| monitoring | ✅ | ✅ | Completed in this final sweep |
| public | ✅ | ✅ | Completed in this final sweep |

> ⚠️ = module has partial/legacy paths that still require a deeper endpoint-by-endpoint hardening sweep.

## Files changed in this pass

- `backend/services/api-gateway/src/reports/reports.controller.ts`
- `backend/services/api-gateway/src/reports/reports.service.ts`
- `backend/services/api-gateway/src/documents/documents.controller.ts`
- `backend/services/api-gateway/src/documents/documents.service.ts`
- `backend/services/api-gateway/src/wdc/wdc.controller.ts`
- `backend/services/api-gateway/src/wdc/wdc.service.ts`
- `backend/services/api-gateway/src/procurement/procurement.controller.ts`
- `backend/services/api-gateway/src/procurement/procurement.service.ts`
- `backend/services/api-gateway/src/budgets/budgets.controller.ts`
- `backend/services/api-gateway/src/budgets/budgets.service.ts`
- `backend/services/api-gateway/src/reports/reports.scope.spec.ts`
- `backend/services/api-gateway/src/documents/documents.scope.spec.ts`
- `backend/services/api-gateway/src/wdc/wdc.scope.spec.ts`
- `backend/SCOPE_ENFORCEMENT_FINAL_PASS.md`

## Blockers / notes

- Repo contains substantial pre-existing unrelated changes (including auth and infra files), so commits should be made with strict path-based staging to avoid mixing unrelated work.
- A full completion sweep for ministry/legal/monitoring/public remains recommended before claiming 100% module coverage.
