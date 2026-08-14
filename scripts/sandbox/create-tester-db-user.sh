#!/usr/bin/env bash
# Crea rol sandbox_tester con acceso solo a controlneg_rmx_db_sandbox.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
CREDS="${ROOT}/credentials.tester.local"

if [[ ! -f "$CREDS" ]]; then
  echo "Falta $CREDS" >&2
  exit 1
fi

DB_USER="$(grep -E '^DB_USER=' "$CREDS" | head -1 | cut -d= -f2-)"
DB_PASSWORD="$(grep -E '^DB_PASSWORD=' "$CREDS" | head -1 | cut -d= -f2-)"

if [[ -z "$DB_USER" || -z "$DB_PASSWORD" ]]; then
  echo "DB_USER / DB_PASSWORD vacíos en $CREDS" >&2
  exit 1
fi

# Escapar comilla simple para SQL
DB_PASSWORD_SQL="${DB_PASSWORD//\'/\'\'}"

psql -d postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD_SQL}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD_SQL}';
  END IF;
END
\$\$;

REVOKE CONNECT ON DATABASE controlneg_rmx_db FROM ${DB_USER};
-- PUBLIC suele tener CONNECT por defecto: sin esto el tester entraría a tu BD de dev
REVOKE CONNECT ON DATABASE controlneg_rmx_db FROM PUBLIC;
GRANT CONNECT ON DATABASE controlneg_rmx_db TO "romax-admin";
GRANT CONNECT ON DATABASE controlneg_rmx_db TO CURRENT_USER;
GRANT CONNECT ON DATABASE controlneg_rmx_db_sandbox TO ${DB_USER};
GRANT CONNECT ON DATABASE controlneg_rmx_db_sandbox TO PUBLIC;
SQL

psql -d controlneg_rmx_db_sandbox -v ON_ERROR_STOP=1 -f "${ROOT}/create-tester-db-user.sql"

echo "OK: ${DB_USER} → controlneg_rmx_db_sandbox (sin CONNECT a controlneg_rmx_db)"
