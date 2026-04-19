# OpenSpec 基线说明

本目录用于维护图鲸项目的规范化变更与能力基线。

## 当前有效架构

图鲸当前唯一有效的实现边界为：

- `frontend/`：Vite + React 前端页面与组件
- `backend/`：FastAPI 后端接口、任务流与存储
- `config/`：模型与环境配置
- `docs/`：项目规范与说明文档

## 当前产品主流程

1. 用户在首页或历史页新建订单
2. 进入 `/generate/:orderId` 工作台填写提示词并创建任务
3. 进入 `/result/:taskId` 结果页轮询任务状态
4. 从历史页按订单回看、继续生成或删除旧订单

## OpenSpec 使用约束

- `openspec/changes/`：进行中的变更提案、设计、规格与任务
- `openspec/specs/`：归档后的能力基线
- `docs/archive/`：仅保留历史资料，不作为当前实现依据

后续新增路线图、计划或规范时，必须以当前 `frontend/` + `backend/` 架构为准，不得再把旧版 Next.js 目录（如根目录 `app/`、`lib/`、`public/outputs/`、`next dev`）当作现行实现。
