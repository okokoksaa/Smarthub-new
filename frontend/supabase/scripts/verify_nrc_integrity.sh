#!/usr/bin/env bash
set -euo pipefail

# Simple wrapper to run the NRC/People integrity checks
# Requirements:
# - psql installed
# - DATABASE_URL env var set to your Supabase/Postgres connection string
#   e.g., export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/verify_nrc_integrity.sql"

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is not installed or not in PATH" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL is not set. Export your connection string first." >&2
  exit 1
fi

echo "Running NRC/People integrity checks..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
echo "\nChecks completed. Review output above."

