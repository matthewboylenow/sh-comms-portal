// app/components/admin/FlyerReviewCard.tsx
'use client';

import { useState } from 'react';
import { Badge } from '../ui/Badge';
import CommentsSection from './CommentsSection';
import { motion } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { formatCreatedTime, getAgeIndicator, getAgeIndicatorColor, formatEventDate, extractTimestamp } from '../../utils/dateUtils';

type FlyerReviewRecord = {
  id: string;
  fields: Record<string, any>;
};

type FlyerReviewCardProps = {
  record: FlyerReviewRecord;
  onToggleCompleted: (tableName: 'flyerReviews', recordId: string, currentValue: boolean) => void;
};

export default function FlyerReviewCard({
  record,
  onToggleCompleted
}: FlyerReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const f = record.fields;
  const isUrgent = f.Urgency === 'urgent';

  const timestamp = extractTimestamp(f, record);
  const ageIndicator = getAgeIndicator(timestamp);
  const ageColor = getAgeIndicatorColor(ageIndicator);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ${
        isUrgent ? 'border-l-4 border-l-red-500 border-gray-200 dark:border-slate-700' : 'border-gray-200 dark:border-slate-700'
      }`}
    >
      {/* Gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />

      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Title & Meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-lg text-sh-navy dark:text-white truncate">
                  {f['Event Name'] || 'Unnamed Flyer'}
                </h3>
                {isUrgent && (
                  <Badge variant="danger" size="sm">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{f.Ministry || 'No Ministry'}</span>
                {f['Target Audience'] && (
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="w-3.5 h-3.5" />
                    {f['Target Audience']}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Completed Toggle */}
          <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
            <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${f.Completed ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${f.Completed ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <input
              type="checkbox"
              checked={!!f.Completed}
              onChange={() => onToggleCompleted('flyerReviews', record.id, !!f.Completed)}
              className="sr-only"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-sh-navy dark:group-hover:text-white transition-colors">
              {f.Completed ? 'Done' : 'Mark Done'}
            </span>
          </label>
        </div>

        {/* Timestamp */}
        <div className={`flex items-center gap-1 text-xs mt-3 ${ageColor}`}>
          <ClockIcon className="w-3.5 h-3.5" />
          <span>Submitted {formatCreatedTime(timestamp)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        {/* Event Date & Purpose */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          {f['Event Date'] && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <CalendarIcon className="w-4 h-4 text-amber-600" />
              <span>Event Date: {formatEventDate(f['Event Date'])}</span>
            </div>
          )}
          {f['Purpose'] && (
            <div className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Purpose:</span> {f['Purpose']}
            </div>
          )}
        </div>

        {/* Feedback Needed */}
        <div className="relative">
          <div className={`space-y-4 ${!expanded && 'max-h-24 overflow-hidden'}`}>
            {f['Feedback Needed'] && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl">
                <label className="block text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2">
                  Feedback Needed
                </label>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {f['Feedback Needed']}
                </p>
              </div>
            )}

            {f['Reviewer Notes'] && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reviewer Notes</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{f['Reviewer Notes']}</p>
              </div>
            )}
          </div>

          {!expanded && f['Feedback Needed']?.length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-slate-800 to-transparent" />
          )}
        </div>

        {f['Feedback Needed']?.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium text-sh-rust hover:text-sh-rust-600 mt-2 transition-colors"
          >
            {expanded ? <><ChevronUpIcon className="w-4 h-4" />Show Less</> : <><ChevronDownIcon className="w-4 h-4" />Show More</>}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-sh-cream dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 space-y-4">
        {f['File Links'] && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Flyer Files</label>
            <div className="space-y-2">
              {f['File Links'].split(/\s+/).filter(Boolean).map((link: string, idx: number) => (
                <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sh-rust hover:text-sh-rust-600 transition-colors group">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="truncate">{link.split('/').pop() || `File ${idx + 1}`}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <CommentsSection recordId={record.id} tableName="flyerReviews" requesterEmail={f.Email} requesterName={f.Name} />
      </div>
    </motion.div>
  );
}
