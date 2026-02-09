import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskItem from './SortableTaskItem';
import { cn } from '../lib/utils';

export default function KanbanColumn({ id, title, tasks, onDelete, onEditSave, onMove, onToggleFlag, colorClass }) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <section className={cn("column", colorClass)} ref={setNodeRef}>
            <h2 className="column-title">
                {title} <span className="task-count">{tasks.length}</span>
            </h2>
            <SortableContext
                id={id}
                items={tasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <ul className="task-list min-h-[150px]">
                    {tasks.map(task => (
                        <SortableTaskItem
                            key={task.id}
                            task={task}
                            section={id}
                            onDelete={onDelete}
                            onEditSave={onEditSave}
                            onMove={onMove}
                            onToggleFlag={onToggleFlag}
                        />
                    ))}
                </ul>
            </SortableContext>
        </section>
    );
}
