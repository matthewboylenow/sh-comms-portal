// app/command-center/components/TimingGuide.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EnvelopeIcon,
  NewspaperIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface TimingItem {
  day: string;
  deadline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const timingItems: TimingItem[] = [
  {
    day: 'Wednesday',
    deadline: '11:30 AM',
    description: 'Email blast content deadline. All announcements must be finalized.',
    icon: EnvelopeIcon,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    day: 'Saturday',
    deadline: 'Morning',
    description: 'Bulletin printing (450 copies), pre-mass screens, and pregame video.',
    icon: NewspaperIcon,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    day: 'Sunday',
    deadline: 'Afternoon',
    description: 'Record, edit, and release the weekly "5 AND THRIVE" video.',
    icon: CalendarDaysIcon,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
];

export default function TimingGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5 text-sh-navy dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Timing Guide</h3>
        </div>
        {expanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {timingItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                >
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.day}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.deadline}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 bg-sh-cream dark:bg-sh-navy/20 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Tip:</strong> Plan your week backwards from these deadlines. Wednesday's
                  email blast typically includes announcements for the following Sunday, so gather
                  content early in the week.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
