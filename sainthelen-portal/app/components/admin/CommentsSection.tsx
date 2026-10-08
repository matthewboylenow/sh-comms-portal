// app/components/admin/CommentsSection.tsx
'use client';

import { Avatar } from '../ui/Avatar';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PaperAirplaneIcon, LinkIcon } from '@heroicons/react/24/outline';
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

  useEffect(() => {
    setShowComments(true);
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold text-ink-3">
          Comments{comments.length ? ` · ${comments.length}` : ''}
        </span>
        <span className="flex-1" />
        {requesterEmail && requesterName && (
          <button
            type="button"
            onClick={copyPublicLink}
            className="inline-flex h-7 items-center gap-1.5 rounded border border-line-2 bg-surface px-2.5 text-xs font-medium text-ink hover:bg-surface-2"
            title="A link the submitter can use to reply without signing in"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Copy reply link
          </button>
        )}
      </div>

      {(success || error) && (
        <p className={`mb-3 text-xs ${success ? 'text-status-approved-t' : 'text-status-approval-t'}`}>{success || error}</p>
      )}

      {isLoading && <p className="py-4 text-sm text-ink-3">Loading…</p>}

      {!isLoading && comments.length === 0 && <p className="py-2 text-sm text-ink-3">No comments yet.</p>}

      {!isLoading && comments.length > 0 && (
        <ol className="flex flex-col gap-3">
          {comments.map((comment) => {
            const pub = !!comment.fields['Is Public'];
            const who = pub ? comment.fields['Public Name'] || 'Submitter' : comment.fields['Admin User'] || 'Office';
            return (
              <li key={comment.id} className="flex gap-2.5">
                <Avatar name={who} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 text-xs">
                    <span className="font-semibold text-ink">{who}</span>
                    {pub && <span className="text-ink-3">· replied by email link</span>}
                    <span className="tnum ml-auto whitespace-nowrap text-ink-3">{formatCommentDate(comment.fields['Created At'])}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-ink">{comment.fields.Message}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {session && (
        <div className="mt-4 flex gap-2.5 border-t border-line pt-4">
          <Avatar name={session.user?.name || 'You'} />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a note for the office…"
              rows={2}
              className="block w-full resize-y rounded border border-line-2 bg-surface px-2.5 py-2 text-sm text-ink placeholder:text-ink-3"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSendComment}
                disabled={!newComment.trim() || isSending}
                className="inline-flex h-8 items-center gap-1.5 rounded bg-navy px-3 text-sm font-medium text-on-navy hover:bg-navy-hover disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
