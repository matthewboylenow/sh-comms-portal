// app/components/admin/WebsiteUpdateCard.tsx
'use client';

import { useState } from 'react';
import { Badge } from '../ui/Badge';
import CommentsSection from './CommentsSection';
import { motion } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  UserIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { formatCreatedTime, getAgeIndicator, getAgeIndicatorColor, extractTimestamp } from '../../utils/dateUtils';

type WebsiteUpdateRecord = {
  id: string;
  fields: Record<string, any>;
};

type WebsiteUpdateCardProps = {
  record: WebsiteUpdateRecord;
  onToggleCompleted: (tableName: 'websiteUpdates', recordId: string, currentValue: boolean) => void;
};

export default function WebsiteUpdateCard({
  record,
  onToggleCompleted
}: WebsiteUpdateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const f = record.fields;
  const isUrgent = f['Urgent'] === 'Yes' || f['Urgent'] === true;

  const timestamp = extractTimestamp(f, record);
  const ageIndicator = getAgeIndicator(timestamp);
  const ageColor = getAgeIndicatorColor(ageIndicator);

  // Copy formatted content to clipboard
  const handleCopy = async () => {
    const content = `Website Update Request
Page: ${f['Page to Update'] || 'Not specified'}
Ministry: ${f.Ministry || ''}
Submitted by: ${f.Name || ''}

${f.Description || ''}${f['Sign-Up URL'] ? `\n\nSign up: ${f['Sign-Up URL']}` : ''}`;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-gradient-to-br from-white via-white to-sh-cream-light/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900/50 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
        isUrgent ? 'border-l-4 border-l-red-500 border-gray-200/80 dark:border-slate-700/80' : 'border-gray-200/80 dark:border-slate-700/80 hover:border-gray-300/80 dark:hover:border-slate-600/80'
      }`}
      style={{ boxShadow: '0 2px 8px -2px rgba(31, 52, 109, 0.06), 0 4px 16px -4px rgba(31, 52, 109, 0.04)' }}
    >
      {/* Premium accent bar */}
      {!isUrgent && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sh-rust via-sh-rust-light to-sh-rust" />}

      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Main info */}
          <div className="min-w-0 flex-1">
            {/* Page to update */}
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">
                {f['Page to Update'] || 'Unspecified Page'}
              </h3>
              {isUrgent && (
                <Badge variant="danger" size="sm">
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>

            {/* Ministry & Submitter */}
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{f.Ministry || 'No Ministry'}</span>
              {f.Name && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" />
                    {f.Name}
                  </span>
                </>
              )}
              <span className={`text-xs ${ageColor}`}>
                • {formatCreatedTime(timestamp)}
              </span>
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
                onChange={() => onToggleCompleted('websiteUpdates', record.id, !!f.Completed)}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Body content */}
      <div className="px-5 pb-4">
        <div className="relative">
          <div className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${!expanded && 'max-h-20 overflow-hidden'}`}>
            {f.Description || 'No description provided.'}
          </div>
          {!expanded && f.Description?.length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-800 to-transparent" />
          )}
        </div>

        {f.Description?.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium text-sh-rust-600 hover:text-sh-rust-700 mt-1"
          >
            {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            {expanded ? 'Less' : 'More'}
          </button>
        )}

        {/* Sign Up URL */}
        {f['Sign-Up URL'] && (
          <a
            href={f['Sign-Up URL']}
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
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50/80 via-gray-50 to-gray-50/80 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-900/80 border-t border-gray-100/80 dark:border-slate-700/80">
        {/* Attachments */}
        {f['File Links'] && (
          <div className="flex items-center gap-2 mb-3">
            {f['File Links'].split(/\s+/).filter(Boolean).map((link: string, idx: number) => (
              <a
                key={idx}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-sh-rust-50 text-sh-rust-700 rounded-lg hover:bg-sh-rust-100 dark:bg-sh-rust-900/30 dark:text-sh-rust-300"
              >
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                File {idx + 1}
              </a>
            ))}
          </div>
        )}

        {/* Comments */}
        <CommentsSection
          recordId={record.id}
          tableName="websiteUpdates"
          requesterEmail={f.Email}
          requesterName={f.Name}
        />
      </div>
    </motion.div>
  );
}
