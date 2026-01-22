// app/components/admin/SmsRequestCard.tsx
'use client';

import { Badge } from '../ui/Badge';
import CommentsSection from './CommentsSection';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatCreatedTime, getAgeIndicator, getAgeIndicatorColor, formatEventDate, extractTimestamp } from '../../utils/dateUtils';

type SmsRequestRecord = {
  id: string;
  fields: Record<string, any>;
};

type SmsRequestCardProps = {
  record: SmsRequestRecord;
  onToggleCompleted: (tableName: 'smsRequests', recordId: string, currentValue: boolean) => void;
};

export default function SmsRequestCard({
  record,
  onToggleCompleted
}: SmsRequestCardProps) {
  const f = record.fields;

  const timestamp = extractTimestamp(f, record);
  const ageIndicator = getAgeIndicator(timestamp);
  const ageColor = getAgeIndicatorColor(ageIndicator);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-900/10 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 transition-all duration-200 hover:shadow-lg hover:border-gray-300/80 dark:hover:border-slate-600/80"
      style={{ boxShadow: '0 2px 8px -2px rgba(31, 52, 109, 0.06), 0 4px 16px -4px rgba(31, 52, 109, 0.04)' }}
    >
      {/* Premium gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />

      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/40 dark:to-emerald-900/20 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
              <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Title & Meta */}
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-bold text-lg text-sh-navy dark:text-white truncate">
                {f.Name || 'Unnamed Request'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                {f.Ministry || 'No Ministry'}
              </p>
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
              onChange={() => onToggleCompleted('smsRequests', record.id, !!f.Completed)}
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
        {f['Requested Date'] && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>Requested Date: {formatEventDate(f['Requested Date'])}</span>
          </div>
        )}

        {/* SMS Message */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl mb-4">
          <label className="block text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-2">
            SMS Message
          </label>
          <p className="text-sm text-gray-800 dark:text-gray-200">
            {f['SMS Message'] || 'No message provided.'}
          </p>
        </div>

        {f['Additional Info'] && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Additional Information
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {f['Additional Info']}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50/80 via-emerald-50/30 to-gray-50/80 dark:from-slate-900/80 dark:via-emerald-900/10 dark:to-slate-900/80 border-t border-gray-100/80 dark:border-slate-700/80 space-y-4">
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

        <CommentsSection recordId={record.id} tableName="smsRequests" requesterEmail={f.Email} requesterName={f.Name} />
      </div>
    </motion.div>
  );
}
