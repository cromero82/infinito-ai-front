#!/usr/bin/env bash
# =============================================================================
# Arranca el ambiente sandbox completo (paralelo a tu dev).
#
# Uso:
#   ./scripts/sandbox/start-sandbox-env.sh
#   ./scripts/sandbox/start-sandbox-env.sh --clone          # refresca BD antes
#   ./scripts/sandbox/start-sandbox-env.sh --tunnel         # + cloudflared pos-local
#   ./scripts/sandbox/start-sandbox-env.sh --skip-ms        # solo FE+Caddy (MS ya en IntelliJ)
#   ./scripts/sandbox/start-sandbox-env.sh --skip-fe        # solo microservicios
#   ./scripts/sandbox/start-sandbox-env.sh --with-mail      # levanta mail :8082 si no corre
#
# Parar:
#   ./scripts/sandbox/stop-sandbox-env.sh
#
# Puertos sandbox: FE 4210 · Caddy 8180 · Auth 8181 · Relacional 8188 · Puente 8195 · Health 3011
# URL local:  http://localhost:4210
# URL túnel:  https://pos-sandbox.mayaksoluciones.com
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPOS_ROOT="$(cd "$FRONT_ROOT/.." && pwd)"
RUN_DIR="$SCRIPT_DIR/.run"
LOG_DIR="$SCRIPT_DIR/logs"

DO_CLONE=0
DO_TUNNEL=0
SKIP_MS=0
SKIP_FE=0
WITH_MAIL=0

for arg in "$@"; do
  case "$arg" in
    --clone) DO_CLONE=1 ;;
    --tunnel) DO_TUNNEL=1 ;;
    --skip-ms) SKIP_MS=1 ;;
    --skip-fe) SKIP_FE=1 ;;
    --with-mail) WITH_MAIL=1 ;;
    -h|--help)
      cat <<'EOF'
Arranca el ambiente sandbox (MS + Angular + Caddy).

  ./scripts/sandbox/start-sandbox-env.sh
  ./scripts/sandbox/start-sandbox-env.sh --clone
  ./scripts/sandbox/start-sandbox-env.sh --tunnel
  ./scripts/sandbox/start-sandbox-env.sh --skip-ms
  ./scripts/sandbox/start-sandbox-env.sh --skip-fe
  ./scripts/sandbox/start-sandbox-env.sh --with-mail

Parar: ./scripts/sandbox/stop-sandbox-env.sh
  o:    npm run sandbox:down

Puertos: 4210 FE · 8180 Caddy · 8181 auth · 8188 relacional · 8195 puente · 3011 health
Local:   http://localhost:4210
Túnel:   https://pos-sandbox.mayaksoluciones.com
EOF
      exit 0
      ;;
    *)
      echo "Flag desconocida: $arg (usa --help)" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$RUN_DIR" "$LOG_DIR"

log() { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }

