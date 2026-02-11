// app/command-center/components/WeekView.tsx
'use client';

import { useMemo, useRef, useEffect } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import { Task } from '../../hooks/useTasks';
import TaskCard from './TaskCard';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface WeekViewProps {
  tasksByDate: Record<string, Task[]>;
  weekStart: Date;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => Promise<void>;
  onDateSelect: (date: Date) => void;
  loading: boolean;
}

export default function WeekView({
  tasksByDate,
  weekStart,
  onComplete,
  onUncomplete,
  onDelete,
  onUpdate,
  onDateSelect,
  loading,
}: WeekViewProps) {
  const todayRef = useRef<HTMLDivElement>(null);

  // Generate array of days for the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Scroll to today on mount
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [weekStart]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sh-navy border-t-transparent mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
      {weekDays.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayTasks = [...(tasksByDate[dateKey] || [])].sort((a, b) => {
          const aCompleted = a.status === 'completed' ? 1 : 0;
          const bCompleted = b.status === 'completed' ? 1 : 0;
          return aCompleted - bCompleted;
        });
        const isCurrentDay = isToday(day);
        const totalTasks = dayTasks.length;
        const completedTasks = dayTasks.filter((t) => t.status === 'completed').length;
        const remainingTasks = totalTasks - completedTasks;

        return (
          <div
            key={dateKey}
            ref={isCurrentDay ? todayRef : undefined}
            className={isCurrentDay ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
          >
            {/* Sticky Day Header */}
            <button
              onClick={() => onDateSelect(day)}
              className={`
                sticky top-0 z-10 w-full flex items-center justify-between
                px-4 py-3 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700
                hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left
                ${isCurrentDay
                  ? 'bg-sh-navy/95 text-white hover:bg-sh-navy'
                  : 'bg-white/95 dark:bg-slate-800/95'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div>
                  <span className={`text-sm font-bold ${
                    isCurrentDay ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    {format(day, 'EEEE')}
                  </span>
                  <span className={`ml-2 text-sm ${
                    isCurrentDay ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {format(day, 'MMMM d')}
                  </span>
                </div>
              </div>

              {/* Task Count Badge */}
              {totalTasks > 0 && (
                <span className={`
                  text-xs font-medium px-2.5 py-1 rounded-full
                  ${isCurrentDay
                    ? 'bg-white/20 text-white'
                    : completedTasks === totalTasks
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                  }
                `}>
                  {completedTasks === totalTasks
                    ? `${totalTasks} done`
                    : `${remainingTasks} of ${totalTasks} remaining`
                  }
                </span>
              )}
            </button>

            {/* Tasks */}
            <div className="p-4">
              {dayTasks.length > 0 ? (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {dayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={onComplete}
                        onUncomplete={onUncomplete}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm py-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>No tasks</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
