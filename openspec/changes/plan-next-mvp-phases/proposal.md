## Why

图鲸已经完成前后端分离收口，并且正在围绕“订单 / 任务 / 结果页”重建主流程，但仓库当前还缺少一个可持续演进的 OpenSpec 规划基线。现在需要先把后续开发聚焦到稳定性、状态清晰度和交付质量上，避免继续沿用旧版 Next.js 时代的隐性假设。

## What Changes

- 为图鲸后续 MVP 阶段建立第一组 OpenSpec 规划产物，统一后续需求、设计与任务拆分方式。
- 按三个能力方向规划后续开发：订单中心工作流、任务状态韧性、发布就绪护栏。
- 将现有 `frontend/` + `backend/` 架构、异步任务生成模式、简体中文文案规范写入后续开发约束，作为未来实现与验收基线。
- 产出分阶段任务清单，明确先做稳定性与体验闭环，再扩展模板、模型或更大范围业务能力。

## Capabilities

### New Capabilities
- `order-centric-workflow`: 以订单为主线组织创建、继续生成、查看历史与删除清理流程。
- `task-status-resilience`: 明确异步出图任务的状态反馈、失败恢复、重试与重进结果页体验。
- `release-readiness-guardrails`: 在发布前对配置、文案、接口可用性和核心链路烟测建立统一护栏。

### Modified Capabilities
- 无。

## Impact

- 前端页面：`frontend/src/pages/HomePage.tsx`、`GeneratePage.tsx`、`HistoryPage.tsx`、`ResultPage.tsx`
- 前端组件与接口：`frontend/src/components/NewOrderModal.tsx`、`GeneratingLoader.tsx`、`frontend/src/api/orders.ts`、`frontend/src/api/tasks.ts`
- 后端接口与任务流：`backend/app/routers/orders.py`、`tasks.py`、`backend/app/services/task_runner.py`、`gemini.py`、`config.py`
- 文档与验证：`README.md`、`docs/PROJECT_STANDARDS.md`、`Makefile`、本地烟测 / Playwright 流程
- 预期不引入新依赖，优先在现有架构中完成增量演进。
