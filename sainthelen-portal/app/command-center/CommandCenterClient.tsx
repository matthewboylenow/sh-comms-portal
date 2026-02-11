// app/command-center/CommandCenterClient.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { format, startOfWeek, endOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import useTasks, { Task } from '../hooks/useTasks';
import useNotes from '../hooks/useNotes';
import useCommandCenterStream from '../hooks/useCommandCenterStream';
import { useToast } from '../context/ToastContext';
import DayView from './components/DayView';
import WeekView from './components/WeekView';
import QuickCapture from './components/QuickCapture';
import NotesPanel from './components/NotesPanel';
import SubmissionsWidget from './components/SubmissionsWidget';
import DeadlineAlerts from './components/DeadlineAlerts';
import SocialSuggestions from './components/SocialSuggestions';
import SettingsModal from './components/SettingsModal';
import {
  CalendarDaysIcon,
  CalendarIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  HomeIcon,
  BellIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'daily' | 'weekly';

export default function CommandCenterClient() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDark, setIsDark] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Calculate date range for week view
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });

  // Fetch tasks based on view mode
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    fetchTasks,
    createTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
  } = useTasks({
    date: viewMode === 'daily' ? format(selectedDate, 'yyyy-MM-dd') : undefined,
    startDate: viewMode === 'weekly' ? format(weekStart, 'yyyy-MM-dd') : undefined,
    endDate: viewMode === 'weekly' ? format(weekEnd, 'yyyy-MM-dd') : undefined,
    includeCompleted: true,
  });

  // Notes hook
  const {
    notes,
    loading: notesLoading,
    createNote,
    updateNote,
    togglePin,
    deleteNote,
  } = useNotes();

  // SSE for real-time updates
  const { connected, lastEvent } = useCommandCenterStream({
    onTaskEvent: () => fetchTasks(),
    onNoteEvent: () => {},
    autoConnect: true,
  });

  // Theme toggle
  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const htmlEl = document.documentElement;
    if (htmlEl.classList.contains('dark')) {
      htmlEl.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      htmlEl.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // Refresh tasks when view mode or date changes
  useEffect(() => {
    fetchTasks();
  }, [viewMode, selectedDate]);

  // Group tasks by date for week view
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      const dateKey = task.dueDate || 'unscheduled';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    return grouped;
  }, [tasks]);

  // Wrapped task handlers with toast notifications
  const handleComplete = useCallback(async (id: string) => {
    try {
      await completeTask(id);
      toast.success('Task completed');
    } catch {
      toast.error('Failed to complete task');
    }
  }, [completeTask, toast]);

  const handleUncomplete = useCallback(async (id: string) => {
    try {
      await uncompleteTask(id);
      toast.success('Task reopened');
    } catch {
      toast.error('Failed to reopen task');
    }
  }, [uncompleteTask, toast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteTask(id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  }, [deleteTask, toast]);

  const handleCreateTask = useCallback(async (task: Parameters<typeof createTask>[0]) => {
    try {
      await createTask(task);
      toast.success('Task created');
    } catch {
      toast.error('Failed to create task');
    }
  }, [createTask, toast]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sh-navy border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  // Current time display
  const CurrentTime = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    return (
      <div className="text-right">
        <div className="text-3xl lg:text-4xl font-bold text-sh-navy dark:text-white font-mono">
          {format(time, 'h:mm')}
          <span className="text-lg text-gray-400 ml-1">{format(time, 'a')}</span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {format(time, 'EEEE, MMMM d')}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-slate-700/80 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sh-navy rounded-xl flex items-center justify-center">
                <span className="text-white font-serif font-bold text-lg">SH</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-serif font-bold text-sh-navy dark:text-white">
                  Command Center
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session?.user?.name?.split(' ')[0]}'s Dashboard
                </p>
              </div>
            </Link>
          </div>

          {/* Center: View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-slate-600 text-sh-navy dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-sh-navy dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Day</span>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'weekly'
                  ? 'bg-white dark:bg-slate-600 text-sh-navy dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-sh-navy dark:hover:text-white'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Week</span>
            </button>
          </div>

          {/* Right: Time and Actions */}
          <div className="flex items-center gap-4">
            <CurrentTime />

            {/* Connection Status */}
            <div className={`p-2 rounded-lg ${connected ? 'text-emerald-500' : 'text-gray-400'}`}>
              <WifiIcon className={`w-5 h-5 ${connected ? 'animate-pulse' : ''}`} />
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchTasks()}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-5 h-5 ${tasksLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Toggle theme"
            >
              {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>

            {/* Back to Admin */}
            <Link
              href="/admin"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Back to Admin"
            >
              <HomeIcon className="w-5 h-5" />
            </Link>

            {/* Sign Out */}
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6">
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 lg:gap-6 h-full">
          {/* Left Column: Task View */}
          <div className="space-y-4 lg:space-y-6 order-1">
            {/* Date Navigation */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-700/80">
              <button
                onClick={() => setSelectedDate((d) => addDays(d, viewMode === 'daily' ? -1 : -7))}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="text-center">
                <h2 className="text-xl font-bold text-sh-navy dark:text-white">
                  {viewMode === 'daily'
                    ? isToday(selectedDate)
                      ? 'Today'
                      : format(selectedDate, 'EEEE, MMMM d')
                    : `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`}
                </h2>
                {!isToday(selectedDate) && viewMode === 'daily' && (
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="text-sm text-sh-rust hover:underline"
                  >
                    Go to Today
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedDate((d) => addDays(d, viewMode === 'daily' ? 1 : 7))}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Deadline Alerts */}
            <DeadlineAlerts tasks={tasks} />

            {/* Task View */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 overflow-hidden flex-1">
              {viewMode === 'daily' ? (
                <DayView
                  tasks={tasks}
                  date={selectedDate}
                  onComplete={handleComplete}
                  onUncomplete={handleUncomplete}
                  onDelete={handleDelete}
                  onUpdate={updateTask}
                  loading={tasksLoading}
                />
              ) : (
                <WeekView
                  tasksByDate={tasksByDate}
                  weekStart={weekStart}
                  onComplete={handleComplete}
                  onUncomplete={handleUncomplete}
                  onDelete={handleDelete}
                  onUpdate={updateTask}
                  onDateSelect={setSelectedDate}
                  loading={tasksLoading}
                />
              )}
            </div>
          </div>

          {/* Right Column: Widgets */}
          <div className="space-y-4 lg:space-y-6 order-2">
            {/* Notes Panel */}
            <NotesPanel
              notes={notes}
              loading={notesLoading}
              onCreate={createNote}
              onUpdate={updateNote}
              onTogglePin={togglePin}
              onDelete={deleteNote}
            />

            {/* Submissions Widget */}
            <SubmissionsWidget />

            {/* Social Suggestions */}
            <SocialSuggestions />
          </div>
        </div>
      </main>

      {/* Quick Capture FAB */}
      <QuickCapture onCreateTask={handleCreateTask} />

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
