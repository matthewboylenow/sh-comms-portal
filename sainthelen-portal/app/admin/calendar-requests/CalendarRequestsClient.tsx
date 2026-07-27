// app/admin/calendar-requests/CalendarRequestsClient.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import AnnouncementCard from '../../components/admin/AnnouncementCard';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';

type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

export default function CalendarRequestsClient() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [calendarMap, setCalendarMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCalendarRequests();
    }
  }, [status, showCompleted]);

  const fetchCalendarRequests = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/fetchRequests?includeCompleted=${showCompleted}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      // Filter announcements to only those with "Add to Events Calendar" = "Yes"
      const calendarAnnouncements = (data.announcements || []).filter(
        (r: AdminRecord) => r.fields['Add to Events Calendar'] === 'Yes'
      );

      setAnnouncements(calendarAnnouncements);
    } catch (err) {
      console.error('Error fetching calendar requests:', err);
      toast.error('Failed to load calendar requests');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCalendar = (recordId: string, isChecked: boolean) => {
    setCalendarMap((prev) => ({ ...prev, [recordId]: isChecked }));
  };

  const handleOverrideStatus = async (recordId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/updateOverrideStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, newStatus }),
      });
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? { ...r, fields: { ...r.fields, 'Approval Status': newStatus } }
              : r
          )
        );
        toast.success('Status updated');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleToggleCompleted = async (
    tableName: 'announcements',
    recordId: string,
    currentValue: boolean
  ) => {
    try {
      const res = await fetch('/api/admin/markCompleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: tableName,
          recordId,
          completed: !currentValue,
        }),
      });
      if (res.ok) {
        if (!currentValue && !showCompleted) {
          // Removing from view since it's now completed
          setAnnouncements((prev) => prev.filter((r) => r.id !== recordId));
        } else {
          setAnnouncements((prev) =>
            prev.map((r) =>
              r.id === recordId
                ? { ...r, fields: { ...r.fields, Completed: !currentValue } }
                : r
            )
          );
        }
        toast.success(!currentValue ? 'Marked as completed' : 'Marked as incomplete');
      }
    } catch (err) {
      console.error('Error toggling completed:', err);
      toast.error('Failed to update');
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayout title="Calendar Requests">
        <div className="flex items-center justify-center py-20">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Calendar Requests">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sh-rust/10 rounded-xl flex items-center justify-center">
            <CalendarDaysIcon className="w-6 h-6 text-sh-rust" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Events Calendar Requests
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Announcements flagged for the Saint Helen Events Calendar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showCompleted
                ? 'bg-sh-navy text-white border-sh-navy'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            {showCompleted ? 'Showing All' : 'Hide Completed'}
          </button>
          <button
            onClick={fetchCalendarRequests}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDaysIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Calendar Requests
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No announcements have been flagged for the events calendar yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {announcements.length} request{announcements.length !== 1 ? 's' : ''} pending for calendar
          </p>
          <AnimatePresence>
            {announcements.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <AnnouncementCard
                  record={record}
                  calendarMap={calendarMap}
                  onToggleCalendar={handleToggleCalendar}
                  onOverrideStatus={handleOverrideStatus}
                  onToggleCompleted={handleToggleCompleted}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </AdminLayout>
  );
}
