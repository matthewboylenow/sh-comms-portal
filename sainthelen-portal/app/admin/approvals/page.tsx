'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
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
  const { data: session, status } = useSession();
  const [approvals, setApprovals] = useState<ApprovalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');

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
    if (status === 'authenticated') {
      fetchApprovals();
    }
  }, [filter, status]);

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

  const handleSelectItem = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(approvals.map(approval => approval.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) return;

    try {
      setBulkProcessing(true);
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          recordIds: Array.from(selectedItems),
          action: 'approve'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve items');
      }

      setSelectedItems(new Set());
      await fetchApprovals();
    } catch (err: any) {
      setError(err.message || 'Failed to approve items');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedItems.size === 0 || !bulkRejectionReason.trim()) return;

    try {
      setBulkProcessing(true);
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          recordIds: Array.from(selectedItems),
          action: 'reject',
          rejectionReason: bulkRejectionReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject items');
      }

      setSelectedItems(new Set());
      setBulkRejectionReason('');
      setShowBulkRejectModal(false);
      await fetchApprovals();
    } catch (err: any) {
      setError(err.message || 'Failed to reject items');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Handle authentication states
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sh-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You must be signed in to view the admin dashboard.
          </p>
          <Button
            onClick={() => signIn('azure-ad')}
            className="w-full"
            size="lg"
          >
            Sign In with Azure AD
          </Button>
        </div>
      </div>
    );
  }

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

        {/* Bulk Actions - only show for pending items with selections */}
        {filter === 'pending' && selectedItems.size > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-3">
                <Button
                  onClick={handleBulkApprove}
                  disabled={bulkProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                  size="sm"
                >
                  {bulkProcessing ? 'Processing...' : `Approve All (${selectedItems.size})`}
                </Button>
                <Button
                  onClick={() => setShowBulkRejectModal(true)}
                  disabled={bulkProcessing}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/30 text-sm"
                  size="sm"
                >
                  Request Changes for All
                </Button>
                <Button
                  onClick={() => setSelectedItems(new Set())}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

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
          <>
            {/* Select all header for pending items */}
            {filter === 'pending' && approvals.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedItems.size === approvals.length && approvals.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="selectAll" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select All ({approvals.length} items)
                  </label>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {approvals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  onApprove={filter === 'pending' ? handleApprove : undefined}
                  onReject={filter === 'pending' ? handleReject : undefined}
                  showCheckbox={filter === 'pending'}
                  isSelected={selectedItems.has(approval.id)}
                  onSelectChange={(checked) => handleSelectItem(approval.id, checked)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Request Changes for {selectedItems.size} Items
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This feedback will be sent to all selected submitters:
              </p>
              <textarea
                value={bulkRejectionReason}
                onChange={(e) => setBulkRejectionReason(e.target.value)}
                placeholder="Explain what changes or improvements are needed..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white resize-none"
                rows={4}
                required
              />
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleBulkReject}
                  disabled={bulkProcessing || !bulkRejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {bulkProcessing ? 'Sending...' : `Send Feedback to ${selectedItems.size} Items`}
                </Button>
                <Button
                  onClick={() => {
                    setShowBulkRejectModal(false);
                    setBulkRejectionReason('');
                  }}
                  variant="outline"
                  disabled={bulkProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}