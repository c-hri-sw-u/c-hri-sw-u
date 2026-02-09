"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { getTodayDate } from '../lib/date-utils';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableTaskItem from '../components/SortableTaskItem';
import KanbanColumn from '../components/KanbanColumn';
import TrashZone from '../components/TrashZone';

export default function Home() {
  const [view, setView] = useState('today');
  const [tasks, setTasks] = useState({ backlog: [], inProgress: [], done: [] });
  const tasksRef = useRef(tasks);
  const [botTasks, setBotTasks] = useState([]);
  const [tomorrowTasks, setTomorrowTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [archivedDates, setArchivedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [historyTasks, setHistoryTasks] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Keep tasksRef in sync with tasks state
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    fetchData();
  }, [view, selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (view === 'today') {
        await fetchTodayData();
      } else if (view === 'night') {
        await fetchNightData();
      } else if (view === 'history') {
        if (!selectedDate) {
          await fetchArchivedDates();
        } else {
          await fetchHistoryData(selectedDate);
        }
      } else if (view === 'weekly') {
        await fetchWeeklyData();
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('加载数据失败，请刷新页面重试');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayData = async () => {
    const res = await fetch('/api/today');
    const data = await res.json();
    setTasks(data.tasks || { backlog: [], inProgress: [], done: [] });
    setTomorrowTasks(data.tomorrowTasks || []);
  };

  const fetchNightData = async () => {
    const res = await fetch('/api/today');
    const data = await res.json();
    setBotTasks(data.botTasks || []);
    setTomorrowTasks(data.tomorrowTasks || []);
  };

  const fetchArchivedDates = async () => {
    const res = await fetch('/api/history');
    const data = await res.json();
    setArchivedDates(data.dates || []);
    setHistoryTasks(null);
  };

  const fetchHistoryData = async (date) => {
    const res = await fetch(`/api/history?date=${date}`);
    const data = await res.json();
    setHistoryTasks(data);
  };

  const fetchWeeklyData = async () => {
    const res = await fetch('/api/weekly');
    const data = await res.json();
    setWeeklyTasks(data.tasks || []);
  };

  const findSection = (id) => {
    if (id in tasks) return id;
    if (tasks.backlog.find(t => t.id === id)) return 'backlog';
    if (tasks.inProgress.find(t => t.id === id)) return 'inProgress';
    if (tasks.done.find(t => t.id === id)) return 'done';
    return null;
  };

  const findTask = (id) => {
    const section = findSection(id);
    if (!section) return null;
    return tasks[section].find(t => t.id === id);
  };

  const handleDragStart = (event) => {
    console.log('=== DragStart ===', event.active.id);
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    setTasks((prev) => {
      // Check if overId is a column id
      const isOverColumn = overId in prev;

      // Find which section the active task is in
      let activeSection = null;
      let activeIndex = -1;
      for (const section of ['backlog', 'inProgress', 'done']) {
        const idx = prev[section].findIndex(t => t.id === active.id);
        if (idx !== -1) {
          activeSection = section;
          activeIndex = idx;
          break;
        }
      }

      if (!activeSection || activeIndex === -1) return prev;

      // Determine target section
      let overSection = null;
      let overIndex = -1;

      if (isOverColumn) {
        // Dropped on column itself (empty area)
        overSection = overId;
      } else {
        // Dropped on a task - find which section it's in
        for (const section of ['backlog', 'inProgress', 'done']) {
          const idx = prev[section].findIndex(t => t.id === overId);
          if (idx !== -1) {
            overSection = section;
            overIndex = idx;
            break;
          }
        }
      }

      if (!overSection) return prev;

      const activeTask = prev[activeSection][activeIndex];

      // Same section - reorder
      if (activeSection === overSection && !isOverColumn) {
        if (overIndex === -1 || activeIndex === overIndex) return prev;

        const newItems = arrayMove(prev[activeSection], activeIndex, overIndex);
        const newTasks = {
          ...prev,
          [activeSection]: newItems,
        };
        tasksRef.current = newTasks;
        return newTasks;
      }

      // Cross section or dropped on column
      let newIndex;
      if (isOverColumn || overIndex === -1) {
        newIndex = prev[overSection].length;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top >
          over.rect.top + over.rect.height;
        newIndex = overIndex + (isBelowOverItem ? 1 : 0);
      }

      // Remove from source, add to target
      const newSourceItems = prev[activeSection].filter(item => item.id !== active.id);
      const newTargetItems = [...prev[overSection]];

      // If same section (dropped on column in same section), just move to end
      if (activeSection === overSection) {
        newTargetItems.splice(newIndex, 0, activeTask);
        const newTasks = {
          ...prev,
          [activeSection]: newTargetItems,
        };
        tasksRef.current = newTasks;
        return newTasks;
      }

      newTargetItems.splice(newIndex, 0, activeTask);

      const newTasks = {
        ...prev,
        [activeSection]: newSourceItems,
        [overSection]: newTargetItems,
      };

      tasksRef.current = newTasks;
      return newTasks;
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    const activeId = active.id;
    const overId = over?.id;

    console.log('=== DragEnd ===', activeId, 'over:', overId);
    setActiveId(null);

    // Check if dropped on trash
    if (overId === 'trash') {
      console.log('Deleting task:', activeId);
      await deleteTask(activeId);
      return;
    }

    // Find current position in tasksRef (after handleDragOver updates)
    const currentTasks = tasksRef.current;
    let endSection = null;
    let endIndex = -1;

    for (const section of ['backlog', 'inProgress', 'done']) {
      const index = currentTasks[section].findIndex(t => t.id === activeId);
      if (index !== -1) {
        endSection = section;
        endIndex = index;
        break;
      }
    }

    console.log('Persisting:', { endSection, endIndex });

    if (endSection && endIndex !== -1) {
      try {
        await fetch('/api/today', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: activeId,
            status: endSection,
            newIndex: endIndex
          })
        });
        console.log('Persist success');
      } catch (e) {
        console.error('Persist failed', e);
        fetchTodayData();
      }
    } else {
      console.error('Task not found in tasksRef');
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTask, status: 'backlog' })
      });
      if (!response.ok) {
        throw new Error('Failed to add task');
      }
      setNewTask('');
      await fetchTodayData();
    } catch (error) {
      console.error('Failed to add task:', error);
      setError('添加任务失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep for compatibility with existing buttons if needed, or remove. 
  // I will update SortableTaskItem to use onMove which calls this or API directly.
  const moveTask = async (taskId, newStatus) => {
    // This is still useful for manual buttons
    // Reuse the logic? Or just call API.
    // To keep simple, just call API.
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/today', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: newStatus })
      });
      if (!response.ok) {
        throw new Error('Failed to move task');
      }
      await fetchTodayData();
    } catch (error) {
      console.error('Failed to move task:', error);
      setError('移动任务失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTask = async (taskId) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/today?taskId=${taskId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      await fetchTodayData(); // Syncs state
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError('删除任务失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveEdit = async (taskId, newText, section) => {
    if (!newText.trim()) return;

    // Optimistic update
    setTasks(prev => ({
      ...prev,
      [section]: prev[section].map(t => t.id === taskId ? { ...t, text: newText } : t)
    }));

    try {
      const response = await fetch('/api/today', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, text: newText })
      });
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      setError('更新任务失败，请重试');
      await fetchTodayData(); // Revert
    }
  };

  const toggleFlag = async (taskId, section) => {
    // Optimistic update
    setTasks(prev => {
      const newTasks = {
        ...prev,
        [section]: prev[section].map(t =>
          t.id === taskId ? { ...t, flagged: !t.flagged } : t
        )
      };
      tasksRef.current = newTasks;
      return newTasks;
    });

    try {
      const task = tasks[section].find(t => t.id === taskId);
      const response = await fetch('/api/today', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, flagged: !task?.flagged })
      });
      if (!response.ok) {
        throw new Error('Failed to toggle flag');
      }
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      await fetchTodayData(); // Revert
    }
  };

  const toggleWeeklyTask = async (taskId) => {
    try {
      const response = await fetch('/api/weekly', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      if (!response.ok) {
        throw new Error('Failed to toggle task');
      }
      await fetchWeeklyData();
    } catch (error) {
      console.error('Failed to toggle task:', error);
      setError('切换任务状态失败，请重试');
    }
  };

  const addWeeklyTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTask })
      });
      if (!response.ok) {
        throw new Error('Failed to add task');
      }
      setNewTask('');
      await fetchWeeklyData();
    } catch (error) {
      console.error('Failed to add task:', error);
      setError('添加任务失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteWeeklyTask = async (taskId) => {
    try {
      const response = await fetch(`/api/weekly?taskId=${taskId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      await fetchWeeklyData();
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError('删除任务失败，请重试');
    }
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <main className="container">
      <h1 className="page-title">Task Manager</h1>

      {/* View Selector */}
      <div className="view-selector" role="tablist" aria-label="视图选择">
        <button
          className={cn('view-btn', view === 'today' && 'active')}
          onClick={() => { setView('today'); setSelectedDate(null); }}
          role="tab"
          aria-selected={view === 'today'}
        >
          📅 今日任务
        </button>
        <button
          className={cn('view-btn', view === 'night' && 'active')}
          onClick={() => { setView('night'); setSelectedDate(null); }}
          role="tab"
          aria-selected={view === 'night'}
        >
          💤 睡眠任务
        </button>
        <button
          className={cn('view-btn', view === 'history' && 'active')}
          onClick={() => { setView('history'); setSelectedDate(null); }}
          role="tab"
          aria-selected={view === 'history'}
        >
          🕰️ 历史回顾
        </button>
        <button
          className={cn('view-btn', view === 'weekly' && 'active')}
          onClick={() => { setView('weekly'); setSelectedDate(null); }}
          role="tab"
          aria-selected={view === 'weekly'}
        >
          📋 本周计划
        </button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* Today View */}
      {view === 'today' && (
        <>
          {/* Add Task Form */}
          <form onSubmit={addTask} className="add-task-form">
            <label htmlFor="new-task" className="sr-only">添加新任务</label>
            <input
              id="new-task"
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="添加新任务..."
              disabled={isSubmitting}
              aria-describedby="task-help"
            />
            <span id="task-help" className="sr-only">
              按 Enter 键或点击按钮添加任务到待办列表
            </span>
            <button type="submit" disabled={isSubmitting || !newTask.trim()}>
              {isSubmitting ? '添加中...' : '添加任务'}
            </button>
          </form>

          {/* Today's Board */}
          {/* Today's Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <TrashZone isVisible={!!activeId} />
            <div className="board">
              {/* 昨晚的计划 (Read Only) */}
              <section className="column column-gray" id="yesterday">
                <h2 className="column-title">📋 昨晚的计划 <span className="task-count">{tomorrowTasks.length}</span></h2>
                <ul className="task-list">
                  {tomorrowTasks.map(task => (
                    <li key={task.id} className="task-item">
                      <span className="task-text">{task.text}</span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="delete-btn"
                        disabled={isSubmitting}
                        title="删除"
                        aria-label="删除任务"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 待办 */}
              <KanbanColumn
                id="backlog"
                title="📋 待办"
                tasks={tasks.backlog}
                onDelete={deleteTask}
                onEditSave={saveEdit}
                onMove={moveTask}
                onToggleFlag={toggleFlag}
                colorClass="column-blue"
              />

              {/* 进行中 */}
              <KanbanColumn
                id="inProgress"
                title="🚀 进行中"
                tasks={tasks.inProgress}
                onDelete={deleteTask}
                onEditSave={saveEdit}
                onMove={moveTask}
                onToggleFlag={toggleFlag}
                colorClass="column-orange"
              />

              {/* 已完成 */}
              <KanbanColumn
                id="done"
                title="✅ 已完成"
                tasks={tasks.done}
                onDelete={deleteTask}
                onEditSave={saveEdit}
                onMove={moveTask}
                onToggleFlag={toggleFlag}
                colorClass="column-green"
              />
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="task-item drag-overlay">
                  <span className="task-text">{findTask(activeId)?.text}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {/* Night View */}
      {view === 'night' && (
        <>
          {/* Bot Tasks */}
          <section className="night-tasks" aria-labelledby="night-tasks-title">
            <h2 id="night-tasks-title" className="section-title">
              💤 睡眠时我可以帮你做什么
            </h2>
            <p className="section-hint">
              这是昨晚收集的任务，我会在你睡觉时完成这些工作
            </p>
            <ul className="simple-list">
              {botTasks.length === 0 && <li className="empty-state">暂无睡眠任务</li>}
              {botTasks.map(task => (
                <li key={task.id} className="simple-task">
                  <span className="task-text">{task.text}</span>
                  <span className="task-done">{task.done ? '✓' : '○'}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* History View */}
      {view === 'history' && (
        <>
          {!selectedDate && (
            <div className="history-dates">
              <h2 className="section-title">🕰️ 历史记录</h2>
              <ul className="date-list">
                {archivedDates.length === 0 && <li className="empty-state">暂无历史记录</li>}
                {archivedDates.map(date => (
                  <li key={date}>
                    <button className="date-btn" onClick={() => setSelectedDate(date)}>
                      {date}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedDate && historyTasks && (
            <>
              <button className="back-btn" onClick={() => setSelectedDate(null)}>
                ← 返回日期列表
              </button>

              <h2 className="section-title">🕰️ {selectedDate} 的任务记录</h2>
              <p className="section-hint">🔒 历史记录（只读）</p>

              <div className="board">
                <section className="column column-blue">
                  <h2 className="column-title">📋 待办 <span className="task-count">{historyTasks.tasks?.backlog?.length || 0}</span></h2>
                  <ul className="task-list">
                    {historyTasks.tasks?.backlog?.map(task => (
                      <li key={task.id} className="task-item">
                        <span className="task-text">{task.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="column column-orange">
                  <h2 className="column-title">🚀 进行中 <span className="task-count">{historyTasks.tasks?.inProgress?.length || 0}</span></h2>
                  <ul className="task-list">
                    {historyTasks.tasks?.inProgress?.map(task => (
                      <li key={task.id} className="task-item">
                        <span className="task-text">{task.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="column column-green">
                  <h2 className="column-title">✅ 已完成 <span className="task-count">{historyTasks.tasks?.done?.length || 0}</span></h2>
                  <ul className="task-list">
                    {historyTasks.tasks?.done?.map(task => (
                      <li key={task.id} className="task-item">
                        <span className="task-text">{task.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {historyTasks.botTasks && historyTasks.botTasks.length > 0 && (
                <section className="bot-tasks" aria-labelledby="history-bot-title">
                  <h2 id="history-bot-title" className="section-title">💤 睡眠时完成的任务</h2>
                  <ul className="simple-list">
                    {historyTasks.botTasks.map(task => (
                      <li key={task.id} className="simple-task">
                        <span className="task-text">{task.text}</span>
                        <span className="task-done">✓</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {historyTasks.plan && historyTasks.plan.length > 0 && (
                <section className="tomorrow-tasks" aria-labelledby="history-plan-title">
                  <h2 id="history-plan-title" className="section-title">📋 当时计划的任务</h2>
                  <ul className="simple-list">
                    {historyTasks.plan.map(task => (
                      <li key={task.id} className="simple-task">
                        <span className="task-text">{task.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* Weekly View */}
      {view === 'weekly' && (
        <>
          <h2 className="section-title">📅 本周计划</h2>
          <p className="section-hint">这是本周的整体计划，由 Weekly Check 每周日收集</p>

          <form onSubmit={addWeeklyTask} className="add-task-form">
            <label htmlFor="new-weekly-task" className="sr-only">添加本周任务</label>
            <input
              id="new-weekly-task"
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="添加本周任务..."
              disabled={isSubmitting}
              aria-describedby="weekly-task-help"
            />
            <span id="weekly-task-help" className="sr-only">
              按 Enter 键或点击按钮添加任务到本周计划
            </span>
            <button type="submit" disabled={isSubmitting || !newTask.trim()}>
              {isSubmitting ? '添加中...' : '添加任务'}
            </button>
          </form>

          <section className="weekly-tasks" aria-labelledby="weekly-tasks-title">
            <h2 id="weekly-tasks-title" className="sr-only">本周任务列表</h2>
            <ul className="simple-list">
              {weeklyTasks.length === 0 && <li className="empty-state">暂无本周计划</li>}
              {weeklyTasks.map(task => (
                <li key={task.id} className="simple-task">
                  <span className="task-text">{task.text}</span>
                  <div className="task-actions">
                    <button
                      onClick={() => toggleWeeklyTask(task.id)}
                      aria-label={task.done ? "标记为未完成" : "标记为已完成"}
                      disabled={isSubmitting}
                    >
                      {task.done ? '✓' : '○'}
                    </button>
                    <button
                      onClick={() => deleteWeeklyTask(task.id)}
                      title="删除任务"
                      className="delete-btn"
                      disabled={isSubmitting}
                      aria-label="删除任务"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
