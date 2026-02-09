# 📋 Tasks Minimal - 极简任务管理器

基于 Markdown 和 Next.js 的 Kanban 任务管理器。

## 🎯 特性

- ✅ 自动读取 `.openclaw/workspace/tasks/daily/day_track/` 里的当天任务
- ✅ Kanban 三列：📋 Backlog / 🚀 In Progress / ✅ Done
- ✅ 实时 API 操作：添加、移动、删除任务
- ✅ 与 Chris 的自动化工作流集成（Morning Brief / Night Check）

## 🚀 快速开始

```bash
# 进入项目目录
cd /Users/mia/Documents/GitHub/tasks-webapp

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:3000
```

## 📋 Schema 说明

使用 Kanban 格式的 Markdown 文件：

```markdown
# 2026-02-09 任务追踪

## 📋 Backlog
- [ ] [#task-1] 搭建 thesis工作流
- [ ] [#task-2] 完善简历

## 🚀 In Progress

## ✅ Done

## 💤 睡眠后台任务
```

**格式规则：**
- 使用 checkbox 格式：`- [ ]`（未完成）和 `- [x]`（已完成）
- 每个任务必须有唯一 ID：`[#id]`
- 按任务状态分列

## 🎮 使用方法

1. **添加任务**：在输入框输入文本，点击"Add Task"
2. **移动任务**：点击 ← → ✓ 按钮在列之间移动
3. **删除任务**：点击 × 按钮删除任务
4. **自动保存**：所有操作通过 API 实时写入 Markdown 文件

## 📁 文件位置

- **任务文件**：`/Users/mia/.openclaw/workspace/tasks/daily/day_track/[YYYY-MM-DD].md`
- **自动读取当天**：API 根据当前日期自动加载对应文件
- **自动创建**：如果文件不存在，会自动创建模板

## 🔧 技术栈

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Node.js `fs` 模块（服务端 API routes）

## 🤖 与自动化工作流集成

此应用与 Chris 的自动化系统无缝集成：

### Morning Brief (08:00 EST)
- 读取 `night_check/plan.md` 中的计划
- 自动创建当天的 `day_track/[DATE].md`
- 将计划任务放入 Backlog 列

### Night Check (00:00 EST)
- 解析 Kanban 三列统计任务
- 生成 daily summary（完成率、已完成、未完成）
- 询问明天计划和睡眠任务

### Weekly Check (周日 00:00 EST)
- 回顾上周计划
- 询问本周计划

## 🌐 部署

### Vercel（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

注意：由于 API 读取本地文件系统，部署后需要配置存储解决方案（如 Vercel KV、Supabase 等）。

### 本地运行

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

## 📝 TODO

- [ ] 添加日期选择器功能
- [ ] 支持拖拽任务
- [ ] 任务优先级
- [ ] 任务截止日期
- [ ] 部署到 Vercel 并配置云存储

## 📄 License

MIT

---

**GitHub**: https://github.com/c-hri-sw-u/tasks-webapp
