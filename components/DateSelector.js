"use client";

import { useState } from 'react';
import { cn } from '../lib/utils';

export default function DateSelector({ currentDate, view, onDateChange, onViewChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateDisplay = (date) => {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return d.toLocaleDateString('zh-CN', options);
  };

  const navigateDate = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="date-selector">
      <div className="view-tabs" role="tablist" aria-label="视图选择">
        <button
          className={cn('view-tab', view === 'daily' && 'active')}
          onClick={() => onViewChange('daily')}
          role="tab"
          aria-selected={view === 'daily'}
          aria-controls="tasks-board"
        >
          📅 每日
        </button>
        <button
          className={cn('view-tab', view === 'weekly' && 'active')}
          onClick={() => onViewChange('weekly')}
          role="tab"
          aria-selected={view === 'weekly'}
          aria-controls="tasks-board"
        >
          📋 本周计划
        </button>
        <button
          className={cn('view-tab', view === 'achieved' && 'active')}
          onClick={() => onViewChange('achieved')}
          role="tab"
          aria-selected={view === 'achieved'}
          aria-controls="tasks-board"
        >
          ✅ 已完成
        </button>
      </div>

      {view === 'daily' && (
        <div className="date-navigation">
          <button
            onClick={() => navigateDate(-1)}
            aria-label="昨天"
            disabled={isOpen}
            className="nav-btn"
          >
            ← 昨天
          </button>

          <button
            className={cn('current-date', isOpen && 'open')}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {formatDateDisplay(currentDate)}
          </button>

          <button
            onClick={() => navigateDate(1)}
            aria-label="明天"
            disabled={isOpen}
            className="nav-btn"
          >
            明天 →
          </button>

          <button
            onClick={goToToday}
            className="today-btn"
            aria-label="跳到今天"
          >
            今天
          </button>
        </div>
      )}

      {view === 'weekly' && (
        <div className="week-indicator">
          <span>📋 本周计划</span>
        </div>
      )}

      {view === 'achieved' && (
        <div className="achieved-indicator">
          <span>✅ 历史已完成任务</span>
        </div>
      )}
    </div>
  );
}
