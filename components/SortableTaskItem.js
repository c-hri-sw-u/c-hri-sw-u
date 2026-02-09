"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/utils';
import { Flag, GripVertical } from 'lucide-react';

export default function SortableTaskItem({ task, section, onDelete, onEditSave, onMove, onToggleFlag }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
            section,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        setIsEditing(true);
        setEditText(task.text);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editText.trim() !== task.text) {
            onEditSave(task.id, editText, section);
        } else {
            setEditText(task.text); // Reset if cancelled/empty
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditText(task.text);
        }
    };

    if (isDragging) {
        return (
            <li
                ref={setNodeRef}
                style={style}
                className="task-item dragging"
            >
            </li>
        );
    }

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                "task-item",
                isEditing ? "editing" : "",
                task.flagged ? "flagged" : ""
            )}
            onDoubleClick={handleDoubleClick}
        >
            {/* Drag handle */}
            <button
                className="drag-handle"
                {...listeners}
                title="拖拽移动"
                aria-label="拖拽移动"
            >
                <GripVertical size={16} />
            </button>

            {/* Flag button */}
            <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFlag?.(task.id, section);
                }}
                className={cn("flag-btn", task.flagged ? "flagged" : "")}
                title={task.flagged ? "取消标记" : "标记重要"}
                aria-label={task.flagged ? "取消标记" : "标记重要"}
            >
                <Flag size={16} />
            </button>

            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="task-text-input"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                />
            ) : (
                <span className="task-text" title={task.text}>{task.text}</span>
            )}

        </li>
    );
}
