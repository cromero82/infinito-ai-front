#!/usr/bin/env bash
# Stub: el stack sandbox vive en la copia estable, no en este repo de desarrollo.
# Canónico: /Users/carlosromero/Documents/dev/repos/sandbox
set -euo pipefail
SANDBOX_ROOT="${SANDBOX_ROOT:-/Users/carlosromero/Documents/dev/repos/sandbox}"
TARGET="$SANDBOX_ROOT/infinito-ai-front/scripts/sandbox/start-sandbox-env.sh"
if [[ ! -f "$TARGET" ]]; then
  echo "ERROR: no encuentro $TARGET" >&2
  echo "       ¿Existe la carpeta sandbox con infinito-ai-front?" >&2
  exit 1
fi
echo "==> Delegando a copia estable: $SANDBOX_ROOT"
exec bash "$TARGET" "$@"
