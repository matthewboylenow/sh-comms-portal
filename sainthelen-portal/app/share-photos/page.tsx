// app/share-photos/page.tsx
// Share parish-life photos with Communications - deliberately minimal.
// No captions, no strategy, no writing assignment. Just photos with context.
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent } from '../components/ui/FrontCard';
import MinistryAutocomplete from '../components/ui/MinistryAutocomplete';
import { uploadFile } from '../lib/upload';

export default function SharePhotosPage() {
  const [description, setDescription] = useState('');
  const [ministry, setMinistry] = useState('');
  const [photoDate, setPhotoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitterName, setSubmitterName] = useState('');
  const [privacyConcern, setPrivacyConcern] = useState(false);
  const [privacyNotes, setPrivacyNotes] = useState('');
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setUploading(true);
    setErrorMessage('');

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgressText(`Uploading ${i + 1} of ${files.length}...`);
        const result = await uploadFile(files[i]);
        urls.push(result.url);
      }
      setFileLinks((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgressText('');
      e.target.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/photo-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          ministry,
          photoDate,
          submitterName,
          privacyConcern,
          privacyNotes: privacyConcern ? privacyNotes : '',
          fileLinks,
        }),
      });
      const result = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(result.error || 'Something went wrong');

      setSuccessMessage('Thank you! Your photos are on their way to the communications team.');
      setDescription('');
      setMinistry('');
      setPhotoDate(new Date().toISOString().split('T')[0]);
      setSubmitterName('');
      setPrivacyConcern(false);
      setPrivacyNotes('');
      setFileLinks([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FrontLayout title="Share Photos with Communications">
      <div className="max-w-xl mx-auto my-8 px-4 sm:px-6">
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Took photos at a parish event or ministry gathering? Send them our way — they help us
          show real parish life on the website, in email, and on social media. No write-up needed.
        </p>

        <FrontCard>
          <FrontCardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* What's happening */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  What&apos;s happening in the photos? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="e.g., Food Pantry volunteers packing bags"
                />
              </div>

              {/* Ministry */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ministry <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <MinistryAutocomplete
                  value={ministry}
                  onChange={(value) => setMinistry(value)}
                  placeholder="Start typing ministry name..."
                />
              </div>

              {/* When */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  When was this?
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={photoDate}
                  onChange={(e) => setPhotoDate(e.target.value)}
                />
              </div>

              {/* Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Photos / videos <span className="text-red-500">*</span>
                </label>
                {uploading ? (
                  <div className="py-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-sh-navy border-t-transparent mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{progressText}</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFiles}
                      className="sr-only"
                      id="photo-input"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo-input')?.click()}
                      className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sh-primary dark:text-blue-400 font-semibold hover:border-sh-primary hover:bg-sh-navy-50/40 dark:hover:bg-slate-700 transition-colors"
                    >
                      {fileLinks.length > 0 ? 'Add more photos' : 'Choose photos from your device'}
                    </button>
                  </>
                )}
                {fileLinks.length > 0 && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {fileLinks.length} {fileLinks.length === 1 ? 'file' : 'files'} ready to send
                    </span>
                    <button
                      type="button"
                      onClick={() => setFileLinks([])}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Privacy */}
              <div>
                <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Is anyone pictured who should <em>not</em> be shown publicly?
                </span>
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300"
                      checked={!privacyConcern}
                      onChange={() => setPrivacyConcern(false)}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">No</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300"
                      checked={privacyConcern}
                      onChange={() => setPrivacyConcern(true)}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Yes</span>
                  </label>
                </div>
                {privacyConcern && (
                  <input
                    type="text"
                    className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                    value={privacyNotes}
                    onChange={(e) => setPrivacyNotes(e.target.value)}
                    placeholder="Anything we should know? (e.g., 'the family on the left asked not to be posted')"
                  />
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Your name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="So we can say thanks"
                />
              </div>

              {/* Messages */}
              {successMessage && (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-sh-navy hover:bg-sh-navy-700 text-white text-lg px-6 py-4 rounded-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || uploading || fileLinks.length === 0}
              >
                {submitting ? 'Sending...' : 'Send to Communications'}
              </button>
            </form>
          </FrontCardContent>
        </FrontCard>
      </div>
    </FrontLayout>
  );
}
