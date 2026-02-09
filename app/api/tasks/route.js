import { promises as fs } from 'fs';
import path from 'path';

const TASKS_DIR = '/Users/mia/.openclaw/workspace/tasks/daily/day_track';

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initialize tasks file if it doesn't exist
async function initTasksFile(date) {
  const filePath = path.join(TASKS_DIR, `${date}.md`);
  try {
    await fs.access(filePath);
  } catch {
    const initialContent = `# ${date} 任务追踪

## 📋 Backlog

## 🚀 In Progress

## ✅ Done

## 💤 睡眠后台任务
`;
    await fs.writeFile(filePath, initialContent);
  }
  return filePath;
}

// Parse tasks from Markdown
function parseTasks(content) {
  const sections = {
    backlog: [],
    inProgress: [],
    done: []
  };

  const lines = content.split('\n');
  let currentSection = null;

  for (const line of lines) {
    if (line.startsWith('## 📋 Backlog')) {
      currentSection = 'backlog';
    } else if (line.startsWith('## 🚀 In Progress')) {
      currentSection = 'inProgress';
    } else if (line.startsWith('## ✅ Done')) {
      currentSection = 'done';
    } else if (line.startsWith('- [') && currentSection) {
      const idMatch = line.match(/\[#([a-zA-Z0-9_-]+)\]/);
      const id = idMatch ? idMatch[1] : Date.now().toString();
      const text = line.replace(/^- \[[ x]\] \[#([a-zA-Z0-9_-]+)\] /, '').trim();
      const isDone = line.includes('- [x]');

      sections[currentSection].push({ id, text, done: isDone });
    }
  }

  return sections;
}

// Generate tasks Markdown (preserve sections)
function generateTasksMarkdown(content, sections) {
  const lines = content.split('\n');
  let output = [];
  let currentSection = null;

  for (const line of lines) {
    if (line.startsWith('## 📋 Backlog')) {
      currentSection = 'backlog';
      output.push(line);
      output.push('');
      for (const task of sections.backlog) {
        output.push(`- [ ] [#${task.id}] ${task.text}`);
      }
    } else if (line.startsWith('## 🚀 In Progress')) {
      currentSection = 'inProgress';
      output.push(line);
      output.push('');
      for (const task of sections.inProgress) {
        output.push(`- [ ] [#${task.id}] ${task.text}`);
      }
    } else if (line.startsWith('## ✅ Done')) {
      currentSection = 'done';
      output.push(line);
      output.push('');
      for (const task of sections.done) {
        output.push(`- [x] [#${task.id}] ${task.text}`);
      }
    } else if (line.startsWith('- [') && currentSection) {
      // Skip old task lines (they'll be replaced by the sections above)
    } else {
      output.push(line);
    }
  }

  return output.join('\n');
}

// GET - Fetch all tasks
export async function GET() {
  const date = getTodayDate();
  const filePath = await initTasksFile(date);
  const content = await fs.readFile(filePath, 'utf-8');
  const tasks = parseTasks(content);
  return Response.json(tasks);
}

// POST - Add a new task
export async function POST(request) {
  const { text, status } = await request.json();

  const date = getTodayDate();
  const filePath = await initTasksFile(date);
  const content = await fs.readFile(filePath, 'utf-8');
  const tasks = parseTasks(content);

  const newTask = {
    id: Date.now().toString(),
    text,
    done: false
  };

  tasks[status].push(newTask);
  const newContent = generateTasksMarkdown(content, tasks);

  await fs.writeFile(filePath, newContent);
  return Response.json({ success: true, task: newTask });
}

// PUT - Update task status
export async function PUT(request) {
  const { taskId, status } = await request.json();

  const date = getTodayDate();
  const filePath = await initTasksFile(date);
  const content = await fs.readFile(filePath, 'utf-8');
  const tasks = parseTasks(content);

  // Find and move the task
  let foundTask = null;
  for (const section of ['backlog', 'inProgress', 'done']) {
    const taskIndex = tasks[section].findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      foundTask = tasks[section].splice(taskIndex, 1)[0];
      break;
    }
  }

  if (foundTask) {
    tasks[status].push(foundTask);
    const newContent = generateTasksMarkdown(content, tasks);
    await fs.writeFile(filePath, newContent);
    return Response.json({ success: true });
  }

  return Response.json({ success: false, error: 'Task not found' }, { status: 404 });
}

// DELETE - Remove a task
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  const date = getTodayDate();
  const filePath = await initTasksFile(date);
  const content = await fs.readFile(filePath, 'utf-8');
  const tasks = parseTasks(content);

  let found = false;
  for (const section of ['backlog', 'inProgress', 'done']) {
    const taskIndex = tasks[section].findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[section].splice(taskIndex, 1);
      found = true;
      break;
    }
  }

  if (found) {
    const newContent = generateTasksMarkdown(content, tasks);
    await fs.writeFile(filePath, newContent);
    return Response.json({ success: true });
  }

  return Response.json({ success: false, error: 'Task not found' }, { status: 404 });
}
