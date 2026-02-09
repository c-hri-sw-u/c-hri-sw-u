# 📋 Tasks Minimal - 极简任务管理器

基于Markdown文件的超简Web应用。

## 🎯 特性

- ✅ 读取 `tasks/daily/[DATE].md`
- ✅ Kanban三列：Backlog / In Progress / Done
- ✅ 拖拽任务（← → 按钮）
- ✅ 双向同步：Web app修改立即写入md文件
- ✅ 选择日期加载任务

## 🚀 快速开始

```bash
# 安装依赖
cd /Users/mia/.openclaw/workspace/tasks-webapp
npm install

# 启动开发服务器
npm run dev

# 打开浏览器
# 访问 http://localhost:3000
```

## 📋 Schema说明

Web app使用**方案B（Section区分）**：

```markdown
# [DATE] 任务追踪

## 📋 Backlog
- [ ] 新任务1
- [ ] 新任务2

## 🚀 In Progress
- [ ] 正在做1
- [ ] 正在做2

## ✅ Done
- [x] 已完成任务1
- [x] 已完成任务2

## 📝 进度追踪
(自由文本)
```

## 🎮 使用方法

1. **选择日期**：点击日期选择器加载任务
2. **编辑任务**：直接在输入框中修改
3. **移动任务**：点击 ← → 按钮在列之间移动
4. **完成任务**：勾选checkbox或点击 ✓ 按钮
5. **保存**：点击底部"保存到 Markdown"按钮

## 📁 文件位置

- 读取：`/Users/mia/.openclaw/workspace/tasks/daily/day_track/[DATE].md`
- 写入：`/Users/mia/.openclaw/workspace/tasks/daily/day_track/[DATE].md`

## 🔧 技术栈

- Next.js 14
- React 18
- Tailwind CSS
- Node.js fs 模块（仅服务端）

## 📌 说明

- 客户端操作（编辑、移动、勾选）是实时的
- 点击保存按钮才写入磁盘
- 如果文件不存在会自动创建
- 原有文件的"进度追踪"section会被保留
