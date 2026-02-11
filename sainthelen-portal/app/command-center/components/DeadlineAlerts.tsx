// app/command-center/components/DeadlineAlerts.tsx
'use client';

import { useMemo } from 'react';
import { format, isToday, isTomorrow, differenceInDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../hooks/useTasks';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';

interface DeadlineAlertsProps {
  tasks: Task[];
}

export default function DeadlineAlerts({ tasks }: DeadlineAlertsProps) {
  const urgentTasks = useMemo(() => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    return tasks
      .filter((task) => {
        if (task.status === 'completed') return false;
        if (!task.dueDate) return false;

        // Check if overdue or due today
        const daysUntil = differenceInDays(parseISO(task.dueDate), now);
        return daysUntil <= 0 || task.priority === 'urgent';
      })
      .sort((a, b) => {
        // Sort by urgency: overdue first, then urgent priority, then by date
        const aDate = a.dueDate ? parseISO(a.dueDate) : new Date();
        const bDate = b.dueDate ? parseISO(b.dueDate) : new Date();
        const aDays = differenceInDays(aDate, now);
        const bDays = differenceInDays(bDate, now);

        if (aDays < 0 && bDays >= 0) return -1;
        if (bDays < 0 && aDays >= 0) return 1;
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
        return aDays - bDays;
      })
      .slice(0, 3);
  }, [tasks]);

  if (urgentTasks.length === 0) return null;

  const getAlertStyle = (task: Task) => {
    if (!task.dueDate) return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700';

    const daysUntil = differenceInDays(parseISO(task.dueDate), new Date());
    if (daysUntil < 0) {
      return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
    }
    if (task.priority === 'urgent') {
      return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
    }
    return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700';
  };

  const getAlertText = (task: Task) => {
    if (!task.dueDate) return 'Urgent';

    const daysUntil = differenceInDays(parseISO(task.dueDate), new Date());
    if (daysUntil < 0) {
      return `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`;
    }
    if (daysUntil === 0) {
      return 'Due today';
    }
    return 'Urgent';
  };

  const getAlertIcon = (task: Task) => {
    if (!task.dueDate) return BellAlertIcon;

    const daysUntil = differenceInDays(parseISO(task.dueDate), new Date());
    if (daysUntil < 0) return ExclamationTriangleIcon;
    if (daysUntil === 0) return ClockIcon;
    return BellAlertIcon;
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {urgentTasks.map((task) => {
          const AlertIcon = getAlertIcon(task);
          const style = getAlertStyle(task);
          const text = getAlertText(task);

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`flex items-center gap-3 p-3 rounded-xl border ${style}`}
            >
              <AlertIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {task.title}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">{text}</p>
              </div>
              {task.dueTime && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {task.dueTime.substring(0, 5)}
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
