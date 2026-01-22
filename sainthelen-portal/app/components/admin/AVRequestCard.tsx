// app/components/admin/AVRequestCard.tsx
'use client';

import { useState } from 'react';
import { Badge } from '../ui/Badge';
import CommentsSection from './CommentsSection';
import { motion } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { formatCreatedTime, getAgeIndicator, getAgeIndicatorColor, extractTimestamp } from '../../utils/dateUtils';

type AVRequestRecord = {
  id: string;
  fields: Record<string, any>;
};

type AVRequestCardProps = {
  record: AVRequestRecord;
  onToggleCompleted: (tableName: 'avRequests', recordId: string, currentValue: boolean) => void;
};

export default function AVRequestCard({
  record,
  onToggleCompleted
}: AVRequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const f = record.fields;
  const needsLivestream = !!f['Needs Livestream'];

  const timestamp = extractTimestamp(f, record);
  const ageIndicator = getAgeIndicator(timestamp);
  const ageColor = getAgeIndicatorColor(ageIndicator);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-gradient-to-br from-white via-white to-purple-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-purple-900/10 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
        needsLivestream ? 'border-l-4 border-l-red-500 border-gray-200/80 dark:border-slate-700/80' : 'border-gray-200/80 dark:border-slate-700/80 hover:border-gray-300/80 dark:hover:border-slate-600/80'
      }`}
      style={{ boxShadow: '0 2px 8px -2px rgba(31, 52, 109, 0.06), 0 4px 16px -4px rgba(31, 52, 109, 0.04)' }}
    >
      {/* Premium gradient accent bar */}
      {!needsLivestream && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500" />}

      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/40 dark:to-purple-900/20 rounded-xl flex items-center justify-center border border-purple-100 dark:border-purple-800/50 shadow-sm">
              <VideoCameraIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>

            {/* Title & Meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-lg text-sh-navy dark:text-white truncate">
                  {f['Event Name'] || 'Unnamed Event'}
                </h3>
                {needsLivestream && (
                  <Badge variant="danger" size="sm">
                    <SignalIcon className="w-3 h-3 mr-1" />
                    Livestream
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{f.Ministry || 'No Ministry'}</span>
                {f.Location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    {f.Location}
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
              onChange={() => onToggleCompleted('avRequests', record.id, !!f.Completed)}
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
        {/* Event Dates */}
        {f['Event Dates and Times'] && (
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-3 rounded-xl">
            <CalendarIcon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <span className="whitespace-pre-line">{f['Event Dates and Times']}</span>
          </div>
        )}

        {/* Expandable Content */}
        <div className="relative">
          <div className={`space-y-4 ${!expanded && 'max-h-24 overflow-hidden'}`}>
            {f['Description'] && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Event Description</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{f['Description']}</p>
              </div>
            )}

            {f['A/V Needs'] && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">A/V Needs</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{f['A/V Needs']}</p>
              </div>
            )}

            {f['Expected Attendees'] && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UsersIcon className="w-4 h-4" />
                <span>Expected: {f['Expected Attendees']} attendees</span>
              </div>
            )}

            {f['Additional Notes'] && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Additional Notes</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{f['Additional Notes']}</p>
              </div>
            )}
          </div>

          {!expanded && (f['Description'] || f['A/V Needs']) && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-slate-800 to-transparent" />
          )}
        </div>

        {(f['Description'] || f['A/V Needs']) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium text-sh-rust hover:text-sh-rust-600 mt-2 transition-colors"
          >
            {expanded ? <><ChevronUpIcon className="w-4 h-4" />Show Less</> : <><ChevronDownIcon className="w-4 h-4" />Show More</>}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50/80 via-purple-50/30 to-gray-50/80 dark:from-slate-900/80 dark:via-purple-900/10 dark:to-slate-900/80 border-t border-gray-100/80 dark:border-slate-700/80 space-y-4">
        {f['File Links'] && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Attachments</label>
            <div className="space-y-2">
              {f['File Links'].split(/\s+/).filter(Boolean).map((link: string, idx: number) => (
                <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sh-rust hover:text-sh-rust-600 transition-colors group">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="truncate">{link.split('/').pop() || `Attachment ${idx + 1}`}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <CommentsSection recordId={record.id} tableName="avRequests" requesterEmail={f.Email} requesterName={f.Name} />
      </div>
    </motion.div>
  );
}
