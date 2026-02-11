// app/command-center/components/WeekView.tsx
'use client';

import { useMemo } from 'react';
import { format, addDays, isToday, isSameDay } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import { Task } from '../../hooks/useTasks';
import TaskCard from './TaskCard';

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
  // Generate array of days for the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
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
    <div className="overflow-x-auto">
      <div className="min-w-[700px] grid grid-cols-7 divide-x divide-gray-200 dark:divide-slate-700">
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dateKey}
              className={`min-h-[400px] flex flex-col ${
                isCurrentDay ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
            >
              {/* Day Header */}
              <button
                onClick={() => onDateSelect(day)}
                className={`
                  p-3 text-center border-b border-gray-200 dark:border-slate-700
                  hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors
                  ${isCurrentDay ? 'bg-sh-navy text-white hover:bg-sh-navy-700' : ''}
                `}
              >
                <div className={`text-xs font-medium uppercase tracking-wider ${
                  isCurrentDay ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`text-2xl font-bold ${
                  isCurrentDay ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {format(day, 'd')}
                </div>
              </button>

              {/* Tasks */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {dayTasks.length > 0 ? (
                    dayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={onComplete}
                        onUncomplete={onUncomplete}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                        compact
                      />
                    ))
                  ) : (
                    <div className="text-center text-gray-400 dark:text-gray-500 text-xs py-4">
                      No tasks
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
