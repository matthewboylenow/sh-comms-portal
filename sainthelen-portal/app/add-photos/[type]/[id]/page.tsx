// app/add-photos/[type]/[id]/page.tsx
// Dead-simple mobile page for adding photos/video to an existing request.
// Reached via the QR code / link on a form's confirmation screen.
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import UploadProgress from '../../../components/ui/UploadProgress';
import { uploadFilesWithStatus, type UploadStatus } from '../../../lib/upload';

type Status = 'loading' | 'ready' | 'uploading' | 'done' | 'error';

export default function AddPhotosPage() {
  const params = useParams<{ type: string; id: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [title, setTitle] = useState('');
  const [typeLabel, setTypeLabel] = useState('request');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/add-photos?type=${params.type}&id=${params.id}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || 'This link is not valid.');
          setStatus('error');
          return;
        }
        setTitle(data.title);
        setTypeLabel(data.typeLabel || 'request');
        setStatus('ready');
      } catch {
        setErrorMessage('Could not load this request. Please check your connection and try again.');
        setStatus('error');
      }
    }
    load();
  }, [params.type, params.id]);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setStatus('uploading');
    setErrorMessage('');

    try {
      const results = await uploadFilesWithStatus(files, setUploadStatus);
      const urls = results.map((r) => r.url);

      setUploadStatus(null);
      setAttaching(true);
      const res = await fetch('/api/add-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: params.type, id: params.id, fileLinks: urls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not attach the files.');

      setUploadedCount((prev) => prev + data.added);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed. Please try again.');
      setStatus('ready');
    } finally {
      setUploadStatus(null);
      setAttaching(false);
      // Allow picking the same files again if needed
      e.target.value = '';
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(35,30%,97%)] dark:bg-slate-900 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-sh-navy rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-serif font-bold text-xl">SH</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-sh-navy dark:text-white">
            Add Photos
          </h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          {status === 'loading' && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</p>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 font-medium">{errorMessage}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                If you need help, email{' '}
                <a href="mailto:communications@sainthelen.org" className="text-sh-rust underline">
                  communications@sainthelen.org
                </a>
              </p>
            </div>
          )}

          {(status === 'ready' || status === 'uploading' || status === 'done') && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{typeLabel}</p>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{title}</h2>

              {status === 'done' && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-center">
                  <p className="text-green-800 dark:text-green-300 font-semibold">
                    {uploadedCount} {uploadedCount === 1 ? 'file' : 'files'} added — you&apos;re all set!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    You can add more below, or just close this page.
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                </div>
              )}

              {status === 'uploading' ? (
                attaching ? (
                  <div className="py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sh-navy border-t-transparent mb-3"></div>
                    <p className="text-gray-600 dark:text-gray-300">Almost done — attaching to your request...</p>
                  </div>
                ) : (
                  <div className="py-4">
                    <UploadProgress status={uploadStatus} />
                  </div>
                )
              ) : (
                <label className="block">
                  <span className="sr-only">Choose photos or videos</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFiles}
                    className="sr-only"
                    id="phone-file-input"
                  />
                  <span
                    onClick={() => document.getElementById('phone-file-input')?.click()}
                    className="w-full inline-flex items-center justify-center gap-2 bg-sh-navy hover:bg-sh-navy-700 text-white text-lg font-semibold px-6 py-4 rounded-2xl cursor-pointer transition-colors"
                  >
                    {status === 'done' ? 'Add More Photos' : 'Choose Photos or Videos'}
                  </span>
                </label>
              )}

              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                Photos and videos go straight to the communications team, attached to this request.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
