// app/command-center/components/TaskCard.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Task } from '../../hooks/useTasks';
import {
  CheckCircleIcon,
  TrashIcon,
  ClockIcon,
  MegaphoneIcon,
  GlobeAltIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  announcement: MegaphoneIcon,
  website: GlobeAltIcon,
  av: VideoCameraIcon,
  flyer: DocumentTextIcon,
  misc: EllipsisHorizontalIcon,
};

const categoryColors: Record<string, string> = {
  announcement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  website: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  av: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  flyer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  misc: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const priorityColors: Record<string, string> = {
  low: 'border-l-gray-300 dark:border-l-gray-600',
  normal: 'border-l-blue-400 dark:border-l-blue-500',
  high: 'border-l-amber-400 dark:border-l-amber-500',
  urgent: 'border-l-red-500 dark:border-l-red-400',
};

export default function TaskCard({
  task,
  onComplete,
  onUncomplete,
  onDelete,
  compact = false,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isCompleted = task.status === 'completed';
  const CategoryIcon = categoryIcons[task.category] || EllipsisHorizontalIcon;

  const handleToggleComplete = () => {
    if (isCompleted) {
      onUncomplete(task.id);
    } else {
      onComplete(task.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        group relative bg-white dark:bg-slate-800 rounded-xl border-l-4
        ${priorityColors[task.priority || 'normal']}
        border border-gray-200/80 dark:border-slate-700/80
        transition-all hover:shadow-md
        ${isCompleted ? 'opacity-60' : ''}
        ${compact ? 'p-2' : 'p-3 sm:p-4'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`
            flex-shrink-0 mt-0.5 transition-colors
            ${isCompleted
              ? 'text-emerald-500 dark:text-emerald-400'
              : 'text-gray-300 dark:text-gray-600 hover:text-emerald-500 dark:hover:text-emerald-400'
            }
          `}
        >
          {isCompleted ? (
            <CheckCircleSolidIcon className="w-6 h-6" />
          ) : (
            <CheckCircleIcon className="w-6 h-6" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`
                font-medium text-gray-900 dark:text-white
                ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : ''}
                ${compact ? 'text-sm' : 'text-base'}
              `}
            >
              {task.title}
            </h3>

            {/* Category Badge */}
            <span
              className={`
                flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                ${categoryColors[task.category] || categoryColors.misc}
              `}
            >
              <CategoryIcon className="w-3 h-3" />
              {!compact && <span className="hidden sm:inline capitalize">{task.category}</span>}
            </span>
          </div>

          {/* Description */}
          {task.description && !compact && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {task.dueTime && (
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" />
                {task.dueTime.substring(0, 5)}
              </span>
            )}
            {task.priority === 'urgent' && (
              <span className="text-red-600 dark:text-red-400 font-medium uppercase">Urgent</span>
            )}
            {task.priority === 'high' && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">High Priority</span>
            )}
          </div>
        </div>

        {/* Delete Button (show on hover) */}
        <button
          onClick={() => onDelete(task.id)}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
