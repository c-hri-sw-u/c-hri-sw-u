"use client";

import { useDroppable } from '@dnd-kit/core';
import { cn } from '../lib/utils';

export default function TrashZone({ isVisible }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'trash',
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "trash-zone",
                isVisible ? "visible" : "",
                isOver ? "over" : ""
            )}
        >
            <span className="trash-icon">🗑️</span>
            <span className="trash-text">拖到这里删除</span>
        </div>
    );
}
