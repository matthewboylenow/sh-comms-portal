// app/command-center/components/QuickCapture.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  MegaphoneIcon,
  GlobeAltIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface QuickCaptureProps {
  onCreateTask: (task: {
    title: string;
    description?: string;
    category: string;
    priority?: string;
    dueDate?: string;
    dueTime?: string;
  }) => Promise<any>;
}

const categories = [
  { id: 'announcement', label: 'Announcement', icon: MegaphoneIcon, color: 'bg-blue-500' },
  { id: 'website', label: 'Website Update', icon: GlobeAltIcon, color: 'bg-purple-500' },
  { id: 'av', label: 'A/V Request', icon: VideoCameraIcon, color: 'bg-emerald-500' },
  { id: 'flyer', label: 'Flyer/Graphic', icon: DocumentTextIcon, color: 'bg-amber-500' },
  { id: 'misc', label: 'Miscellaneous', icon: EllipsisHorizontalIcon, color: 'bg-gray-500' },
];

const priorities = [
  { id: 'low', label: 'Low', color: 'bg-gray-400' },
  { id: 'normal', label: 'Normal', color: 'bg-blue-500' },
  { id: 'high', label: 'High', color: 'bg-amber-500' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

export default function QuickCapture({ onCreateTask }: QuickCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('misc');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('misc');
      setPriority('normal');
      setDueDate('');
      setDueTime('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateTask({
        title: title.trim(),
        category,
        priority: 'normal',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
      });
      setTitle('');
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-sh-rust hover:bg-sh-rust-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <PlusIcon className="w-7 h-7" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-sh-navy to-sh-navy-700">
                <h2 className="text-lg font-semibold text-white">Quick Task</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-white/80 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Title */}
                <div>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-3 text-lg bg-gray-50 dark:bg-slate-700 border-0 rounded-xl focus:ring-2 focus:ring-sh-rust dark:text-white placeholder-gray-400"
                    required
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`
                          flex flex-col items-center p-2 rounded-lg transition-all
                          ${category === cat.id
                            ? 'bg-sh-navy text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                          }
                        `}
                      >
                        <cat.icon className="w-5 h-5 mb-1" />
                        <span className="text-xs truncate w-full text-center">{cat.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details (optional)"
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-0 rounded-xl focus:ring-2 focus:ring-sh-rust dark:text-white placeholder-gray-400 resize-none"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border-0 rounded-lg focus:ring-2 focus:ring-sh-rust dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <ClockIcon className="w-4 h-4 inline mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border-0 rounded-lg focus:ring-2 focus:ring-sh-rust dark:text-white text-sm"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`
                          flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                          ${priority === p.id
                            ? `${p.color} text-white`
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                          }
                        `}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  className="w-full py-3 bg-sh-rust hover:bg-sh-rust-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add Task'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
