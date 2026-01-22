// app/components/admin/DashboardStats.tsx
'use client';

import {
  MegaphoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { getCurrentWeekRange, formatFullDate, formatTime, isDateInRange } from '../../utils/dateUtils';

type DashboardStatsProps = {
  announcements: any[];
  websiteUpdates: any[];
  smsRequests: any[];
  avRequests: any[];
  flyerReviews: any[];
  graphicDesign: any[];
  hideCompleted: boolean;
};

export default function DashboardStats({
  announcements,
  websiteUpdates,
  smsRequests,
  avRequests,
  flyerReviews,
  graphicDesign,
  hideCompleted
}: DashboardStatsProps) {
  // Get current week range for bulletin cycle
  const weekRange = getCurrentWeekRange();

  // Calculate pending counts
  const pendingAnnouncements = announcements.filter(r => !r.fields.Completed).length;
  const pendingWebsiteUpdates = websiteUpdates.filter(r => !r.fields.Completed).length;
  const pendingSmsRequests = smsRequests.filter(r => !r.fields.Completed).length;
  const pendingAvRequests = avRequests.filter(r => !r.fields.Completed).length;
  const pendingFlyerReviews = flyerReviews.filter(r => !r.fields.Completed).length;
  const pendingGraphicDesign = graphicDesign.filter(r => !r.fields.Completed).length;

  const totalPending = pendingAnnouncements + pendingWebsiteUpdates + pendingSmsRequests +
    pendingAvRequests + pendingFlyerReviews + pendingGraphicDesign;

  // Get this week's events from announcements
  const thisWeekEvents = announcements.filter(r => {
    if (r.fields.Completed) return false;
    const eventDate = r.fields['Date of Event'];
    return isDateInRange(eventDate, weekRange.start, weekRange.end);
  });

  // Stats configuration - simpler, cleaner
  const stats = [
    { title: "Announcements", count: pendingAnnouncements, icon: MegaphoneIcon, color: "text-sh-navy-600", bg: "bg-sh-navy-50 dark:bg-sh-navy-900/30" },
    { title: "Website", count: pendingWebsiteUpdates, icon: GlobeAltIcon, color: "text-sh-rust-600", bg: "bg-sh-rust-50 dark:bg-sh-rust-900/30" },
    { title: "SMS", count: pendingSmsRequests, icon: ChatBubbleLeftRightIcon, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
    { title: "A/V", count: pendingAvRequests, icon: VideoCameraIcon, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/30" },
    { title: "Flyers", count: pendingFlyerReviews, icon: DocumentTextIcon, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/30" },
    { title: "Design", count: pendingGraphicDesign, icon: PencilSquareIcon, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/30" }
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Week Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Week Info */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-sh-navy-100 dark:bg-sh-navy-900/30 rounded-xl flex items-center justify-center">
                <CalendarDaysIcon className="w-5 h-5 text-sh-navy-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-sh-navy dark:text-white">
                  This Week: {weekRange.label}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Email blast & bulletin cycle
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-sh-navy-50 dark:bg-sh-navy-900/30 rounded-xl">
              <EnvelopeIcon className="w-5 h-5 text-sh-navy-600" />
              <div>
                <p className="text-2xl font-bold text-sh-navy-700 dark:text-sh-navy-300">{thisWeekEvents.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-sh-rust-50 dark:bg-sh-rust-900/30 rounded-xl">
              <NewspaperIcon className="w-5 h-5 text-sh-rust-600" />
              <div>
                <p className="text-2xl font-bold text-sh-rust-700 dark:text-sh-rust-300">{totalPending}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* This Week's Events Preview */}
        {thisWeekEvents.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
              Events This Week
            </h3>
            <div className="space-y-2">
              {thisWeekEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {event.fields.Name || event.fields.Ministry || 'Untitled'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {event.fields.Ministry}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatFullDate(event.fields['Date of Event']).split(',').slice(0, 2).join(',')}
                    {event.fields['Time of Event'] && (
                      <span className="ml-1 text-gray-500">
                        {formatTime(event.fields['Time of Event'])}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {thisWeekEvents.length > 5 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-1">
                  +{thisWeekEvents.length - 5} more events
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats Grid - Simple counts */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center"
          >
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.title}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
