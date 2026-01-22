// app/components/admin/GraphicDesignCard.tsx
'use client';

import { useState } from 'react';
import { Badge } from '../ui/Badge';
import CommentsSection from './CommentsSection';
import { motion } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  PaintBrushIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import { formatCreatedTime, getAgeIndicator, getAgeIndicatorColor, formatEventDate, extractTimestamp } from '../../utils/dateUtils';

type GraphicDesignRecord = {
  id: string;
  fields: Record<string, any>;
};

type GraphicDesignCardProps = {
  record: GraphicDesignRecord;
  onToggleCompleted: (tableName: 'graphicDesign', recordId: string, currentValue: boolean) => void;
  onUpdateStatus?: (recordId: string, status: string) => void;
};

export default function GraphicDesignCard({
  record,
  onToggleCompleted,
  onUpdateStatus
}: GraphicDesignCardProps) {
  const [expanded, setExpanded] = useState(false);
  const f = record.fields;

  const timestamp = extractTimestamp(f, record);
  const ageIndicator = getAgeIndicator(timestamp);
  const ageColor = getAgeIndicatorColor(ageIndicator);

  const projectType = f['Project Type'] || 'Unnamed Project';
  const description = f['Project Description'] || 'No description provided.';
  const deadline = f['Deadline'] || '';
  const priority = f['Priority'] || 'Medium';
  const status = f['Status'] || 'Pending';
  const sizeDimensions = f['Required Size/Dimensions'] || '';
  const brandColors = f['Brand Colors Required'] || [];
  const isUrgent = priority === 'Urgent';
  const fileLinks = f['File Links'] || '';

  const getStatusBadge = () => {
    switch (status) {
      case 'Pending':
        return <Badge size="sm">Pending</Badge>;
      case 'In Design':
        return <Badge variant="primary" size="sm">In Design</Badge>;
      case 'Review':
        return <Badge variant="warning" size="sm">Review</Badge>;
      case 'Completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'Canceled':
        return <Badge variant="danger" size="sm">Canceled</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const getPriorityStyle = () => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'Urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-gradient-to-br from-white via-white to-rose-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-rose-900/10 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
        isUrgent ? 'border-l-4 border-l-red-500 border-gray-200/80 dark:border-slate-700/80' : 'border-gray-200/80 dark:border-slate-700/80 hover:border-gray-300/80 dark:hover:border-slate-600/80'
      }`}
      style={{ boxShadow: '0 2px 8px -2px rgba(31, 52, 109, 0.06), 0 4px 16px -4px rgba(31, 52, 109, 0.04)' }}
    >
      {/* Premium gradient accent bar */}
      {!isUrgent && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500" />}

      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/40 dark:to-rose-900/20 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-800/50 shadow-sm">
              <PaintBrushIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>

            {/* Title & Meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-lg text-sh-navy dark:text-white truncate">
                  {projectType}
                </h3>
                {getStatusBadge()}
                {isUrgent && (
                  <Badge variant="danger" size="sm">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{f.Name || 'No Name'}</span>
                {f.Ministry && (
                  <span className="text-gray-500 dark:text-gray-400">• {f.Ministry}</span>
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
              onChange={() => onToggleCompleted('graphicDesign', record.id, !!f.Completed)}
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
        {/* Priority & Deadline */}
        <div className="flex flex-wrap gap-3 mb-4">
          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg ${getPriorityStyle()}`}>
            {priority} Priority
          </span>
          {deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CalendarIcon className="w-4 h-4 text-rose-600" />
              <span>Deadline: {formatEventDate(deadline)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="relative">
          <div className={`space-y-4 ${!expanded && 'max-h-24 overflow-hidden'}`}>
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4 rounded-xl">
              <label className="block text-xs font-medium text-rose-700 dark:text-rose-300 uppercase tracking-wide mb-2">
                Project Description
              </label>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                {description}
              </p>
            </div>

            {sizeDimensions && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Required Dimensions</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{sizeDimensions}</p>
              </div>
            )}

            {brandColors && brandColors.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Brand Colors</label>
                <div className="flex items-center gap-2">
                  <SwatchIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{brandColors.join(', ')}</span>
                </div>
              </div>
            )}
          </div>

          {!expanded && description?.length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-slate-800 to-transparent" />
          )}
        </div>

        {description?.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium text-sh-rust hover:text-sh-rust-600 mt-2 transition-colors"
          >
            {expanded ? <><ChevronUpIcon className="w-4 h-4" />Show Less</> : <><ChevronDownIcon className="w-4 h-4" />Show More</>}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50/80 via-rose-50/30 to-gray-50/80 dark:from-slate-900/80 dark:via-rose-900/10 dark:to-slate-900/80 border-t border-gray-100/80 dark:border-slate-700/80 space-y-4">
        {/* Status Selector */}
        {onUpdateStatus && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Update Status
            </label>
            <select
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-sh-navy focus:border-transparent transition-all"
              value={status}
              onChange={(e) => onUpdateStatus(record.id, e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In Design">In Design</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>
        )}

        {/* Attachments */}
        {fileLinks && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Attachments</label>
            <div className="space-y-2">
              {fileLinks.split(/\s+/).filter(Boolean).map((link: string, idx: number) => (
                <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sh-rust hover:text-sh-rust-600 transition-colors group">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="truncate">{link.split('/').pop() || `Attachment ${idx + 1}`}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <CommentsSection recordId={record.id} tableName="graphicDesign" requesterEmail={f.Email} requesterName={f.Name} />
      </div>
    </motion.div>
  );
}
