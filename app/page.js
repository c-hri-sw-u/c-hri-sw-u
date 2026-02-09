"use client";
import { useState, useEffect } from 'react';
import './globals.css';

export default function Home() {
  const [tasks, setTasks] = useState({ backlog: [], inProgress: [], done: [] });
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTask, status: 'backlog' })
      });
      if (response.ok) {
        setNewTask('');
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: newStatus })
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks?taskId=${taskId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const TaskColumn = ({ title, tasks, status, color }) => (
    <div className={`column ${color}`}>
      <h2>{title}</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span className="task-text">{task.text}</span>
            <div className="task-actions">
              {status !== 'backlog' && (
                <button onClick={() => moveTask(task.id, 'backlog')} title="Move to Backlog">
                  ←
                </button>
              )}
              {status === 'backlog' && (
                <button onClick={() => moveTask(task.id, 'inProgress')} title="Move to In Progress">
                  →
                </button>
              )}
              {status === 'inProgress' && (
                <button onClick={() => moveTask(task.id, 'done')} title="Move to Done">
                  ✓
                </button>
              )}
              {status === 'done' && (
                <button onClick={() => moveTask(task.id, 'inProgress')} title="Move to In Progress">
                  ←
                </button>
              )}
              <button onClick={() => deleteTask(task.id)} title="Delete" className="delete-btn">
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  if (isLoading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="container">
      <h1>Task Manager</h1>
      <form onSubmit={addTask} className="add-task-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
        />
        <button type="submit">Add Task</button>
      </form>
      <div className="board">
        <TaskColumn title="📋 Backlog" tasks={tasks.backlog} status="backlog" color="blue" />
        <TaskColumn title="🚀 In Progress" tasks={tasks.inProgress} status="inProgress" color="orange" />
        <TaskColumn title="✅ Done" tasks={tasks.done} status="done" color="green" />
      </div>
    </div>
  );
}
