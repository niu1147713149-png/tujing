# Flyelep MVP 开发规范文档

## 项目概述

**项目名称**: Flyelep MVP - AI 跨境电商设计工具
**目标**: 用 AI 生成亚马逊主图、详情页、海报，降低跨境电商卖家设计成本
**技术栈**: Next.js 14 + React 18 + TypeScript + Tailwind CSS

---

## 核心功能（MVP 范围）

### 1. 图片上传
- 支持拖拽上传或点击选择
- 支持 JPG/PNG 格式
- 单次上传 1 张产品图
- 文件大小限制：5MB

### 2. 模板选择
- 3 种模板类型：
  - 亚马逊主图（1:1 正方形，2000x2000px）
  - 详情页长图（3:4 竖版）
  - 营销海报（16:9 横版）
- 每种类型提供 3-5 个预设风格

### 3. AI 生成
- 调用 AI 图像生成 API（暂用 mock 数据）
- 生成时间：模拟 3-5 秒
- 显示加载动画

### 4. 结果展示与下载
- 展示生成的图片
- 提供高清下载按钮
- 支持重新生成

---

## 技术架构

### 前端结构
```
app/
├── layout.tsx          # 根布局
├── page.tsx            # 首页（上传 + 选择模板）
├── generate/
│   └── page.tsx        # 生成页面
├── result/
│   └── page.tsx        # 结果页面
└── globals.css         # 全局样式

components/
├── ImageUploader.tsx   # 图片上传组件
├── TemplateSelector.tsx # 模板选择组件
├── GeneratingLoader.tsx # 加载动画组件
└── ResultDisplay.tsx   # 结果展示组件
```

### 状态管理
- 使用 React Context 或 URL 参数传递状态
- 不引入额外状态管理库（保持简单）

### API 路由
```
app/api/
├── upload/route.ts     # 处理图片上传
└── generate/route.ts   # 调用 AI 生成（MVP 阶段返回 mock 数据）
```

---

## UI/UX 设计规范

### 配色方案
- 主色：蓝色 (#3B82F6) - 专业、科技感
- 辅助色：紫色 (#8B5CF6) - AI 感
- 成功色：绿色 (#10B981)
- 背景：白色 + 浅灰 (#F9FAFB)

### 字体
- 中文：系统默认（-apple-system, "Noto Sans SC"）
- 英文：Inter, sans-serif

### 组件风格
- 圆角：8px（按钮）、12px（卡片）
- 阴影：使用 Tailwind 的 shadow-lg
- 按钮：大号（h-12）、圆角、悬停效果

### 响应式
- 移动端优先
- 断点：sm (640px), md (768px), lg (1024px)

---

## 页面流程

### 首页 (/)
1. 顶部：Logo + 标题
2. 中间：上传区域（大号虚线框，拖拽提示）
3. 底部：简短说明文字

### 模板选择页 (/generate)
1. 顶部：已上传图片预览（小图）
2. 中间：3 种模板类型卡片
3. 每个卡片：
   - 模板名称
   - 示例图
   - 选择按钮
4. 底部：返回按钮

### 生成中页面
1. 全屏加载动画
2. 进度提示文字："AI 正在生成中..."
3. 模拟进度条（3-5 秒）

### 结果页 (/result)
1. 顶部：生成的图片（大图展示）
2. 中间：操作按钮
   - 下载高清图
   - 重新生成
   - 返回首页
3. 底部：分享提示（可选）

---

## 数据流

### 上传流程
```
用户选择图片
→ 前端预览
→ 上传到 /api/upload
→ 返回临时 URL
→ 存储在状态中
```

### 生成流程
```
用户选择模板
→ 发送请求到 /api/generate
→ 传递：图片 URL + 模板类型
→ 后端调用 AI API（MVP 返回 mock）
→ 返回生成图片 URL
→ 跳转到结果页
```

---

## MVP 阶段简化

### 暂不实现
- ❌ 用户登录/注册
- ❌ 付费功能
- ❌ 历史记录
- ❌ 批量生成
- ❌ 在线编辑
- ❌ 多语言支持

### Mock 数据
- AI 生成：返回预设的示例图片 URL
- 不对接真实 AI API（节省成本）

---

## 开发优先级

### P0（必须完成）
1. 图片上传功能
2. 3 种模板选择
3. 生成流程（mock 数据）
4. 结果展示 + 下载

### P1（可选）
1. 响应式适配
2. 加载动画优化
3. 错误处理

### P2（后续迭代）
1. 真实 AI API 对接
2. 用户系统
3. 付费功能

---

## 代码规范

### TypeScript
- 所有组件使用 TypeScript
- 定义清晰的 Props 接口
- 避免使用 `any`

### 组件规范
- 函数式组件 + Hooks
- 单一职责原则
- Props 解构

### 样式规范
- 优先使用 Tailwind 类名
- 避免内联样式
- 复用常用样式组合

### 命名规范
- 组件：PascalCase（ImageUploader）
- 函数：camelCase（handleUpload）
- 常量：UPPER_SNAKE_CASE（MAX_FILE_SIZE）

---

## 部署计划

### 开发环境
```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

### 生产部署
- 平台：Vercel（免费）
- 域名：暂用 Vercel 提供的子域名
- 环境变量：AI_API_KEY（后续对接时添加）

---

## 下一步行动

### 交给 Codex 执行
1. 初始化 Next.js 项目
2. 配置 Tailwind CSS
3. 创建页面结构和路由
4. 实现 ImageUploader 组件
5. 实现 TemplateSelector 组件
6. 实现 API 路由（mock 数据）
7. 实现结果页面
8. 测试完整流程

---

**文档版本**: v1.0
**创建日期**: 2026-03-31
**负责人**: Claude + Codex
