'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { ApprovalCard } from '../../components/admin/ApprovalCard';
import { Button } from '../../components/ui/Button';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ApprovalData {
  id: string;
  name: string;
  email: string;
  ministry: string;
  eventDate?: string;
  eventTime?: string;
  promotionStart?: string;
  platforms?: string[];
  announcementBody: string;
  addToCalendar?: string;
  fileLinks?: string;
  approvalStatus: string;
  requiresApproval?: string;
  ministryId?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/approvals?status=${filter}`);
      if (!response.ok) {
        throw new Error('Failed to fetch approvals');
      }
      const data = await response.json();
      setApprovals(data.approvals || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  const handleApprove = async (recordId: string) => {
    try {
      setProcessing(recordId);
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          action: 'approve',
          approverEmail: 'admin@sainthelen.org' // This should come from auth context
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve');
      }

      // Refresh the list
      await fetchApprovals();
    } catch (err: any) {
      setError(err.message || 'Failed to approve announcement');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (recordId: string, rejectionReason: string) => {
    try {
      setProcessing(recordId);
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          action: 'reject',
          approverEmail: 'admin@sainthelen.org', // This should come from auth context
          rejectionReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject');
      }

      // Refresh the list
      await fetchApprovals();
    } catch (err: any) {
      setError(err.message || 'Failed to reject announcement');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AdminLayout title="Adult Discipleship Approvals">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-start gap-2">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 dark:text-red-300 font-medium">Error</p>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {(['pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    filter === status
                      ? 'border-sh-primary text-sh-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {status}
                  {status === 'pending' && approvals.length > 0 && (
                    <span className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 py-0.5 px-2 rounded-full text-xs">
                      {approvals.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sh-primary"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading approvals...</span>
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <ExclamationCircleIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No {filter} announcements
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === 'pending' 
                ? 'There are no announcements waiting for approval.'
                : `No announcements have been ${filter}.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={filter === 'pending' ? handleApprove : undefined}
                onReject={filter === 'pending' ? handleReject : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}