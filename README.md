# Flyelep MVP — AI 跨境电商设计工具

> 用 AI 替代美工，1 小时生成亚马逊主图、详情页、营销海报，成本降低 90%。

---

## 项目简介

本项目是 [Flyelep 飞象](https://flyelep.cn) 的竞品 MVP，面向中小型跨境电商卖家。

**核心价值**：
- **快**：30-60 秒生成，无需排队等美工
- **便宜**：9.9 元起，远低于外包（50-200 元/套）
- **准**：基于亚马逊规范预设模板，出图即可上架

---

## 当前开发状态（2026-04-01）

### ✅ 已完成
- Next.js 14 项目框架（TypeScript + Tailwind CSS）
- 三个核心页面路由：`/`、`/generate`、`/result`
- 首页：图片上传（点击选择，JPG/PNG，5MB 限制，预览）
- 模板选择页：3 种模板卡片（亚马逊主图、详情页、营销海报）
- 结果页：3 秒 mock 模拟生成 + 图片展示 + 下载按钮
- localStorage 跨页面状态传递（图片 URL + 选中模板）

### ❌ 待开发（Codex 接手部分）
- `components/` 下所有独立组件（见组件清单）
- 拖拽上传支持（当前仅支持点击选择）
- `app/api/upload/route.ts` — 服务端图片上传处理
- `app/api/generate/route.ts` — AI 生成接口（MVP 阶段返回 mock）
- 错误处理与用户提示（文件格式错误、超大文件等）
- 移动端响应式优化
- 加载进度条（当前只有 spinner，需改为进度条 + 提示文案轮播）

---

## 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Next.js (App Router) | 14.x | 全栈，含 API Routes |
| UI | React | 18.x | 函数组件 + Hooks |
| 类型 | TypeScript | 5.x | 严格模式 |
| 样式 | Tailwind CSS | 3.x | 原子化 CSS |
| 状态 | localStorage | — | MVP 阶段无需引入状态库 |
| 部署 | Vercel | — | 免费，推荐 |

---

## 目录结构

```
flyelep-mvp/
├── app/
│   ├── layout.tsx               # 根布局 ✅
│   ├── globals.css              # 全局样式 ✅
│   ├── page.tsx                 # 首页：图片上传 ✅（待拆组件）
│   ├── generate/
│   │   └── page.tsx             # 模板选择页 ✅（待拆组件）
│   ├── result/
│   │   └── page.tsx             # 结果展示页 ✅（待拆组件）
│   └── api/
│       ├── upload/
│       │   └── route.ts         # 图片上传 API ❌ 待开发
│       └── generate/
│           └── route.ts         # AI 生成 API ❌ 待开发
├── components/                  # ❌ 目录待创建
│   ├── ImageUploader.tsx        # 上传组件（支持拖拽）
│   ├── TemplateSelector.tsx     # 模板选择组件
│   ├── GeneratingLoader.tsx     # 加载动画（进度条）
│   └── ResultDisplay.tsx        # 结果展示 + 下载
├── public/
│   └── mock/                    # mock 示例图（可选）
├── package.json                 ✅
├── tailwind.config.js           ✅
├── tsconfig.json                ✅
└── DEVELOPMENT_SPEC.md          # 详细开发规范 ✅（必读）
```

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
open http://localhost:3000
```

---

## 页面流程

```
首页 (/)
  用户上传产品图片 → 点击「下一步」
        ↓
模板选择页 (/generate)
  显示已上传图片缩略图 → 选择模板类型
        ↓
结果页 (/result)
  3 秒 mock 加载动画 → 展示结果图
  [下载高清图]  [重新生成]  [返回首页]
```

---

## 配色规范

| 用途 | Tailwind 类 | 色值 |
|------|------------|------|
| 主色按钮 | `bg-blue-600` | `#2563EB` |
| 主色 hover | `hover:bg-blue-700` | `#1D4ED8` |
| 辅助/AI 感 | `text-purple-500` | `#8B5CF6` |
| 页面背景 | `from-blue-50 to-purple-50` | 渐变 |
| 卡片 | `bg-white shadow-lg rounded-xl` | 白底 |
| 成功色 | `text-green-500` | `#10B981` |

---

## 给 Codex 的接手说明

> **重要**：请先完整阅读 [DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md)，里面有详细的组件 Props 接口、API 规范、数据流和开发优先级。

### 推荐开发顺序

```
Step 1  创建 components/ImageUploader.tsx    拖拽上传 + 预览
Step 2  创建 components/TemplateSelector.tsx  模板卡片列表
Step 3  创建 components/GeneratingLoader.tsx  进度条 + 提示文案
Step 4  创建 components/ResultDisplay.tsx     结果图展示 + 下载
Step 5  重构 app/page.tsx                     引用 ImageUploader
Step 6  重构 app/generate/page.tsx            引用 TemplateSelector
Step 7  重构 app/result/page.tsx              引用 GeneratingLoader + ResultDisplay
Step 8  实现 app/api/upload/route.ts          接收图片，返回临时 URL
Step 9  实现 app/api/generate/route.ts        接收参数，返回 mock 图片 URL
Step 10 错误处理 + 移动端适配
```

### 注意事项

- MVP 阶段 AI 生成接口**返回 mock 数据即可**，不对接真实 API
- 组件全部使用 `'use client'` + 函数组件 + TypeScript
- 样式只用 Tailwind，**不写内联 style**
- 状态传递继续用 localStorage，不引入 Redux / Zustand

---

## 环境变量（后续接入真实 AI 时配置）

```bash
# .env.local
AI_API_KEY=your_api_key_here
AI_API_BASE_URL=https://api.liblib.art
```

---

## 部署

```bash
# Vercel 一键部署
npm install -g vercel
vercel
```

---

**预计上线**: 2026-04-14
**当前版本**: v0.1.0
**文档更新**: 2026-04-01
