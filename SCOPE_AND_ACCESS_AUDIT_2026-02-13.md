# Scope & Access Audit — 2026-02-13

## Intended behavior (from local docs)
- Hierarchy: Province → District → Constituency → Ward.
- Province scope must only show that province’s districts/constituencies/wards and all dependent records.
- National scope shows all.
- RBAC + geographic scope should combine (role permits action; scope limits data).

Reference docs reviewed:
- `backend/HIERARCHICAL_ACCESS_CONTROL.md`
- `ARCHITECTURE_OVERVIEW.md`
- `BACKEND_INTEGRATION_PROGRESS.md`

## Current implementation status

### Backend scope pipeline
- Scope context middleware active in `backend/services/api-gateway/src/main.ts`.
- Scope resolver in `common/scope/scope.utils.ts`.
- Province name normalization now supports both `"Lusaka Province"` and `"Lusaka"`.
- `applyScopeToRows(...)` is currently used in these modules:
  - projects
  - payments
  - bursaries
  - empowerment
  - committees

### Backend modules still missing scope plumbing
Controllers without `scopeContext` pass-through include:
- ministry
- audits
- reports
- public
- procurement
- budgets
- wdc
- monitoring
- legal
- documents
- geography
(and others)

## Major mismatch causing user-visible confusion
Large parts of frontend still use hardcoded mock arrays instead of API data. Those pages cannot truly follow scope selection.
Examples:
- `frontend/src/pages/ProjectLifecycle.tsx` (mockProjects)
- `frontend/src/pages/WardIntake.tsx` (mockApplications)
- `frontend/src/pages/PLGODashboard.tsx`
- `frontend/src/pages/CDFCGovernance.tsx`
- `frontend/src/pages/TACAppraisal.tsx`
- `frontend/src/pages/Payments.tsx`
- `frontend/src/pages/SmartDashboard.tsx`
(and more)

## What "correct" should be
1. Scope selector updates shared scope state.
2. Every list/query page fetches from API (not mocks).
3. Every backend listing endpoint enforces scope.
4. Geography endpoints (`/geography`) return scope-consistent district/ward trees.
5. UI labels and data provenance align (no mixed labels from static mock records).

## Recommended execution order
1. Convert high-visibility pages to API first: SmartDashboard, ProjectLifecycle, WardIntake, Payments.
2. Complete backend scope phase-2 for remaining controllers/services.
3. Add integration tests: province scope fixture should return only matching province records.
4. Remove remaining mock datasets from production pages.

## Immediate practical conclusion
Current behavior can still appear mixed because some screens are not yet data-driven from scoped backend endpoints.
Scope logic has improved, but full consistency requires replacing mock-driven frontend screens + finishing backend scope phase-2.
