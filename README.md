# 图鲸项目说明

> 图鲸当前已收口为前后端分离架构：`frontend/` + `backend/`。

---

## 项目简介

图鲸是一个面向电商场景的 AI 出图工具，当前主流程为：

- 前端工作台选择模板并填写提示词
- 后端创建任务并异步执行生成
- 前端轮询任务状态并展示结果

当前版本不再使用根目录 Next.js 一体化结构，唯一有效入口为：

- `frontend/`：Vite + React 前端
- `backend/`：FastAPI 后端

开发前请优先阅读并遵守：`docs/PROJECT_STANDARDS.md`

---

## 当前目录结构

```text
tujing/
├─ frontend/
│  ├─ public/
│  └─ src/
│     ├─ api/
│     ├─ components/
│     └─ pages/
├─ backend/
│  ├─ app/
│  │  ├─ routers/
│  │  └─ services/
│  └─ data/
├─ config/
├─ docs/
├─ scripts/
└─ Makefile
```

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vite + React 18 + TypeScript | 页面、路由、工作台交互 |
| 样式 | Tailwind CSS | 统一视觉系统 |
| 数据请求 | TanStack Query | 任务查询、轮询、变更 |
| 后端 | FastAPI | 任务接口、任务调度、静态结果输出 |
| 存储 | SQLite | 当前任务持久化 |
| 模型调用 | Gemini 兼容 API | 图片生成 |

---

## 本地启动

### 1) 启动后端

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2) 启动前端

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

访问：

```bash
http://127.0.0.1:5173
```

说明：

- Vite 会把 `/api` 和 `/outputs` 代理到 `http://127.0.0.1:8000`
- 如果 5173 被占用，可以改端口，但要按实际端口访问

---

## 构建检查

### 前端构建

```bash
cd frontend
npm run build
```

### 本地烟测

```bash
make smoke-generate
```

说明：

- 会自动清理 5173 / 8000 旧进程
- 会自动启动 frontend / backend
- 会用 Playwright 走一遍“开始生成 -> 跳结果页”链路
- 测试日志会输出前端 / 后端 / 浏览器信息，方便排查

### 后端依赖安装

```bash
cd backend
pip install -r requirements.txt
```

---

## 配置文件

项目使用根目录配置：

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

字段说明：

- `domain`：上游 Gemini 兼容网关
- `apiKey`：模型服务密钥
- `modelId`：图片模型 ID

---

## 当前接口

- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/{taskId}`
- `GET /api/tasks/group/{groupId}`
- `GET /api/tasks/groups/{groupId}/download`
- `POST /api/tasks/{taskId}/regenerate`
- `GET /outputs/*`

---

## 说明

- 用户可见文案默认必须保持简体中文
- 发现 `?`、`??`、`???`、乱码，视为缺陷
- 当前输出文件位于 `backend/data/outputs`
- 首页 Showcase 静态图片位于 `frontend/public/images`
