#!/usr/bin/env bash
# Detiene procesos arrancados por start-sandbox-env.sh (MS, FE, túnel, mail opcional).
# No toca el ambiente de desarrollo (:4200 / :8081 / :8088 / :8095).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$SCRIPT_DIR/.run"
LOG_DIR="$SCRIPT_DIR/logs"

log() { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }

kill_pid_file() {
  local key="$1"
  local f="$RUN_DIR/${key}.pid"
  if [[ ! -f "$f" ]]; then
    return 0
  fi
  local pid
  pid="$(cat "$f" 2>/dev/null || true)"
  if [[ -z "${pid:-}" ]]; then
    rm -f "$f"
    return 0
  fi
  if kill -0 "$pid" 2>/dev/null; then
    log "Matando $key (pid $pid) y su grupo…"
    # Mata el árbol (mvn → java, npm → ng/caddy)
    kill -- -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 -- -"$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
    fi
  else
    log "$key (pid $pid) ya no corre"
  fi
  rm -f "$f"
}

# Por nombre: por si el pidfile falló o se relanzó a mano
kill_port_listeners() {
  local port="$1"
  local label="$2"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi
  log "Liberando :$port ($label): $pids"
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep 1
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  fi
}

mkdir -p "$RUN_DIR"

log "Deteniendo sandbox…"

for key in fe tunnel puente relational security mail; do
  kill_pid_file "$key"
done

# Puertos solo sandbox (no tocar 4200/8080/8081/8088/8095/3001)
kill_port_listeners 4210 "Angular sandbox"
kill_port_listeners 8180 "Caddy sandbox"
kill_port_listeners 3011 "health sandbox"
kill_port_listeners 8181 "auth sandbox"
kill_port_listeners 8188 "relacional sandbox"
kill_port_listeners 8195 "puente sandbox"

# Túnel: solo si lo levantó este stack (pidfile). No matamos cloudflared genérico
# por si también sirve cotiza.dev en el mismo proceso — el pidfile ya lo cubre.
# Si quedó huérfano y solo sirve sandbox, el usuario puede: pkill -f 'cloudflared tunnel.*pos-local'

log "Sandbox detenido. Logs en $LOG_DIR (se conservan)."
