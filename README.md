# 图鲸 MVP 项目说明

> 一句提示词，快速生成主图、详情页长图和营销海报。

---

## 项目简介

图鲸是一个面向电商场景的 AI 出图工具 MVP，当前聚焦最小可运行链路：

- 选择模板
- 填写提示词
- 服务端调用 Gemini 兼容接口生成图片
- 结果页轮询任务状态并展示图片

当前版本已经从“单次请求硬等结果”升级为“任务型生成流程”，减少了长请求超时对前端体验的影响。

> 开发前请优先阅读并遵守：`docs/PROJECT_STANDARDS.md`

---

## 当前功能状态

### 已完成
- Next.js 14 + TypeScript + Tailwind CSS 基础框架
- 品牌首页 `/`
- 生成页 `/generate`
- 任务结果页 `/result/[taskId]`
- 模板选择组件
- Prompt 示例快捷选择
- 任务创建接口 `/api/tasks`
- 任务查询接口 `/api/tasks/[taskId]`
- 再来一张接口 `/api/tasks/[taskId]/regenerate`
- 配置检测接口 `/api/config-check`
- Gemini 兼容图片生成封装
- 文件型任务存储（无新增依赖版本）

### 进行中
- 中文文案与编码稳定性清理
- 首页/生成页/结果页的高级感视觉细节优化
- 任务流下的错误提示与状态展示增强

### 下一步
- 完整项目规范文档（前端 UI / 后端 / 测试）
- 更完整的任务状态信息展示
- 历史任务记录与任务列表页
- 文件型任务存储升级为 SQLite 持久化

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 14 App Router | 页面、路由、API 一体化 |
| UI | React 18 | 组件化页面结构 |
| 类型系统 | TypeScript | 严格类型约束 |
| 样式 | Tailwind CSS | 原子化样式与设计系统扩展 |
| 任务存储 | 本地 JSON 文件 | 当前阶段的轻量任务持久化 |
| 模型调用 | Gemini 兼容 API | 文生图生成 |

---

## 目录结构

```text
tujing/
├─ app/
│  ├─ page.tsx
│  ├─ generate/page.tsx
│  ├─ result/page.tsx
│  ├─ result/[taskId]/page.tsx
│  └─ api/
│     ├─ config-check/route.ts
│     ├─ generate/route.ts
│     ├─ upload/route.ts
│     └─ tasks/
│        ├─ route.ts
│        └─ [taskId]/
│           ├─ route.ts
│           └─ regenerate/route.ts
│
├─ components/
├─ config/
├─ docs/
├─ lib/
│  ├─ ai-config.ts
│  ├─ gemini.ts
│  ├─ task-runner.ts
│  └─ task-store.ts
└─ data/
```

---

## 当前运行方式

```bash
npm install
npm run build
npm run start -- -p 3001
```

访问：

```bash
http://127.0.0.1:3001
```

---

## 配置文件

项目使用：

```text
config/ai.config.json
```

示例：

```json
{
  "domain": "https://generativelanguage.googleapis.com",
  "apiKey": "YOUR_GEMINI_API_KEY",
  "modelId": "gemini-2.5-flash-image"
}
```

说明：
- `domain`：上游 Gemini 兼容网关
- `apiKey`：模型服务密钥
- `modelId`：当前图片模型 ID

---

## 生成流程

```text
用户在 /generate 选择模板并填写 prompt
-> POST /api/tasks 创建任务
-> 返回 taskId
-> 跳转 /result/[taskId]
-> 前端轮询 GET /api/tasks/[taskId]
-> 任务成功后展示 resultUrl
```

---

## 注意事项

- 当前是文生图优先版本，不依赖上传参考图
- 当前使用本地文件型任务存储，适合开发阶段
- 用户可见文案默认必须保持简体中文
- 发现 `? / ?? / ??? / 乱码` 视为缺陷，必须继续修复

---

## 版本状态

- 品牌名称：图鲸 / Tujing
- 当前阶段：MVP / Task-based generation flow
- 维护目标：先稳定任务流，再升级存储与历史记录
