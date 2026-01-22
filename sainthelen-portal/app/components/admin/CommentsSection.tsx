// app/components/admin/CommentsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';

interface Comment {
  id: string;
  fields: {
    'Record ID': string;
    'Table Name': string;
    'Message': string;
    'Created At': string;
    'Is Public': boolean;
    'Public Name'?: string;
    'Public Email'?: string;
    'Admin User'?: string;
  };
}

interface CommentsSectionProps {
  recordId: string;
  tableName: string;
  requesterEmail?: string;
  requesterName?: string;
  onCommentAdded?: () => void;
}

export default function CommentsSection({
  recordId,
  tableName,
  requesterEmail,
  requesterName,
  onCommentAdded
}: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, recordId, tableName]);

  const fetchComments = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/comments?recordId=${recordId}&tableName=${tableName}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        setError('Failed to load comments');
      }
    } catch (err) {
      setError('Error loading comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    setIsSending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          tableName,
          message: newComment.trim(),
          isPublic: false
        }),
      });

      if (response.ok) {
        setNewComment('');
        setSuccess('Comment sent!');
        fetchComments();
        onCommentAdded?.();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send comment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const generatePublicResponseLink = () => {
    if (!requesterEmail || !requesterName) return '';
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      table: tableName,
      name: requesterName,
      email: requesterEmail
    });
    return `${baseUrl}/comment/${recordId}?${params.toString()}`;
  };

  const copyPublicLink = async () => {
    const link = generatePublicResponseLink();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setSuccess('Link copied!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to copy link');
      }
    }
  };

  const formatCommentDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, h:mm a');
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-sh-navy dark:hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 bg-sh-navy-50 dark:bg-sh-navy-900/30 rounded-lg flex items-center justify-center group-hover:bg-sh-navy-100 dark:group-hover:bg-sh-navy-900/50 transition-colors">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-sh-navy dark:text-sh-navy-300" />
          </div>
          <span>Comments</span>
          {comments.length > 0 && (
            <span className="px-2 py-0.5 bg-sh-navy text-white text-xs font-bold rounded-full">
              {comments.length}
            </span>
          )}
          {showComments ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>

        {requesterEmail && requesterName && (
          <button
            onClick={copyPublicLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sh-rust hover:text-sh-rust-600 bg-sh-rust-50 hover:bg-sh-rust-100 dark:bg-sh-rust-900/20 dark:hover:bg-sh-rust-900/30 rounded-lg transition-all"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Copy Public Link
          </button>
        )}
      </div>

      {/* Messages */}
      <AnimatePresence>
        {(success || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 text-sm mt-3 px-3 py-2 rounded-lg ${
              success
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {success ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4" />
            )}
            {success || error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-4"
          >
            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-sh-navy border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Comments List */}
            {!isLoading && comments.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-xl ${
                      comment.fields['Is Public']
                        ? 'bg-sh-rust-50 dark:bg-sh-rust-900/20 border border-sh-rust-200 dark:border-sh-rust-800'
                        : 'bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        comment.fields['Is Public']
                          ? 'bg-sh-rust text-white'
                          : 'bg-sh-navy text-white'
                      }`}>
                        <UserCircleIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.fields['Is Public']
                              ? comment.fields['Public Name']
                              : comment.fields['Admin User'] || 'Admin'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {formatCommentDate(comment.fields['Created At'])}
                          </span>
                        </div>
                        {comment.fields['Is Public'] && (
                          <span className="inline-block text-xs px-2 py-0.5 bg-sh-rust text-white rounded-full mb-2">
                            Public Response
                          </span>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.fields.Message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Comments */}
            {!isLoading && comments.length === 0 && (
              <div className="text-center py-6">
                <ChatBubbleLeftRightIcon className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
              </div>
            )}

            {/* Add Comment Form */}
            {session && (
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-sh-navy rounded-full flex items-center justify-center text-white">
                    <UserCircleIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-sh-navy focus:border-transparent resize-none transition-all"
                    />

                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSendComment}
                        disabled={!newComment.trim() || isSending}
                        className={`
                          inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all
                          ${!newComment.trim() || isSending
                            ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-sh-navy hover:bg-sh-navy-700 text-white hover:-translate-y-0.5 hover:shadow-button'
                          }
                        `}
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <PaperAirplaneIcon className="w-4 h-4" />
                        )}
                        {isSending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
