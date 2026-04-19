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

## Docker 单镜像部署

当前仓库支持打成一个镜像，在 Ubuntu 上直接运行：

- 前端端口：`3888`
- 后端端口：`8000`

镜像内结构：

- `nginx` 提供前端静态页面，监听 `3888`
- `uvicorn` 提供 FastAPI 后端，监听 `8000`
- 前端访问 `/api` 和 `/outputs` 时，由容器内 `nginx` 反向代理到后端

### 1) 构建镜像

在仓库根目录执行：

```bash
docker build -t tujing:latest .
```

### 2) 准备运行目录

建议在 Ubuntu 服务器准备：

```text
/opt/tujing/
├─ config/
│  └─ ai.config.json
└─ data/
```

其中：

- `/opt/tujing/config/ai.config.json`：真实模型配置
- `/opt/tujing/data/`：SQLite 数据库和输出图片持久化目录

可以先复制示例文件再修改：

```bash
mkdir -p /opt/tujing/config /opt/tujing/data
cp config/ai.config.example.json /opt/tujing/config/ai.config.json
```

### 3) 运行容器

```bash
docker run -d \
  --name tujing \
  -p 3888:3888 \
  -p 8000:8000 \
  -v /opt/tujing/config/ai.config.json:/app/config/ai.config.json:ro \
  -v /opt/tujing/data:/app/backend/data \
  --restart unless-stopped \
  tujing:latest
```

### 3.1) 更推荐：在 Ubuntu 上用 docker compose 直接拉起

如果你是在 Ubuntu 服务器里直接拉代码部署，推荐用仓库自带的：

- `docker-compose.yml`
- `scripts/docker-up.sh`
- `scripts/docker-redeploy.sh`

先准备真实配置：

```bash
cp config/ai.config.example.json config/ai.config.json
```

然后编辑：

```text
config/ai.config.json
```

再执行：

```bash
chmod +x scripts/docker-up.sh
./scripts/docker-up.sh
```

如果你后续是“代码已拉到 Ubuntu 服务器，只想一键更新到最新版本并重启容器”，推荐直接用：

```bash
chmod +x scripts/docker-redeploy.sh
./scripts/docker-redeploy.sh
```

这个脚本会：

1. 检查运行配置是否存在
2. 默认执行 `git fetch --all --prune` + `git pull --ff-only`
3. 调用 `scripts/docker-up.sh`
4. 自动完成重建与重启

如果当前目录有未提交修改，脚本会停止，避免把本地改动覆盖掉。

如果你明确只想“跳过 git pull，直接用当前代码重建”，可以：

```bash
TUJING_SKIP_GIT_PULL=1 ./scripts/docker-redeploy.sh
```

默认会使用：

- 配置文件：`./config/ai.config.json`
- 数据目录：`./backend/data`
- 前端端口：`3888`
- 后端端口：`8000`

如果你要自定义，也可以临时传环境变量：

```bash
TUJING_CONFIG_FILE=/opt/tujing/config/ai.config.json \
TUJING_DATA_DIR=/opt/tujing/data \
TUJING_FRONTEND_PORT=3888 \
TUJING_BACKEND_PORT=8000 \
./scripts/docker-up.sh
```

### 4) 访问方式

- 前端：`http://<服务器IP>:3888`
- 后端健康检查：`http://<服务器IP>:8000/api/health`

### 5) 查看日志

```bash
docker logs -f tujing
```

### 6) 停止与重启

```bash
docker stop tujing
docker start tujing
docker restart tujing
```

如果使用 compose：

```bash
docker compose stop
docker compose start
docker compose restart
```

### 7) 更新镜像后重建

```bash
docker stop tujing
docker rm tujing
docker build -t tujing:latest .
docker run -d \
  --name tujing \
  -p 3888:3888 \
  -p 8000:8000 \
  -v /opt/tujing/config/ai.config.json:/app/config/ai.config.json:ro \
  -v /opt/tujing/data:/app/backend/data \
  --restart unless-stopped \
  tujing:latest
```

如果使用 compose，更简单：

```bash
docker compose up -d --build
```

说明：

- 不要把真实 `config/ai.config.json` 直接打进镜像
- 当前后端任务执行与 SQLite 数据库都更适合单实例运行
- 如果后续要做多实例部署，需要先重构任务队列和存储方案

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
