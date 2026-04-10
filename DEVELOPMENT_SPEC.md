# 图鲸 MVP 开发规范文档

## 项目概述

**项目名称**：图鲸 MVP - AI 电商设计工具  
**目标**：通过任务型生成流程，稳定完成电商主图、详情页长图和营销海报的 AI 出图能力。  
**技术栈**：Next.js 14 + React 18 + TypeScript + Tailwind CSS

---

## 当前产品形态

### 核心能力
1. 模板选择
2. Prompt 输入
3. 创建生成任务
4. 轮询任务状态
5. 展示生成结果
6. 再来一张 / 返回修改 / 下载图片

### 当前生成模式
- 文生图优先
- 任务型生成优先
- 不再依赖单次请求同步等待上游返回

---

## 前端结构规范

### 页面结构
```text
app/
├─ page.tsx                  # 首页
├─ generate/page.tsx         # 生成页
├─ result/page.tsx           # 兼容跳转页
├─ result/[taskId]/page.tsx  # 任务结果页
└─ api/                      # Route Handlers
```

### 组件结构
```text
components/
├─ TemplateSelector.tsx
├─ GeneratingLoader.tsx
├─ ResultDisplay.tsx
├─ ImageUploader.tsx
└─ template-options.ts
```

### 前端约束
- 页面使用函数组件 + Hooks
- 组件职责单一
- 页面级逻辑优先收敛在页面文件中
- 公共数据定义放入 `components/template-options.ts` 或 `lib/`
- 所有用户可见文案保持简体中文
- 所有源码按 UTF-8 保存

---

## 后端开发规范

### API 分层
- `app/api/*` 只做请求入口与响应包装
- 任务状态与持久化逻辑放在 `lib/task-store.ts`
- 生成执行逻辑放在 `lib/task-runner.ts`
- 上游模型调用封装放在 `lib/gemini.ts`
- 配置加载与校验放在 `lib/ai-config.ts`

### 当前接口
```text
POST /api/config-check
POST /api/generate                # 兼容旧流程，后续可逐步弱化
POST /api/tasks                   # 创建任务
GET  /api/tasks/[taskId]          # 查询任务
POST /api/tasks/[taskId]/regenerate
POST /api/upload                  # 兼容保留
```

### 后端约束
- 不在 API 路由里堆积大段业务逻辑
- 所有失败场景返回明确中文错误信息
- 超时必须说明：请求是否已发出、是否在等待上游、是否可能后台继续生成
- 请求日志需包含 requestId / taskId / elapsedMs 等关键信息
- 若后续切到 SQLite，保持 task-store 这一抽象边界不变

---

## 状态与任务规范

### 任务状态
```ts
queued
processing
succeeded
failed
```

### 任务字段建议
```ts
id
template
prompt
status
resultUrl
errorMessage
requestId
providerModel
createdAt
updatedAt
```

### 行为规范
- 创建任务后立即返回 taskId
- 结果页通过轮询获取状态
- 不依赖前端长时间等待一个 HTTP 响应
- 再来一张通过创建新任务实现，而不是覆盖旧任务

---

## 前端 UI 设计规范

### 设计方向
- 深色基调
- 高级感 / 工具感 / 克制感优先
- 参考方向：Linear 主基调
- 结果图优先于装饰元素

### UI 原则
1. 页面必须有明确视觉层级
2. 卡片边界弱、信息层级强
3. 结果图是主角，控件不能喧宾夺主
4. Prompt 区必须像工作台，而不是表单堆砌
5. 错误、等待、成功状态要一眼分辨

### 字符安全规范
为了避免编码污染：
- 优先使用稳定字符
- 用 `/` 代替 `·`
- 用 `x` 代替 `×`
- 谨慎使用特殊符号如 `•`, `✦`, `→`

### 文案规范
- 默认简体中文
- 避免半专业、半口语、半乱码的混杂表达
- 状态文案必须能让用户理解”当前发生了什么”

#### 前端 copy 禁止项
以下内容不得出现在任何用户可见的页面文案中：

1. **开发阶段描述**：如”先验证可用性”、”MVP”、”先追速度”等内部决策语言
2. **自嘲或贬低性表达**：如”草台 demo”、”实验项目”，会损害产品可信度
3. **技术实现细节**：如”配置文件驱动”、”域名 / Key / 模型 ID 可替换”，属于开发者视角，不是用户价值
4. **对比性否定句**：如”不是 X，而是 Y”，否定项会留下负面印象

#### 正确写法方向
- 描述用户能得到什么，而不是系统怎么实现的
- 用肯定句，不用否定句做对比
- 功能名称面向结果，不面向技术路径

---

## 测试规范

### 最低验证要求
每次涉及用户可见变更后至少检查：
1. 首页 `/`
2. 生成页 `/generate`
3. 结果页 `/result/[taskId]`
4. 配置检测接口
5. 任务创建与轮询接口

### 最低命令验证
```bash
npm run build
npx tsc --noEmit
```

### 接口验证建议
- 创建任务是否返回 `taskId`
- 查询任务是否能得到 `queued / processing / succeeded / failed`
- 超时场景是否返回明确中文说明
- 再来一张是否生成新任务而不是覆盖旧任务

### 文案与编码验证
- 任何 `? / ?? / ??? / 乱码` 均视为阻塞问题
- 修改中文文案后必须重新检查页面实际渲染结果
- 不能只看源码，必须看网页最终结果

---

## 命名规范

### 品牌命名
- 中文：图鲸
- 英文：Tujing
- 文件/前缀：`tujing`

### 代码命名
- 组件：PascalCase
- 函数：camelCase
- 常量：UPPER_SNAKE_CASE
- 任务 ID：`task_<timestamp>_<random>`

---

## 后续演进建议

### Phase 1
- 稳定任务流
- 清理乱码
- 完整补齐规范文档

### Phase 2
- 文件型任务存储升级 SQLite
- 增加历史任务记录
- 结果页支持更多任务元信息

### Phase 3
- 图生图模式
- 结果管理页
- Prompt 收藏与模板策略增强

---

## 当前维护原则
- 先稳定，再扩展
- 先任务流，再高级功能
- 先中文和编码正确，再做视觉精修
- 发现可见乱码，必须继续修，不得带入后续版本
