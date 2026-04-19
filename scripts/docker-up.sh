#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export TUJING_CONFIG_FILE="${TUJING_CONFIG_FILE:-$ROOT_DIR/config/ai.config.json}"
export TUJING_DATA_DIR="${TUJING_DATA_DIR:-$ROOT_DIR/backend/data}"
export TUJING_FRONTEND_PORT="${TUJING_FRONTEND_PORT:-3888}"
export TUJING_BACKEND_PORT="${TUJING_BACKEND_PORT:-8000}"

if [[ ! -f "$TUJING_CONFIG_FILE" ]]; then
  echo "未找到运行配置：$TUJING_CONFIG_FILE"
  echo "请先准备真实的 ai.config.json，再执行本脚本。"
  exit 1
fi

mkdir -p "$TUJING_DATA_DIR"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "当前系统未安装 docker compose。"
  echo "请先安装 Docker Compose 插件或 docker-compose。"
  exit 1
fi

cd "$ROOT_DIR"

echo "使用配置文件：$TUJING_CONFIG_FILE"
echo "使用数据目录：$TUJING_DATA_DIR"
echo "前端端口：$TUJING_FRONTEND_PORT"
echo "后端端口：$TUJING_BACKEND_PORT"

"${COMPOSE_CMD[@]}" up -d --build
"${COMPOSE_CMD[@]}" ps

