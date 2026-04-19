#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="/app/config/ai.config.json"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "未找到运行配置：$CONFIG_FILE"
  echo "请在 docker run 时挂载真实的 ai.config.json 到 /app/config/ai.config.json"
  exit 1
fi

cd /app/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM

cd /app
nginx -g 'daemon off;' &
NGINX_PID=$!

wait -n "$BACKEND_PID" "$NGINX_PID"
STATUS=$?

kill "$BACKEND_PID" "$NGINX_PID" 2>/dev/null || true
wait "$BACKEND_PID" 2>/dev/null || true
wait "$NGINX_PID" 2>/dev/null || true

exit "$STATUS"
