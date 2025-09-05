// app/components/admin/CommentsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  UserCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
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

  // Fetch comments when expanded
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId,
          tableName,
          message: newComment.trim(),
          isPublic: false
        }),
      });

      if (response.ok) {
        setNewComment('');
        setSuccess('Comment sent successfully!');
        fetchComments(); // Reload comments
        onCommentAdded?.();
        
        // Clear success message after 3 seconds
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
        setSuccess('Public response link copied to clipboard!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to copy link');
      }
    }
  };

  const formatCommentDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      {/* Comments Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
          Comments ({comments.length})
          {showComments ? (
            <ChevronUpIcon className="h-4 w-4 ml-1" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 ml-1" />
          )}
        </button>

        {/* Public Response Link Button */}
        {requesterEmail && requesterName && (
          <Button
            size="sm"
            variant="outline"
            onClick={copyPublicLink}
            className="text-xs"
            icon={<LinkIcon className="h-3 w-3" />}
          >
            Copy Public Link
          </Button>
        )}
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center text-green-600 dark:text-green-400 text-sm mb-3"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            {success}
          </motion.div>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center text-red-600 dark:text-red-400 text-sm mb-3"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}

            {/* Comments List */}
            {!isLoading && comments.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border ${
                      comment.fields['Is Public']
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        comment.fields['Is Public']
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        <UserCircleIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.fields['Is Public'] 
                              ? comment.fields['Public Name'] 
                              : comment.fields['Admin User'] || 'Admin'
                            }
                            {comment.fields['Is Public'] && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                                Public Response
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatCommentDate(comment.fields['Created At'])}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.fields.Message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Comments State */}
            {!isLoading && comments.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No comments yet</p>
              </div>
            )}

            {/* Add Comment Form */}
            {session && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <UserCircleIcon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-grow">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm resize-none"
                    />
                    
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleSendComment}
                        disabled={!newComment.trim() || isSending}
                        icon={isSending ? (
                          <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
                        ) : (
                          <PaperAirplaneIcon className="h-3 w-3" />
                        )}
                        className="text-xs"
                      >
                        {isSending ? 'Sending...' : 'Send'}
                      </Button>
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

function ChevronUpIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}