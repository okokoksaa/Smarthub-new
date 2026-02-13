# Mock Data Eliminated (Phase 1)

## Objective
Remove production route dependence on `@/data/mockData` and wire routes/components to live scoped API-backed hooks.

## Completed
All direct imports from `@/data/mockData` have been removed from production pages/components.

### Routes/components rewired to live data
- `frontend/src/pages/Projects.tsx`
  - Uses `useProjects()` and maps API payload to UI table model.
- `frontend/src/pages/Payments.tsx`
  - Uses `usePayments()` and maps API payload to UI table model.
- `frontend/src/pages/Dashboard.tsx`
  - Uses `useProjects()` + `usePayments()` and derives metrics from real data.
- `frontend/src/pages/Constituencies.tsx`
  - Uses `useConstituencies()` + `useProjects()` for per-constituency stats.
- `frontend/src/pages/AuditTrail.tsx`
  - Uses `useProjects()` + `usePayments()` to build live activity table.
- `frontend/src/pages/AIAdvisory.tsx`
  - Uses `usePayments()` AI risk fields.
- `frontend/src/components/dashboard/AIAdvisoryPanel.tsx`
  - Uses `usePayments()` AI risk fields.
- `frontend/src/components/dashboard/RecentActivityFeed.tsx`
  - Uses `useProjects()` + `usePayments()`.

### Supporting fix
- `frontend/src/hooks/usePayments.tsx`
  - Fixed build-blocking variable shadowing (`error` -> `dbError`) in fallback path.

## Verification
- `npm run build` (frontend) ✅

## Notes
- Data now respects scope automatically via centralized API client headers/query (`X-Constituency-ID` + `scope`) already configured in `frontend/src/lib/api.ts`.
- Some legacy pages still contain inline local constants (not `@/data/mockData`), which are outside this specific elimination target and should be addressed in later cleanup phases.
