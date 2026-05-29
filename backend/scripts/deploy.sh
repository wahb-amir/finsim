#!/usr/bin/env bash
# Server-side deploy script (invoked over SSH from GitHub Actions).
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:?DEPLOY_DIR is required}"
REPO_URL="${REPO_URL:?REPO_URL is required}"
GIT_REF="${GIT_REF:-main}"
PM2_APP_NAME="${PM2_APP_NAME:-finsim-api}"
HEALTH_PATH="${HEALTH_PATH:-/api/health}"
NGINX_TEST="${NGINX_TEST:-1}"
PM2_WAIT_MS="${PM2_WAIT_MS:-8000}"

log() { echo "[deploy] $*"; }
fail() { echo "::error::$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

require_cmd git
require_cmd node
require_cmd curl

if command -v pnpm >/dev/null 2>&1; then
  PKG_MGR=pnpm
elif command -v npm >/dev/null 2>&1; then
  PKG_MGR=npm
else
  fail "Install pnpm or npm on the VPS."
fi

require_cmd pm2

clone_or_pull() {
  if [[ -d "${DEPLOY_DIR}/.git" ]]; then
    log "Repository exists — pulling latest (${GIT_REF})"
    git -C "$DEPLOY_DIR" fetch origin --prune
    git -C "$DEPLOY_DIR" checkout "$GIT_REF"
    git -C "$DEPLOY_DIR" pull --ff-only origin "$GIT_REF"
  else
    log "Cloning repository into ${DEPLOY_DIR}"
    mkdir -p "$(dirname "$DEPLOY_DIR")"
    git clone --branch "$GIT_REF" --depth 1 "$REPO_URL" "$DEPLOY_DIR"
  fi
}

validate_env_file() {
  log "Validating backend/.env against .env.example"
  bash "${DEPLOY_DIR}/backend/scripts/validate-env.sh" "${DEPLOY_DIR}/backend"
}

install_dependencies() {
  log "Installing backend dependencies (${PKG_MGR})"
  if [[ "$PKG_MGR" == "pnpm" ]]; then
    cd "${DEPLOY_DIR}"
    if [[ -f "${DEPLOY_DIR}/pnpm-lock.yaml" ]]; then
      pnpm install --frozen-lockfile --filter @finsim/api...
    else
      pnpm install --filter @finsim/api...
    fi
  else
    cd "${DEPLOY_DIR}/backend"
    npm ci 2>/dev/null || npm install --omit=dev
  fi
}

restart_pm2() {
  log "Restarting PM2 app: ${PM2_APP_NAME}"
  cd "${DEPLOY_DIR}"
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --only "$PM2_APP_NAME" --update-env
  else
    pm2 start ecosystem.config.cjs --only "$PM2_APP_NAME"
  fi
  pm2 save
}

verify_nginx() {
  if [[ "$NGINX_TEST" != "1" ]]; then
    log "Skipping nginx test (NGINX_TEST=${NGINX_TEST})"
    return 0
  fi
  if ! command -v nginx >/dev/null 2>&1; then
    log "nginx not installed — skipping nginx -t"
    return 0
  fi
  log "Running nginx configuration test"
  if sudo -n nginx -t 2>/dev/null; then
    return 0
  fi
  if nginx -t 2>/dev/null; then
    return 0
  fi
  fail "nginx -t failed. Fix nginx config before deploying."
}

verify_pm2() {
  log "Verifying PM2 process"
  pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1 || fail "PM2 app '${PM2_APP_NAME}' is not registered."

  if ! pm2 status "$PM2_APP_NAME" 2>/dev/null | grep -qE 'online|│.*online'; then
    pm2 logs "$PM2_APP_NAME" --lines 30 --nostream || true
    fail "PM2 app '${PM2_APP_NAME}' is not online."
  fi
  log "PM2 app is online"
}

health_check() {
  # shellcheck disable=SC1091
  set -a
  # shellcheck source=/dev/null
  source "${DEPLOY_DIR}/backend/.env"
  set +a

  local port="${PORT:-5000}"
  local url="http://127.0.0.1:${port}${HEALTH_PATH}"
  log "Health check: ${url}"

  sleep 2
  local attempt
  for attempt in 1 2 3 4 5; do
    if curl -sf --max-time 10 "$url" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then
      log "Health check passed"
      return 0
    fi
    sleep 2
  done

  pm2 logs "$PM2_APP_NAME" --lines 40 --nostream || true
  fail "Health check failed after deploy (${url})."
}

main() {
  clone_or_pull
  validate_env_file
  install_dependencies
  restart_pm2
  sleep "$(( PM2_WAIT_MS / 1000 ))"
  verify_nginx
  verify_pm2
  health_check
  log "Deploy completed successfully"
}

main "$@"
