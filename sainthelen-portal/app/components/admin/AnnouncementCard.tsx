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
  calendarMap?: Record<string, boolean>;
  onToggleCalendar?: (recordId: string, isChecked: boolean) => void;
  onOverrideStatus: (recordId: string, newStatus: string) => void;
  onToggleCompleted: (tableName: 'announcements', recordId: string, currentValue: boolean) => void;
};

export default function AnnouncementCard({
  record,
  calendarMap = {},
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

  // Format the event date(s) and time(s) for display. Newer records carry an
  // 'Event Dates' array (multiple occurrences); older ones just have the
  // single 'Date of Event' / 'Time of Event' pair.
  const eventDateEntries: Array<{ date: string; time?: string }> =
    Array.isArray(f['Event Dates']) && f['Event Dates'].length > 0
      ? f['Event Dates']
      : f['Date of Event']
        ? [{ date: f['Date of Event'], time: f['Time of Event'] }]
        : [];

  const formattedEventDates = eventDateEntries.map((entry) => {
    const d = formatFullDate(entry.date);
    const t = entry.time ? formatTime(entry.time) : '';
    return t ? `${d} at ${t}` : d;
  });

  const eventDateTime = formattedEventDates[0] || formatFullDate(f['Date of Event']);

  // Sign-up links: newer records carry a labeled array, older ones a single URL
  const signUpLinks: Array<{ label?: string; url: string }> =
    Array.isArray(f['Sign Up Links']) && f['Sign Up Links'].length > 0
      ? f['Sign Up Links']
      : f['Sign Up URL']
        ? [{ url: f['Sign Up URL'] }]
        : [];

  // Format the requested publication weekend
  const getRequestedWeekendLabel = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      // dateStr is YYYY-MM-DD (Saturday)
      const parts = dateStr.split('-');
      const saturday = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      const wednesday = new Date(saturday);
      wednesday.setDate(saturday.getDate() - 3);

      const satMonth = saturday.toLocaleDateString('en-US', { month: 'long' });
      const sunMonth = sunday.toLocaleDateString('en-US', { month: 'long' });
      const satDay = saturday.getDate();
      const sunDay = sunday.getDate();
      const year = saturday.getFullYear();

      const weekendLabel = satMonth === sunMonth
        ? `Weekend of ${satMonth} ${satDay}-${sunDay}, ${year}`
        : `Weekend of ${satMonth} ${satDay} - ${sunMonth} ${sunDay}, ${year}`;

      const emailBlastLabel = wednesday.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      return { weekendLabel, emailBlastLabel };
    } catch {
      return null;
    }
  };

  const requestedWeekend = getRequestedWeekendLabel(f['Promotion Start Date']);

  // Copy formatted content to clipboard
  const handleCopy = async () => {
    const signUpText = signUpLinks
      .map((link) => (link.label ? `${link.label}: ${link.url}` : link.url))
      .join('\n');
    const content = `${f.Name || 'Untitled Event'}
${f.Ministry || ''}
${formattedEventDates.join('\n')}${requestedWeekend ? `\nRequested: ${requestedWeekend.weekendLabel}` : ''}

${f['Announcement Body'] || ''}${signUpText ? `\n\nSign up:\n${signUpText}` : ''}${f['Publication Notes'] ? `\n\nPublication Notes: ${f['Publication Notes']}` : ''}`;

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
      className="relative overflow-hidden bg-gradient-to-br from-white via-white to-sh-cream-light/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900/50 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 transition-all duration-200 hover:shadow-lg hover:border-gray-300/80 dark:hover:border-slate-600/80"
      style={{ boxShadow: '0 2px 8px -2px rgba(31, 52, 109, 0.06), 0 4px 16px -4px rgba(31, 52, 109, 0.04)' }}
    >
      {/* Premium accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sh-navy via-sh-navy-light to-sh-navy" />

      {/* Header with key info */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Main info */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">
                {f.Name || 'Untitled Announcement'}
              </h3>
              {f['Social Consideration'] && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  Social
                </span>
              )}
            </div>

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

            {/* Event Date(s)/Time(s) - prominent */}
            {formattedEventDates.length > 0 ? (
              <div className="mt-2 space-y-1">
                {formattedEventDates.map((dateStr, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm font-medium text-sh-navy-700 dark:text-sh-navy-300">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{dateStr}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-sm font-medium text-sh-navy-700 dark:text-sh-navy-300">
                <CalendarIcon className="w-4 h-4" />
                <span>{eventDateTime}</span>
              </div>
            )}

            {/* Requested Publication Weekend */}
            {requestedWeekend && (
              <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                  <ClockIcon className="w-4 h-4" />
                  <span>{requestedWeekend.weekendLabel}</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 ml-6">
                  Email blast: {requestedWeekend.emailBlastLabel}
                </p>
              </div>
            )}
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
      <div className="px-5 pb-4">
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

        {/* Sign-Up Links */}
        {signUpLinks.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {signUpLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-sh-rust-600 hover:text-sh-rust-700 font-medium"
              >
                <LinkIcon className="w-4 h-4" />
                {link.label ? `Sign-up: ${link.label}` : 'Sign-up link'}
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        )}

        {/* Publication Notes */}
        {f['Publication Notes'] && (
          <div className="mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Publication Notes</p>
            <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{f['Publication Notes']}</p>
          </div>
        )}

        {/* Social Media Consideration */}
        {f['Social Consideration'] && (
          <div className="mt-3 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Flagged for Social Media</p>
            {f['Social What To Know'] && (
              <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">{f['Social What To Know']}</p>
            )}
            {f['Social Has Photos'] && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Photos/video: {f['Social Has Photos'] === 'yes' ? 'Yes' : f['Social Has Photos'] === 'not_yet' ? 'Not yet — coming after the event' : 'No'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50/80 via-gray-50 to-gray-50/80 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-900/80 border-t border-gray-100/80 dark:border-slate-700/80">
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
