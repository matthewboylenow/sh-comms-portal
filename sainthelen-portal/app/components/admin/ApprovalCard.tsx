'use client';

import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon, 
  CalendarIcon, 
  EnvelopeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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

interface ApprovalCardProps {
  approval: ApprovalData;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
}

export function ApprovalCard({ approval, onApprove, onReject }: ApprovalCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsProcessing(true);
    try {
      await onApprove(approval.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      await onReject(approval.id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const isPending = approval.approvalStatus === 'pending';
  const isApproved = approval.approvalStatus === 'approved';
  const isRejected = approval.approvalStatus === 'rejected';

  return (
    <>
      <Card className="mb-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {approval.ministry}
                </h3>
                {isPending && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    Pending Approval
                  </span>
                )}
                {isApproved && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckIcon className="w-3 h-3 mr-1" />
                    Approved
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    <XMarkIcon className="w-3 h-3 mr-1" />
                    Rejected
                  </span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
                <span className="flex items-center gap-1">
                  <EnvelopeIcon className="w-4 h-4" />
                  {approval.name} ({approval.email})
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  Submitted: {formatDateTime(approval.submittedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Event Details</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div><strong>Date:</strong> {formatDate(approval.eventDate)} {approval.eventTime || ''}</div>
                <div><strong>Promotion Start:</strong> {formatDate(approval.promotionStart)}</div>
                <div><strong>Add to Calendar:</strong> {approval.addToCalendar || 'No'}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Platforms</h4>
              <div className="flex flex-wrap gap-1">
                {approval.platforms?.map((platform, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {platform}
                  </span>
                )) || <span className="text-sm text-gray-500">None specified</span>}
              </div>
            </div>
          </div>

          {/* Announcement Body */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Announcement Content</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {approval.announcementBody}
              </p>
            </div>
          </div>

          {/* File Links */}
          {approval.fileLinks && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Attached Files</h4>
              <div className="space-y-1">
                {approval.fileLinks.split('\n').map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline block"
                  >
                    {link.split('/').pop() || `File ${index + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {isRejected && approval.rejectionReason && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-300">Rejection Reason</h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {approval.rejectionReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons (only for pending) */}
          {isPending && (
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Approve'}
              </Button>
              <Button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Request Changes
              </Button>
            </div>
          )}

          {/* Approval Info (if approved) */}
          {isApproved && approval.approvedBy && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              Approved by {approval.approvedBy} on {formatDateTime(approval.approvedAt)}
            </div>
          )}
        </div>
      </Card>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Request Changes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please provide feedback on what changes are needed for this announcement:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain what changes or improvements are needed..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white resize-none"
                rows={4}
                required
              />
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isProcessing ? 'Sending...' : 'Send Feedback'}
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  variant="outline"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}