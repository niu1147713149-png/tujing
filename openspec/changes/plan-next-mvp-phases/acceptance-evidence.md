# 验收证据矩阵

## 订单中心工作流

| 验收点 | 证据类型 | 主要文件 / 接口 | 验证方式 |
| --- | --- | --- | --- |
| 首页或历史页可新建订单并进入工作台 | 页面跳转 + 接口返回 | `HomePage.tsx`、`HistoryPage.tsx`、`NewOrderModal.tsx`、`POST /api/orders` | Playwright 烟测 / 手动联调 |
| 历史页可进入最近任务或回到工作台 | 页面状态 | `HistoryPage.tsx`、`/api/orders`、`/api/orders/{orderId}/tasks` | Playwright / 手动回归 |
| 删除订单会级联清理任务与结果图 | 接口返回 + 数据变化 | `DELETE /api/orders/{orderId}`、`order_store.py`、`image_store.py` | API 验证 + 本地数据检查 |

## 任务状态韧性

| 验收点 | 证据类型 | 主要文件 / 接口 | 验证方式 |
| --- | --- | --- | --- |
| queued / processing / failed / timeout 文案明确 | 页面状态 + API 错误文案 | `GeneratingLoader.tsx`、`ResultPage.tsx`、`api/client.ts`、`gemini.py` | 页面检查 + 接口异常验证 |
| 服务重启后恢复未完成任务 | 后端行为 | `main.py`、`task_runner.py`、`task_store.py` | 本地脚本 / 数据状态检查 |
| 重新生成沿用原任务上下文 | 接口返回 + 页面行为 | `POST /api/tasks/{taskId}/regenerate`、`ResultPage.tsx` | API + 页面联调 |
| 部分成功批次仍可下载成功结果 | 页面状态 | `ResultPage.tsx`、`/api/tasks/group/{groupId}`、`/api/tasks/groups/{groupId}/download` | 本地任务验证 |

## 发布就绪护栏

| 验收点 | 证据类型 | 主要文件 / 接口 | 验证方式 |
| --- | --- | --- | --- |
| 提交前暴露后端 / 模型配置状态 | 页面状态 | `GeneratePage.tsx`、`/api/health`、`/api/models` | 页面检查 |
| 本地烟测覆盖首页 / 生成页 / 结果页 / `/api/tasks` | 自动化脚本输出 | `Makefile`、`scripts/playwright_smoke_generate.sh`、`scripts/playwright_smoke_generate.ps1` | 运行 `make smoke-generate` |
| 中文文案验收覆盖首页 / 生成页 / 结果页 / API 错误 | 文案检查记录 | `HomePage.tsx`、`GeneratePage.tsx`、`ResultPage.tsx`、`api/client.ts`、后端错误信息 | 页面巡检 + 构建后检查 |
