# 本轮验证记录

## 已完成

- `cd frontend && npm run build`
  - 结果：通过
- `python3 -m compileall backend/app`
  - 结果：通过
- `cd backend && python3 -m unittest tests.test_task_runner_scenarios -v`
  - 结果：通过
  - 覆盖：部分成功、全部失败、请求超时三类可重复场景
- API 集成验证
  - 校验 `/api/health`、`/api/models`
  - 创建订单成功
  - 创建 2 张批量任务成功
  - 验证任务初始状态为 `queued`
  - 轮询期间观察到 `queued` / `processing` 状态共存
  - 调用 `POST /api/tasks/{taskId}/regenerate` 后，新任务继承原订单、提示词、模板、模型
  - 删除订单后，订单、原任务、重新生成任务均返回 404，说明级联删除生效
- 服务层恢复验证
  - 人工将任务状态置为 `processing`
  - 调用 `reset_stuck_tasks()` 后任务恢复为 `queued`
  - `list_pending_task_ids()` 能重新发现该任务，说明恢复链路进入可继续执行状态
  - 以上仅覆盖服务层恢复逻辑，不等同于“服务启动后自动恢复执行”的运行级验证
- 代码检查
  - `HistoryPage.tsx` 已展示模板、模型、任务数量、成功数、失败数、提示词摘要，并包含 loading / error / empty 三类状态
  - `HistoryPage.tsx` 已包含删除订单的明确确认提示，说明会同时删除任务与结果图且无法恢复

## 当前阻塞

- `bash scripts/playwright_smoke_generate.sh`
  - 阻塞原因：当前 WSL 会话中的 `playwright-cli` 默认依赖 Chrome channel，且本机缺少可直接运行的 Linux Chrome 依赖库；下载的 Chromium 也因缺少系统库无法启动
  - 影响：脚本已更新，但本机会话暂不能完成浏览器端最终烟测

## 结论

- 文档基线、状态文案统一、生成前护栏、烟测脚本迁移已落地
- 后续优先继续补齐：
  1. 浏览器端闭环联调证据
  2. 服务启动后自动恢复执行的运行级验证
