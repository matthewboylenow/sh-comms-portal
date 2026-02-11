// app/command-center/components/SubmissionsWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MegaphoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Submission {
  id: string;
  type: 'announcement' | 'websiteUpdate' | 'smsRequest' | 'avRequest' | 'flyerReview' | 'graphicDesign';
  title: string;
  submitterName: string;
  submittedAt: string;
}

const typeConfig = {
  announcement: { icon: MegaphoneIcon, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', label: 'Announcement' },
  websiteUpdate: { icon: GlobeAltIcon, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', label: 'Website' },
  smsRequest: { icon: ChatBubbleLeftRightIcon, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', label: 'SMS' },
  avRequest: { icon: VideoCameraIcon, color: 'text-red-600 bg-red-100 dark:bg-red-900/30', label: 'A/V' },
  flyerReview: { icon: DocumentTextIcon, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', label: 'Flyer' },
  graphicDesign: { icon: PencilSquareIcon, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30', label: 'Design' },
};

export default function SubmissionsWidget() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        // Fetch recent submissions from all tables
        const response = await fetch('/api/admin/fetchRequests');
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();

        // Combine and format all submissions
        const allSubmissions: Submission[] = [];

        // Process announcements
        (data.announcements || []).forEach((item: any) => {
          allSubmissions.push({
            id: item.id,
            type: 'announcement',
            title: item.fields?.['Announcement Body']?.substring(0, 50) + '...' || 'Announcement',
            submitterName: item.fields?.Name || 'Unknown',
            submittedAt: item.fields?.['Submitted At'] || item.fields?.createdAt || new Date().toISOString(),
          });
        });

        // Process website updates
        (data.websiteUpdates || []).forEach((item: any) => {
          allSubmissions.push({
            id: item.id,
            type: 'websiteUpdate',
            title: item.fields?.['Page to Update'] || 'Website Update',
            submitterName: item.fields?.Name || 'Unknown',
            submittedAt: item.fields?.['Submitted At'] || item.fields?.createdAt || new Date().toISOString(),
          });
        });

        // Process other types similarly...
        (data.smsRequests || []).forEach((item: any) => {
          allSubmissions.push({
            id: item.id,
            type: 'smsRequest',
            title: item.fields?.['SMS Message']?.substring(0, 50) + '...' || 'SMS Request',
            submitterName: item.fields?.Name || 'Unknown',
            submittedAt: item.fields?.['Submitted At'] || item.fields?.createdAt || new Date().toISOString(),
          });
        });

        (data.avRequests || []).forEach((item: any) => {
          allSubmissions.push({
            id: item.id,
            type: 'avRequest',
            title: item.fields?.['Event Name'] || 'A/V Request',
            submitterName: item.fields?.Name || 'Unknown',
            submittedAt: item.fields?.['Submitted At'] || item.fields?.createdAt || new Date().toISOString(),
          });
        });

        // Sort by date and take most recent
        allSubmissions.sort((a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );

        setSubmissions(allSubmissions.slice(0, 5));
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();

    // Refresh every 2 minutes
    const interval = setInterval(fetchSubmissions, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-sh-rust" />
          <h3 className="font-semibold text-gray-900 dark:text-white">New Submissions</h3>
        </div>
        <Link
          href="/admin"
          className="text-sm text-sh-rust hover:underline flex items-center gap-1"
        >
          View All <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-100 dark:divide-slate-700">
        {loading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Loading submissions...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 dark:text-red-400">
            Error loading submissions
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No new submissions
          </div>
        ) : (
          <AnimatePresence>
            {submissions.map((submission, index) => {
              const config = typeConfig[submission.type];
              const Icon = config.icon;

              return (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {submission.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {submission.submitterName} &middot;{' '}
                      {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                    {config.label}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
