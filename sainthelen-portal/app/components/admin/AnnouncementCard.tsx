// app/components/admin/AnnouncementCard.tsx
'use client';

import { useState } from 'react';
import { Badge } from '../ui/Badge';
import CommentsSection from './CommentsSection';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  EnvelopeIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  UserIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { formatFullDate, formatTime, formatCreatedTime, getAgeIndicator, getAgeIndicatorColor, extractTimestamp } from '../../utils/dateUtils';

type AnnouncementRecord = {
  id: string;
  fields: Record<string, any>;
};

type AnnouncementCardProps = {
  record: AnnouncementRecord;
  summarizeMap: Record<string, boolean>;
  calendarMap?: Record<string, boolean>;
  onToggleSummarize: (recordId: string, isChecked: boolean) => void;
  onToggleCalendar?: (recordId: string, isChecked: boolean) => void;
  onOverrideStatus: (recordId: string, newStatus: string) => void;
  onToggleCompleted: (tableName: 'announcements', recordId: string, currentValue: boolean) => void;
};

export default function AnnouncementCard({
  record,
  summarizeMap,
  calendarMap = {},
  onToggleSummarize,
  onToggleCalendar,
  onOverrideStatus,
  onToggleCompleted
}: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const f = record.fields;

  const timestamp = extractTimestamp(f, record);
  const ageIndicator = getAgeIndicator(timestamp);
  const ageColor = getAgeIndicatorColor(ageIndicator);

  // Format the event date and time for display
  const eventDate = formatFullDate(f['Date of Event']);
  const eventTime = formatTime(f['Time of Event']);
  const eventDateTime = eventTime ? `${eventDate} at ${eventTime}` : eventDate;

  // Copy formatted content to clipboard
  const handleCopy = async () => {
    const content = `${f.Name || 'Untitled Event'}
${f.Ministry || ''}
${eventDateTime}

${f['Announcement Body'] || ''}${f['Sign Up URL'] ? `\n\nSign up: ${f['Sign Up URL']}` : ''}`;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Email Blast':
        return <EnvelopeIcon className="w-3.5 h-3.5" />;
      case 'Bulletin':
        return <DocumentTextIcon className="w-3.5 h-3.5" />;
      case 'Church Screens':
        return <ComputerDesktopIcon className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Header with key info */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Main info */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">
              {f.Name || 'Untitled Announcement'}
            </h3>

            {/* Ministry & Submitter */}
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{f.Ministry || 'No Ministry'}</span>
              {f['Submitter Name'] && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" />
                    {f['Submitter Name']}
                  </span>
                </>
              )}
            </div>

            {/* Event Date/Time - prominent */}
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-sh-navy-700 dark:text-sh-navy-300">
              <CalendarIcon className="w-4 h-4" />
              <span>{eventDateTime}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={`p-2 rounded-lg transition-all ${
                copied
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
              }`}
              title="Copy to clipboard"
            >
              {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
            </button>

            {/* Completed toggle */}
            <label className="flex items-center cursor-pointer">
              <div className={`relative w-10 h-6 rounded-full transition-colors ${f.Completed ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${f.Completed ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <input
                type="checkbox"
                checked={!!f.Completed}
                onChange={() => onToggleCompleted('announcements', record.id, !!f.Completed)}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Platforms */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(f.Platforms || []).map((platform: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300"
            >
              {getPlatformIcon(platform)}
              {platform}
            </span>
          ))}
          <span className={`text-xs ${ageColor}`}>
            {formatCreatedTime(timestamp)}
          </span>
        </div>
      </div>

      {/* Body content */}
      <div className="px-4 pb-3">
        <div className="relative">
          <div className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${!expanded && 'max-h-20 overflow-hidden'}`}>
            {f['Announcement Body'] || 'No description provided.'}
          </div>
          {!expanded && f['Announcement Body']?.length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-800 to-transparent" />
          )}
        </div>

        {f['Announcement Body']?.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium text-sh-rust-600 hover:text-sh-rust-700 mt-1"
          >
            {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            {expanded ? 'Less' : 'More'}
          </button>
        )}

        {/* Sign Up URL */}
        {f['Sign Up URL'] && (
          <a
            href={f['Sign Up URL']}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-sm text-sh-rust-600 hover:text-sh-rust-700 font-medium"
          >
            <LinkIcon className="w-4 h-4" />
            Sign-up link
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* Override Status */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</label>
            <select
              className="text-sm px-2 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-sh-navy-500"
              value={f.overrideStatus || 'none'}
              onChange={(e) => onOverrideStatus(record.id, e.target.value)}
            >
              <option value="none">Normal</option>
              <option value="forceExclude">Exclude</option>
              <option value="forceInclude">Include</option>
              <option value="defer">Defer</option>
            </select>
          </div>

          {/* Attachments */}
          {f['File Links'] && (
            <div className="flex items-center gap-2">
              {f['File Links'].split(/\s+/).filter(Boolean).map((link: string, idx: number) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-sh-navy-50 text-sh-navy-700 rounded-lg hover:bg-sh-navy-100 dark:bg-sh-navy-900/30 dark:text-sh-navy-300"
                >
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  File {idx + 1}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="mt-3">
          <CommentsSection
            recordId={record.id}
            tableName="announcements"
            requesterEmail={f.Email}
            requesterName={f.Name}
          />
        </div>
      </div>
    </motion.div>
  );
}
