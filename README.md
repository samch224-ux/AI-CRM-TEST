# AI CRM 客户聊天记录分析系统

基于 Kimi AI 的智能客户对话分析工具。

## 功能特性

- 🤖 **AI 智能分析** - 接入 Kimi 大模型，自动分析聊天记录
- 📊 **多维度洞察** - 摘要、意图、情绪、建议、关键信息
- ⚡ **实时响应** - 快速获取分析结果
- 💻 **简洁界面** - 现代化 UI 设计

## 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JS
- **后端**: Node.js + Express
- **AI**: Moonshot Kimi API

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的 Kimi API Key：

```bash
cp .env.example .env
# 编辑 .env 文件，设置 KIMI_API_KEY
```

### 3. 启动服务

```bash
npm start
```

服务启动后：
- 前端页面: http://localhost:3001
- API 端点: http://localhost:3001/api/analyze
- 健康检查: http://localhost:3001/health

### 4. 使用

打开浏览器访问 http://localhost:3001，粘贴客户聊天记录，点击"AI 分析"。

## 开发模式

```bash
npm run dev
```

使用 nodemon 自动重启服务。

## 目录结构

```
AI-CRM-TEST/
├── backend/
│   ├── public/          # 前端静态文件
│   │   └── index.html   # 主页面
│   ├── server.js        # 后端服务
│   ├── package.json     # 依赖配置
│   └── .env             # 环境变量（不提交到git）
└── README.md
```

## 注意事项

- `.env` 文件包含敏感信息，**不要提交到 GitHub**
- 已在 `.gitignore` 中排除 `.env`
- API Key 请妥善保管

## 下一步计划

- [ ] 历史记录保存
- [ ] 批量分析功能
- [ ] 导出 PDF 报告
- [ ] 部署到线上服务器

---

Made with 🔥 by 暖宝宝
