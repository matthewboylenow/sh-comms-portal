// app/admin/photos/page.tsx
// Admin view of parish-life photos shared through /share-photos
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import {
  ArrowPathIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type PhotoSubmission = {
  id: string;
  submitterName: string | null;
  ministry: string | null;
  description: string;
  photoDate: string | null;
  fileLinks: string[] | null;
  privacyConcern: boolean;
  privacyNotes: string | null;
  createdAt: string;
};

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|m4v|3gp)(\?|$)/i;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AdminPhotosPage() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubmissions();
    }
  }, [status]);

  async function fetchSubmissions() {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/photo-submissions');
      if (!res.ok) throw new Error(`Error fetching photos: ${res.status}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sh-primary border-t-transparent mb-4"></div>
          <p className="text-gray-800 dark:text-gray-200">Loading session...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You must be signed in to view shared photos.
          </p>
          <Button onClick={() => signIn('azure-ad')} className="w-full" size="lg">
            Sign In with Microsoft 365
          </Button>
        </div>
      </div>
    );
  }

  const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = terms.length
    ? submissions.filter((s) => {
        const haystack = [s.description, s.ministry, s.submitterName, s.photoDate]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
    : submissions;

  return (
    <AdminLayout title="Shared Photos">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 focus:ring-sh-primary focus:border-sh-primary block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            placeholder="Search by description, ministry, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={fetchSubmissions}
          variant="outline"
          disabled={loading}
          icon={<ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-sh-primary border-t-transparent"></div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
            <PhotoIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {searchQuery ? 'No photos match your search' : 'No photos shared yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'Try different search terms'
              : 'Photos shared through the portal will appear here with their date, ministry, and context.'}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {filtered.map((submission) => (
          <Card key={submission.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {submission.description}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {[
                      submission.ministry,
                      formatDate(submission.photoDate),
                      submission.submitterName && `shared by ${submission.submitterName}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {submission.privacyConcern && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 flex-shrink-0">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                    Privacy — check before using
                  </span>
                )}
              </div>

              {submission.privacyConcern && submission.privacyNotes && (
                <p className="mb-3 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-red-800 dark:text-red-300">
                  {submission.privacyNotes}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {(submission.fileLinks || []).map((link, idx) =>
                  VIDEO_EXTENSIONS.test(link) ? (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-24 h-24 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                    >
                      <PhotoIcon className="w-6 h-6 mb-1" />
                      Video {idx + 1}
                    </a>
                  ) : (
                    <a key={idx} href={link} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={link}
                        alt={`${submission.description} - photo ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                        loading="lazy"
                      />
                    </a>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
