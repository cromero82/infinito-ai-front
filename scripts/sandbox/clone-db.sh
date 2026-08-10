#!/usr/bin/env bash
# Clona controlneg_rmx_db → controlneg_rmx_db_sandbox (incluye schema public + security).
# Se puede correr con los MS de dev arriba (usa pg_dump, no TEMPLATE).
set -euo pipefail

SRC_DB="${SRC_DB:-controlneg_rmx_db}"
DST_DB="${DST_DB:-controlneg_rmx_db_sandbox}"
PGHOST="${PGHOST:-localhost}"
PGUSER_APP="${PGUSER_APP:-romax-admin}"
export PGPASSWORD="${PGPASSWORD:-f4ast3rv3rs10n*}"
DUMP="${DUMP:-/tmp/${SRC_DB}.sandbox.dump}"

echo "==> Dump $SRC_DB → $DUMP"
pg_dump -h "$PGHOST" -U "$PGUSER_APP" -Fc --no-owner --no-acl "$SRC_DB" -f "$DUMP"

echo "==> Recreate $DST_DB (superuser local, socket)"
psql -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${DST_DB}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${DST_DB};
CREATE DATABASE ${DST_DB} OWNER "${PGUSER_APP}";
SQL

echo "==> Restore into $DST_DB"
pg_restore -h "$PGHOST" -U "$PGUSER_APP" -d "$DST_DB" --no-owner --no-acl --verbose "$DUMP" \
  || true

echo "==> Grant + smoke"
psql -h "$PGHOST" -U "$PGUSER_APP" -d "$DST_DB" -v ON_ERROR_STOP=1 -c "SELECT current_database(), current_user;" \
  -c "SELECT nspname FROM pg_namespace WHERE nspname IN ('public','security') ORDER BY 1;"

echo "OK: $DST_DB lista. Arranca los MS con --spring.profiles.active=sandbox"
