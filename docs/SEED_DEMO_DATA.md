# Seed / Demo Data Approach

## Current DB setup detected
- SQL seeds under `backend/database/seed-data/*.sql`
- Loader script: `backend/database/seed-data/load_seed_data.sh`
- Migrations deployment: `backend/database/migrations/deploy_database.sh`

## Local seeding
1. Provision DB and schema.
2. Run:
   ```bash
   cd backend/database/migrations && ./deploy_database.sh
   cd ../seed-data && ./load_seed_data.sh
   ```
3. This loads provinces/districts/constituencies/wards and baseline categories.

## Demo users / demo workflow (recommended)
- Add a dedicated SQL file `backend/database/seed-data/99_demo_users_and_projects.sql` with:
  - demo constituency
  - demo users (admin/finance/public)
  - 2-3 projects with budgets and one payment lifecycle state
- Append it in `load_seed_data.sh` after geographic seeds.

## Production-safe practice
- Keep demo data in non-production environments only.
- Use idempotent inserts (`ON CONFLICT DO NOTHING`).
