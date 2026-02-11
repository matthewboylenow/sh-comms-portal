// app/command-center/components/SettingsModal.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  XMarkIcon,
  ClockIcon,
  BellIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';

interface RecurringReminder {
  id: string;
  title: string;
  description: string | null;
  category: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  timeOfDay: string | null;
  priority: string | null;
  isActive: boolean;
}

interface UserPreferences {
  dailyDigestEnabled: boolean;
  dailyDigestTime: string;
  defaultView: string;
  theme: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const categoryOptions = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'website', label: 'Website' },
  { value: 'av', label: 'A/V' },
  { value: 'flyer', label: 'Flyer' },
  { value: 'misc', label: 'Miscellaneous' },
];

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// Extracted to module level to prevent unmount/remount on parent re-renders
function ReminderForm({ reminder, onSave, onCancel }: {
  reminder: Partial<RecurringReminder>;
  onSave: (r: Partial<RecurringReminder>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: reminder.title || '',
    description: reminder.description || '',
    category: reminder.category || 'misc',
    frequency: reminder.frequency || 'weekly',
    dayOfWeek: reminder.dayOfWeek ?? 1,
    dayOfMonth: reminder.dayOfMonth ?? 1,
    timeOfDay: reminder.timeOfDay?.substring(0, 5) || '09:00',
    priority: reminder.priority || 'normal',
    isActive: reminder.isActive ?? true,
  });

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
          placeholder="e.g., Email Blast Deadline"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
          placeholder="Optional details"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
          >
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
          >
            {priorityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Frequency
          </label>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
          >
            {frequencyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {form.frequency === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Day of Week
            </label>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              {dayNames.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {form.frequency === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Day of Month
            </label>
            <select
              value={form.dayOfMonth}
              onChange={(e) => setForm({ ...form, dayOfMonth: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Time
        </label>
        <input
          type="time"
          value={form.timeOfDay}
          onChange={(e) => setForm({ ...form, timeOfDay: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({
            ...reminder,
            ...form,
            timeOfDay: form.timeOfDay + ':00',
          })}
          disabled={!form.title.trim()}
          className="px-4 py-2 text-sm bg-sh-primary text-white rounded-lg hover:bg-sh-primary/90 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState(0);
  const [reminders, setReminders] = useState<RecurringReminder[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    dailyDigestEnabled: true,
    dailyDigestTime: '07:30',
    defaultView: 'daily',
    theme: 'system',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingReminder, setEditingReminder] = useState<RecurringReminder | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [remindersRes, prefsRes] = await Promise.all([
        fetch('/api/recurring-reminders'),
        fetch('/api/user-preferences'),
      ]);

      if (remindersRes.ok) {
        const data = await remindersRes.json();
        setReminders(data.reminders || []);
      }

      if (prefsRes.ok) {
        const data = await prefsRes.json();
        if (data.preferences) {
          setPreferences({
            dailyDigestEnabled: data.preferences.dailyDigestEnabled ?? true,
            dailyDigestTime: data.preferences.dailyDigestTime?.substring(0, 5) || '07:30',
            defaultView: data.preferences.defaultView || 'daily',
            theme: data.preferences.theme || 'system',
          });
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async (updates: Partial<UserPreferences>) => {
    setSaving(true);
    try {
      const newPrefs = { ...preferences, ...updates };
      setPreferences(newPrefs);

      const res = await fetch('/api/user-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyDigestEnabled: newPrefs.dailyDigestEnabled,
          dailyDigestTime: newPrefs.dailyDigestTime + ':00',
          defaultView: newPrefs.defaultView,
          theme: newPrefs.theme,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      toast.success('Preferences saved');
    } catch (err) {
      console.error('Error saving preferences:', err);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Toggle reminder active state
  const toggleReminderActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/recurring-reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });

      if (res.ok) {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, isActive } : r));
        toast.success(isActive ? 'Reminder enabled' : 'Reminder disabled');
      } else {
        toast.error('Failed to update reminder');
      }
    } catch (err) {
      console.error('Error toggling reminder:', err);
      toast.error('Failed to update reminder');
    }
  };

  // Delete reminder
  const deleteReminder = async (id: string) => {
    if (!confirm('Delete this recurring reminder?')) return;

    try {
      const res = await fetch(`/api/recurring-reminders?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
        toast.success('Reminder deleted');
      } else {
        toast.error('Failed to delete reminder');
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
      toast.error('Failed to delete reminder');
    }
  };

  // Save reminder (create or update)
  const saveReminder = async (reminder: Partial<RecurringReminder>) => {
    setSaving(true);
    try {
      const method = reminder.id ? 'PATCH' : 'POST';
      const res = await fetch('/api/recurring-reminders', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminder),
      });

      if (res.ok) {
        const data = await res.json();
        if (reminder.id) {
          setReminders(prev => prev.map(r => r.id === reminder.id ? data.reminder : r));
          toast.success('Reminder updated');
        } else {
          setReminders(prev => [...prev, data.reminder]);
          toast.success('Reminder created');
        }
        setEditingReminder(null);
        setIsCreatingNew(false);
      } else {
        toast.error('Failed to save reminder');
      }
    } catch (err) {
      console.error('Error saving reminder:', err);
      toast.error('Failed to save reminder');
    } finally {
      setSaving(false);
    }
  };

  // Seed default reminders
  const seedDefaults = async () => {
    if (!confirm('This will add the default recurring reminders for your workflow. Continue?')) return;

    setSaving(true);
    try {
      const res = await fetch('/api/recurring-reminders/seed', { method: 'POST' });
      if (res.ok) {
        await fetchData();
        toast.success('Default reminders loaded');
      } else {
        toast.error('Failed to load defaults');
      }
    } catch (err) {
      console.error('Error seeding defaults:', err);
      toast.error('Failed to load defaults');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                  <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                    Settings
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                  <Tab.List className="flex border-b border-gray-200 dark:border-slate-700 px-6">
                    <Tab className={({ selected }) => `
                      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                      ${selected
                        ? 'border-sh-primary text-sh-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }
                    `}>
                      <ClockIcon className="w-4 h-4" />
                      Recurring Reminders
                    </Tab>
                    <Tab className={({ selected }) => `
                      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                      ${selected
                        ? 'border-sh-primary text-sh-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }
                    `}>
                      <BellIcon className="w-4 h-4" />
                      Daily Digest
                    </Tab>
                    <Tab className={({ selected }) => `
                      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                      ${selected
                        ? 'border-sh-primary text-sh-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }
                    `}>
                      <Cog6ToothIcon className="w-4 h-4" />
                      Preferences
                    </Tab>
                  </Tab.List>

                  <Tab.Panels className="p-6">
                    {/* Recurring Reminders Tab */}
                    <Tab.Panel>
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Tasks are automatically created from these reminders each day.
                            </p>
                            <div className="flex gap-2">
                              {reminders.length === 0 && (
                                <button
                                  onClick={seedDefaults}
                                  disabled={saving}
                                  className="text-sm text-sh-rust hover:underline"
                                >
                                  Load Defaults
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setIsCreatingNew(true);
                                  setEditingReminder({
                                    title: '',
                                    category: 'misc',
                                    frequency: 'weekly',
                                    dayOfWeek: 1,
                                    timeOfDay: '09:00:00',
                                    priority: 'normal',
                                    isActive: true,
                                  } as RecurringReminder);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-sh-primary text-white rounded-lg hover:bg-sh-primary/90"
                              >
                                <PlusIcon className="w-4 h-4" />
                                Add New
                              </button>
                            </div>
                          </div>

                          {/* New Reminder Form */}
                          {isCreatingNew && editingReminder && (
                            <ReminderForm
                              key="new"
                              reminder={editingReminder}
                              onSave={saveReminder}
                              onCancel={() => {
                                setIsCreatingNew(false);
                                setEditingReminder(null);
                              }}
                            />
                          )}

                          {/* Reminders List */}
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {reminders.length === 0 && !isCreatingNew ? (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No recurring reminders set up yet.</p>
                                <button
                                  onClick={seedDefaults}
                                  className="mt-2 text-sh-rust hover:underline"
                                >
                                  Load default workflow reminders
                                </button>
                              </div>
                            ) : (
                              reminders.map((reminder) => (
                                <div key={reminder.id}>
                                  {editingReminder?.id === reminder.id && !isCreatingNew ? (
                                    <ReminderForm
                                      key={editingReminder.id}
                                      reminder={editingReminder}
                                      onSave={saveReminder}
                                      onCancel={() => setEditingReminder(null)}
                                    />
                                  ) : (
                                    <div className={`
                                      flex items-center gap-3 p-3 rounded-lg border
                                      ${reminder.isActive
                                        ? 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                                        : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 opacity-60'
                                      }
                                    `}>
                                      {/* Toggle */}
                                      <button
                                        onClick={() => toggleReminderActive(reminder.id, !reminder.isActive)}
                                        className={`
                                          w-10 h-6 rounded-full relative transition-colors
                                          ${reminder.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}
                                        `}
                                      >
                                        <span className={`
                                          absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                                          ${reminder.isActive ? 'left-5' : 'left-1'}
                                        `} />
                                      </button>

                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                          {reminder.title}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {reminder.frequency === 'daily' && 'Every day'}
                                          {reminder.frequency === 'weekly' && `Every ${dayNames[reminder.dayOfWeek || 0]}`}
                                          {reminder.frequency === 'monthly' && `Monthly on the ${reminder.dayOfMonth}`}
                                          {reminder.timeOfDay && ` at ${reminder.timeOfDay.substring(0, 5)}`}
                                        </div>
                                      </div>

                                      {/* Category Badge */}
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300 capitalize">
                                        {reminder.category}
                                      </span>

                                      {/* Actions */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => setEditingReminder(reminder)}
                                          className="p-1.5 rounded text-gray-400 hover:text-sh-primary hover:bg-sh-primary/10"
                                        >
                                          <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => deleteReminder(reminder.id)}
                                          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          <TrashIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </Tab.Panel>

                    {/* Daily Digest Tab */}
                    <Tab.Panel>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              Daily Digest Email
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Receive a morning email with your tasks, deadlines, and new submissions.
                            </p>
                          </div>
                          <button
                            onClick={() => savePreferences({ dailyDigestEnabled: !preferences.dailyDigestEnabled })}
                            className={`
                              w-12 h-7 rounded-full relative transition-colors
                              ${preferences.dailyDigestEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}
                            `}
                          >
                            <span className={`
                              absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow
                              ${preferences.dailyDigestEnabled ? 'left-6' : 'left-1'}
                            `} />
                          </button>
                        </div>

                        {preferences.dailyDigestEnabled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Delivery Time
                            </label>
                            <input
                              type="time"
                              value={preferences.dailyDigestTime}
                              onChange={(e) => savePreferences({ dailyDigestTime: e.target.value })}
                              className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              The digest will be sent at this time each morning (EST).
                            </p>
                          </div>
                        )}
                      </div>
                    </Tab.Panel>

                    {/* Preferences Tab */}
                    <Tab.Panel>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Default View
                          </label>
                          <select
                            value={preferences.defaultView}
                            onChange={(e) => savePreferences({ defaultView: e.target.value })}
                            className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                          >
                            <option value="daily">Day View</option>
                            <option value="weekly">Week View</option>
                          </select>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            The view that loads by default when you open Command Center.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Theme
                          </label>
                          <select
                            value={preferences.theme}
                            onChange={(e) => savePreferences({ theme: e.target.value })}
                            className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                          >
                            <option value="system">System Default</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </select>
                        </div>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
