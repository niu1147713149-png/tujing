#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export TUJING_CONFIG_FILE="${TUJING_CONFIG_FILE:-$ROOT_DIR/config/ai.config.json}"
export TUJING_DATA_DIR="${TUJING_DATA_DIR:-$ROOT_DIR/backend/data}"
export TUJING_FRONTEND_PORT="${TUJING_FRONTEND_PORT:-3888}"
export TUJING_BACKEND_PORT="${TUJING_BACKEND_PORT:-8000}"
export TUJING_SKIP_GIT_PULL="${TUJING_SKIP_GIT_PULL:-0}"

if [[ ! -f "$TUJING_CONFIG_FILE" ]]; then
  echo "未找到运行配置：$TUJING_CONFIG_FILE"
  echo "请先准备真实的 ai.config.json，再执行本脚本。"
  exit 1
fi

mkdir -p "$TUJING_DATA_DIR"

cd "$ROOT_DIR"

if [[ "$TUJING_SKIP_GIT_PULL" != "1" ]]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if ! git diff --quiet || ! git diff --cached --quiet; then
      echo "仓库存在未提交改动，已停止自动更新，避免覆盖本地修改。"
      echo "如果你确认要跳过 git pull，只重建当前代码，请执行："
      echo "TUJING_SKIP_GIT_PULL=1 ./scripts/docker-redeploy.sh"
      exit 1
    fi

    BEFORE_COMMIT="$(git rev-parse --short HEAD)"
    echo "当前版本：$BEFORE_COMMIT"
    echo "正在拉取最新代码..."
    git fetch --all --prune
    git pull --ff-only
    AFTER_COMMIT="$(git rev-parse --short HEAD)"
    echo "更新后版本：$AFTER_COMMIT"
  else
    echo "当前目录不是 git 仓库，跳过 git pull。"
  fi
else
  echo "已设置 TUJING_SKIP_GIT_PULL=1，跳过 git pull。"
fi

echo "开始重建并重启容器..."
exec "$ROOT_DIR/scripts/docker-up.sh"
