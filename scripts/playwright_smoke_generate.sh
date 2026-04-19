#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_LOG="$ROOT_DIR/backend-smoke.log"
BACKEND_ERR="$ROOT_DIR/backend-smoke.err.log"
FRONTEND_LOG="$ROOT_DIR/frontend-smoke.log"
FRONTEND_ERR="$ROOT_DIR/frontend-smoke.err.log"

cleanup_ports() {
  for port in 5173 8000; do
    if command -v lsof >/dev/null 2>&1; then
      lsof -ti tcp:"$port" | xargs -r kill -9 || true
    else
      fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    fi
  done
}

wait_http_ready() {
  local url="$1"
  local timeout="${2:-30}"
  local start_ts
  start_ts="$(date +%s)"

  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    if (( "$(date +%s)" - start_ts >= timeout )); then
      echo "等待服务就绪超时：$url" >&2
      return 1
    fi
    sleep 0.5
  done
}

cleanup() {
  playwright-cli close-all >/dev/null 2>&1 || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" >/dev/null 2>&1 || true
}

rm -f "$BACKEND_LOG" "$BACKEND_ERR" "$FRONTEND_LOG" "$FRONTEND_ERR"
cleanup_ports
trap cleanup EXIT

(
  cd "$BACKEND_DIR"
  python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
) >"$BACKEND_LOG" 2>"$BACKEND_ERR" &
BACKEND_PID=$!

(
  cd "$FRONTEND_DIR"
  npm run dev -- --host 127.0.0.1 --port 5173
) >"$FRONTEND_LOG" 2>"$FRONTEND_ERR" &
FRONTEND_PID=$!

wait_http_ready "http://127.0.0.1:8000/api/health"
wait_http_ready "http://127.0.0.1:8000/api/tasks"
wait_http_ready "http://127.0.0.1:5173"

playwright-cli close-all >/dev/null 2>&1 || true
playwright-cli open http://127.0.0.1:5173 >/dev/null
playwright-cli run-code "async page => {
  await page.getByRole('button', { name: '新建订单' }).click();
  await page.getByPlaceholder('例如：王小姐的春季上新 / 批次 A...').fill('烟测订单');
  await page.getByRole('button', { name: '进入专属工作台' }).click();
  await page.waitForURL(/\\/generate\\//);
  await page.getByRole('button', { name: '立即生成' }).click();
  await page.waitForURL(/\\/result\\//);
}" >/dev/null
sleep 3

PAGE_URL="$(playwright-cli --raw eval "location.href" | tr -d '"\r\n ')"
PAGE_TEXT="$(playwright-cli --raw eval "document.body.innerText" | tr -d '\r')"
CONSOLE_LOG="$(playwright-cli console || true)"
NETWORK_LOG="$(playwright-cli network || true)"

if [[ "$PAGE_URL" != *"/result/"* ]]; then
  echo "SMOKE_FAIL"
  echo "点击生成后未跳转到结果页。当前地址：$PAGE_URL"
  exit 1
fi

if [[ "$PAGE_TEXT" != *"生成状态"* && "$PAGE_TEXT" != *"任务状态读取失败"* && "$PAGE_TEXT" != *"渲染结果已就绪"* ]]; then
  echo "SMOKE_FAIL"
  echo "结果页未出现预期状态文案。"
  exit 1
fi

echo "SMOKE_OK"
echo "PAGE_URL=$PAGE_URL"
echo "---PLAYWRIGHT_CONSOLE---"
echo "$CONSOLE_LOG"
echo "---PLAYWRIGHT_NETWORK---"
echo "$NETWORK_LOG"
echo "---BACKEND_STDOUT---"
[[ -f "$BACKEND_LOG" ]] && cat "$BACKEND_LOG"
echo "---BACKEND_STDERR---"
[[ -f "$BACKEND_ERR" ]] && cat "$BACKEND_ERR"
echo "---FRONTEND_STDOUT---"
[[ -f "$FRONTEND_LOG" ]] && cat "$FRONTEND_LOG"
echo "---FRONTEND_STDERR---"
[[ -f "$FRONTEND_ERR" ]] && cat "$FRONTEND_ERR"
