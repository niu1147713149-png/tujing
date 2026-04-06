# 图鲸 Gemini 最小可运行接入设计

## 目标
- 保持图鲸当前页面结构可运行
- 增加可编辑 prompt
- 通过文件配置 Gemini 域名、API Key、模型 ID
- 服务端调用 Gemini 生图并返回前端展示

## 约束
- 不新增第三方依赖
- API Key 只允许服务端读取
- 保持当前页面结构，不额外做配置 UI

## 方案
1. 新增 `config/ai.config.json` 作为本地运行配置文件
2. 新增 `config/ai.config.example.json` 作为模板
3. `app/generate/page.tsx` 增加 prompt 输入并写入本地存储
4. `app/result/page.tsx` 或 `app/result/[taskId]/page.tsx` 读取 prompt 后发起生成流程
5. 由服务端封装 Gemini `generateContent` 调用

## 数据流
1. 用户选择模板并填写 prompt
2. 前端发起生成请求或创建生成任务
3. 服务端读取配置，调用 Gemini 图片生成模型
4. 服务端解析返回的图片 base64，转成 `data:image/...;base64,...`
5. 前端展示结果并可下载

## 当前推荐配置
- 域名：`https://generativelanguage.googleapis.com`
- 模型：`gemini-2.5-flash-image`

## 暂不包含
- 历史记录
- 多图生成
- 对象存储
- 复杂重试与限流
