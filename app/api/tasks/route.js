import { promises as fs } from 'fs';
import path from 'path';

const TASKS_FILE = path.join(process.cwd(), 'tasks.md');

// Initialize tasks file if it doesn't exist
async function initTasksFile() {
  try {
    await fs.access(TASKS_FILE);
  } catch {
    await fs.writeFile(TASKS_FILE, `## 📋 Backlog

## 🚀 In Progress

## ✅ Done
`);
  }
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
    } else if (line.startsWith('- [ ') && currentSection) {
      const idMatch = line.match(/\[#([a-zA-Z0-9_-]+)\]/);
      const id = idMatch ? idMatch[1] : Date.now().toString();
      const text = line.replace(/^- \[[ x]\] \[#([a-zA-Z0-9_-]+)\] /, '').trim();
      const isDone = line.includes('- [x]');

      sections[currentSection].push({ id, text, done: isDone });
    }
  }

  return sections;
}

// Generate tasks Markdown
function generateTasksMarkdown(sections) {
  let markdown = `## 📋 Backlog\n\n`;
  for (const task of sections.backlog) {
    markdown += `- [ ] [#${task.id}] ${task.text}\n`;
  }

  markdown += `\n## 🚀 In Progress\n\n`;
  for (const task of sections.inProgress) {
    markdown += `- [ ] [#${task.id}] ${task.text}\n`;
  }

  markdown += `\n## ✅ Done\n\n`;
  for (const task of sections.done) {
    markdown += `- [x] [#${task.id}] ${task.text}\n`;
  }

  return markdown;
}

// GET - Fetch all tasks
export async function GET() {
  await initTasksFile();
  const content = await fs.readFile(TASKS_FILE, 'utf-8');
  const tasks = parseTasks(content);
  return Response.json(tasks);
}

// POST - Add a new task
export async function POST(request) {
  const { text, status } = await request.json();

  await initTasksFile();
  const content = await fs.readFile(TASKS_FILE, 'utf-8');
  const tasks = parseTasks(content);

  const newTask = {
    id: Date.now().toString(),
    text,
    done: false
  };

  tasks[status].push(newTask);
  const newContent = generateTasksMarkdown(tasks);

  await fs.writeFile(TASKS_FILE, newContent);
  return Response.json({ success: true, task: newTask });
}

// PUT - Update task status
export async function PUT(request) {
  const { taskId, status } = await request.json();

  await initTasksFile();
  const content = await fs.readFile(TASKS_FILE, 'utf-8');
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
    const newContent = generateTasksMarkdown(tasks);
    await fs.writeFile(TASKS_FILE, newContent);
    return Response.json({ success: true });
  }

  return Response.json({ success: false, error: 'Task not found' }, { status: 404 });
}

// DELETE - Remove a task
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  await initTasksFile();
  const content = await fs.readFile(TASKS_FILE, 'utf-8');
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
    const newContent = generateTasksMarkdown(tasks);
    await fs.writeFile(TASKS_FILE, newContent);
    return Response.json({ success: true });
  }

  return Response.json({ success: false, error: 'Task not found' }, { status: 404 });
}