port_open() {
  local port="$1"
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1
  else
    (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1
  fi
}

wait_port() {
  local port="$1"
  local name="$2"
  local max="${3:-90}"
  local i=0
  while (( i < max )); do
    if port_open "$port"; then
      log "$name listo en :$port"
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  warn "Timeout esperando $name en :$port (mira $LOG_DIR)"
  return 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: falta comando '$1' en PATH" >&2
    exit 1
  fi
}

write_pid() {
  local key="$1"
  local pid="$2"
  echo "$pid" >"$RUN_DIR/${key}.pid"
}

start_bg() {
  local key="$1"
  shift
  local logfile="$LOG_DIR/${key}.log"
  log "Iniciando $key → $logfile"
  # setsid: process group propio para que stop mate mvn/java/npm hijos
  if command -v setsid >/dev/null 2>&1; then
    setsid bash -lc "$*" >"$logfile" 2>&1 &
  else
    bash -lc "$*" >"$logfile" 2>&1 &
  fi
  write_pid "$key" $!
}

# --- prerrequisitos ---
require_cmd psql
require_cmd mvn
require_cmd npm
require_cmd node

if (( SKIP_FE == 0 )); then
  require_cmd caddy
  require_cmd npx
fi

export PGPASSWORD="${PGPASSWORD:-f4ast3rv3rs10n*}"
PGHOST="${PGHOST:-localhost}"
PGUSER_APP="${PGUSER_APP:-romax-admin}"
DST_DB="${DST_DB:-controlneg_rmx_db_sandbox}"

log "Repos: $REPOS_ROOT"
log "Frontend: $FRONT_ROOT"

# --- BD ---
if (( DO_CLONE == 1 )); then
  log "Clonando BD desarrollo → sandbox…"
  bash "$SCRIPT_DIR/clone-db.sh"
  if [[ -x "$SCRIPT_DIR/create-tester-db-user.sh" ]]; then
    bash "$SCRIPT_DIR/create-tester-db-user.sh" || warn "create-tester-db-user falló (opcional)"
  fi
elif ! psql -h "$PGHOST" -U "$PGUSER_APP" -d "$DST_DB" -c 'SELECT 1' >/dev/null 2>&1; then
  warn "No existe o no conecta $DST_DB. Clona con: $0 --clone"
  exit 1
else
  log "BD $DST_DB OK"
fi

# --- Mail compartido :8082 ---
MAIL_DIR="$REPOS_ROOT/infinito-smtp-service"
if port_open 8082; then
  log "Mail ya corre en :8082 (compartido)"
elif (( WITH_MAIL == 1 )); then
  if [[ -d "$MAIL_DIR" ]]; then
    start_bg mail "cd \"$MAIL_DIR\" && mvn -q -DskipTests spring-boot:run"
    wait_port 8082 "mail" 120 || true
  else
    warn "No encuentro $MAIL_DIR"
  fi
else
  warn "Mail no está en :8082. Devúelo (dev) o usa --with-mail"
fi

# --- Microservicios sandbox ---
start_ms() {
  local key="$1"
  local dir="$2"
  local port="$3"
  if port_open "$port"; then
    log "$key ya escucha en :$port — no se relanza"
    return 0
  fi
  if [[ ! -d "$dir" ]]; then
    warn "Falta repo $dir"
    return 1
  fi
  start_bg "$key" "cd \"$dir\" && mvn -q -DskipTests spring-boot:run -Dspring-boot.run.profiles=sandbox"
}

if (( SKIP_MS == 0 )); then
  start_ms security "$REPOS_ROOT/infinito-security" 8181
  start_ms relational "$REPOS_ROOT/pos-relational-data-service" 8188
  start_ms puente "$REPOS_ROOT/puente-tienda" 8195

  wait_port 8181 "auth/security" 180 || true
  wait_port 8188 "relacional" 180 || true
  wait_port 8195 "puente-tienda" 180 || true
else
  log "Omitiendo MS (--skip-ms)"
fi

# --- Túnel Cloudflare (opcional) ---
if (( DO_TUNNEL == 1 )); then
  require_cmd cloudflared
  if pgrep -f 'cloudflared tunnel.*pos-local' >/dev/null 2>&1; then
    log "cloudflared pos-local ya corre"
  else
    CFG="${CLOUDFLARED_CONFIG:-$HOME/.cloudflared/config.yml}"
    if [[ ! -f "$CFG" ]]; then
      warn "No hay $CFG — no se inicia túnel"
    else
      # Espera Caddy :8180 solo si vamos a levantar FE; si no, igual arranca (ingress ya apunta)
      start_bg tunnel "cloudflared tunnel --config \"$CFG\" run pos-local"
      log "Túnel pos-local en background (logs/tunnel.log)"
    fi
  fi
fi

# --- Frontend + Caddy ---
if (( SKIP_FE == 0 )); then
  if port_open 4210 && port_open 8180; then
    log "Angular :4210 y Caddy :8180 ya corren"
  else
    log "Arrancando npm run start:sandbox (health 3011 + Angular 4210 + Caddy 8180)…"
    # Foreground: Ctrl+C detiene FE/Caddy; los MS siguen (usar stop-sandbox-env.sh)
    cd "$FRONT_ROOT"
    # Guarda el process group para stop
    npm run start:sandbox &
    FE_PID=$!
    write_pid fe "$FE_PID"
    wait_port 3011 "health sandbox" 60 || true
    wait_port 4210 "Angular sandbox" 180 || true
    wait_port 8180 "Caddy sandbox" 60 || true

    echo
    log "Sandbox arriba"
    echo "    Local:  http://localhost:4210"
    echo "    Proxy:  http://localhost:8180"
    if (( DO_TUNNEL == 1 )); then
      echo "    Túnel:  https://pos-sandbox.mayaksoluciones.com"
    fi
    echo "    Logs:   $LOG_DIR"
    echo "    Parar:  $SCRIPT_DIR/stop-sandbox-env.sh"
    echo
    # Mantener el script vivo con el FE
    wait "$FE_PID" || true
  fi
else
  echo
  log "MS sandbox listos (--skip-fe). Arranca FE con: cd infinito-ai-front && npm run start:sandbox"
  if (( DO_TUNNEL == 1 )); then
    echo "    Túnel: https://pos-sandbox.mayaksoluciones.com (tras Caddy :8180)"
  fi
  echo "    Parar: $SCRIPT_DIR/stop-sandbox-env.sh"
fi
