#!/usr/bin/env bash
# Stub: create-tester-db-user de la copia estable en .../repos/sandbox
set -euo pipefail
SANDBOX_ROOT="${SANDBOX_ROOT:-/Users/carlosromero/Documents/dev/repos/sandbox}"
TARGET="$SANDBOX_ROOT/infinito-ai-front/scripts/sandbox/create-tester-db-user.sh"
if [[ ! -f "$TARGET" ]]; then
  echo "ERROR: no encuentro $TARGET" >&2
  exit 1
fi
echo "==> Delegando create-tester-db-user a copia estable: $SANDBOX_ROOT"
exec bash "$TARGET" "$@"
