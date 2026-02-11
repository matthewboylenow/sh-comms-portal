// app/command-center/components/DayView.tsx
'use client';

import { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import { Task } from '../../hooks/useTasks';
import TaskCard from './TaskCard';
import { CalendarIcon, SunIcon } from '@heroicons/react/24/outline';

interface DayViewProps {
  tasks: Task[];
  date: Date;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

// Time slots for the day (6am to 10pm)
const timeSlots = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  return {
    hour,
    label: format(new Date().setHours(hour, 0, 0, 0), 'h a'),
    time24: `${hour.toString().padStart(2, '0')}:00`,
  };
});

export default function DayView({
  tasks,
  date,
  onComplete,
  onUncomplete,
  onDelete,
  loading,
}: DayViewProps) {
  // Group tasks by time slot
  const tasksByTime = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      unscheduled: [],
    };

    // Initialize time slots
    timeSlots.forEach((slot) => {
      grouped[slot.time24] = [];
    });

    tasks.forEach((task) => {
      if (!task.dueTime) {
        grouped.unscheduled.push(task);
      } else {
        // Find the matching time slot
        const taskHour = parseInt(task.dueTime.substring(0, 2), 10);
        const slotKey = `${taskHour.toString().padStart(2, '0')}:00`;
        if (grouped[slotKey]) {
          grouped[slotKey].push(task);
        } else {
          grouped.unscheduled.push(task);
        }
      }
    });

    return grouped;
  }, [tasks]);

  const hasUnscheduled = tasksByTime.unscheduled.length > 0;
  const hasScheduled = tasks.some((t) => t.dueTime);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sh-navy border-t-transparent mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
          {isToday(date) ? (
            <SunIcon className="w-8 h-8 text-amber-500" />
          ) : (
            <CalendarIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isToday(date) ? 'No tasks for today' : 'No tasks scheduled'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          {isToday(date)
            ? 'Click the + button to add a new task or enjoy your free time!'
            : `No tasks scheduled for ${format(date, 'MMMM d')}`}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-slate-700">
      {/* Unscheduled Tasks */}
      {hasUnscheduled && (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            To Do (No Time Set)
          </h3>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {tasksByTime.unscheduled.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onUncomplete={onUncomplete}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Timeline */}
      {hasScheduled && (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Scheduled
          </h3>
          <div className="relative">
            {/* Time line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-slate-600" />

            <div className="space-y-1">
              {timeSlots.map((slot) => {
                const slotTasks = tasksByTime[slot.time24] || [];
                if (slotTasks.length === 0) return null;

                return (
                  <div key={slot.time24} className="relative flex items-start gap-4">
                    {/* Time Label */}
                    <div className="w-16 flex-shrink-0 text-right">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {slot.label}
                      </span>
                    </div>

                    {/* Dot on timeline */}
                    <div className="absolute left-8 top-3 w-2 h-2 bg-sh-navy dark:bg-sh-rust rounded-full transform -translate-x-1/2" />

                    {/* Tasks */}
                    <div className="flex-1 space-y-2 pl-4">
                      <AnimatePresence mode="popLayout">
                        {slotTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onComplete={onComplete}
                            onUncomplete={onUncomplete}
                            onDelete={onDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
