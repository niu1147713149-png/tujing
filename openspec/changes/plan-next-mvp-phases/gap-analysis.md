# 差距盘点

## 盘点范围

- 首页：`frontend/src/pages/HomePage.tsx`
- 生成页：`frontend/src/pages/GeneratePage.tsx`
- 结果页：`frontend/src/pages/ResultPage.tsx`
- 历史页：`frontend/src/pages/HistoryPage.tsx`
- 任务 / 订单接口：`backend/app/routers/tasks.py`、`backend/app/routers/orders.py`
- 任务执行与恢复：`backend/app/services/task_runner.py`、`task_store.py`、`gemini.py`

## 能力 1：订单中心工作流

### 当前已有
- 首页与历史页都提供“新建订单”入口，落到 `NewOrderModal` 创建订单。
- 生成页依赖 `orderId` 加载订单备注，缺少订单时会回退。
- 历史页按订单展示模板、模型、任务数量、成功数、失败数、提示词摘要。
- 结果页支持返回工作台、历史记录与重新生成一批。
- 后端已提供订单创建、列表、详情、按订单查任务与删除接口。

### 当前差距
- 还缺少一次可重复的闭环联调证据，证明“新建订单 -> 生成 -> 回历史 -> 回结果 / 工作台”链路稳定。
- 历史页卡片与异常 / 空状态虽然已经具备主要信息，但仍缺少浏览器端回归截图或自动化证据。

## 能力 2：任务状态韧性

### 当前已有
- `GeneratingLoader` 已用简体中文解释“请求已发出、正在等待上游结果”。
- 后端在启动时会把 stuck 的 processing 任务重置到 queued，并恢复未完成任务。
- 重新生成接口会继承原任务的模板、提示词、订单和模型配置。
- 结果页已展示批次进度、成功数、失败数，并允许下载成功结果。

### 当前差距
- 仍缺少对“服务重启后恢复未完成任务”的运行级验证记录。

## 能力 3：发布就绪护栏

### 当前已有
- 生成页会探测 `/api/health`。
- 后端会在创建任务时校验订单存在性与模型配置合法性。
- README 与 `docs/PROJECT_STANDARDS.md` 已明确当前架构和中文文案规范。

### 当前差距
- 当前 WSL 环境下的 Playwright 浏览器运行时仍不完整，浏览器端烟测无法在本机会话中完成最终运行验证。
- 仍需在具备 Playwright 浏览器依赖的环境中完成首页 / 生成页 / 结果页的最终可视化验收。
