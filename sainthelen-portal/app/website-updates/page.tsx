// app/website-updates/page.tsx
'use client';

import { useState } from 'react';

export default function WebsiteUpdatesFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [pageToUpdate, setPageToUpdate] = useState('');
  const [description, setDescription] = useState('');
  const [signUpUrl, setSignUpUrl] = useState('');
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Same presigned S3 upload approach
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingFiles(true);

    try {
      const filesArray = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of filesArray) {
        // 1) Get presigned URL from our S3 route
        const res = await fetch('/api/s3-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });
        if (!res.ok) {
          throw new Error('Failed to get S3 upload URL');
        }
        const { uploadUrl, objectUrl } = await res.json();

        // 2) Upload file directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!uploadRes.ok) {
          throw new Error(`Failed to upload file: ${file.name}`);
        }

        uploadedUrls.push(objectUrl);
      }

      setFileLinks((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(err.message || 'File upload failed');
    } finally {
      setUploadingFiles(false);
    }
  }

  // Form submit to /api/website-updates
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingForm(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/website-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          urgent,
          pageToUpdate,
          description,
          signUpUrl,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('Website update request submitted successfully!');
      // Reset
      setName('');
      setEmail('');
      setUrgent(false);
      setPageToUpdate('');
      setDescription('');
      setSignUpUrl('');
      setFileLinks([]);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setErrorMessage(err.message || 'Form submission failed');
    } finally {
      setSubmittingForm(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-semibold mb-4">Website Updates Form</h2>

      {successMessage && (
        <div className="p-2 mb-4 text-green-800 bg-green-200 rounded">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-2 mb-4 text-red-800 bg-red-200 rounded">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmitForm} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium">Name</label>
          <input
            type="text"
            className="border border-gray-300 rounded p-2 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        {/* Email */}
        <div>
          <label className="block font-medium">Email</label>
          <input
            type="email"
            className="border border-gray-300 rounded p-2 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {/* Urgent? */}
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
            />
            Urgent?
          </label>
        </div>
        {/* Page to Update */}
        <div>
          <label className="block font-medium">Page to Update</label>
          <input
            type="text"
            className="border border-gray-300 rounded p-2 w-full"
            value={pageToUpdate}
            onChange={(e) => setPageToUpdate(e.target.value)}
            required
          />
        </div>
        {/* Description */}
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            className="border border-gray-300 rounded p-2 w-full"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        {/* Sign-Up URL */}
        <div>
          <label className="block font-medium">Sign-Up URL (optional)</label>
          <input
            type="url"
            className="border border-gray-300 rounded p-2 w-full"
            value={signUpUrl}
            onChange={(e) => setSignUpUrl(e.target.value)}
          />
        </div>
        {/* File Upload */}
        <div>
          <label className="block font-medium">Attach Files (optional)</label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="block mt-1"
            disabled={uploadingFiles}
          />
          {uploadingFiles && (
            <p className="text-sm text-gray-500">Uploading files...</p>
          )}
          {fileLinks.length > 0 && (
            <ul className="list-disc ml-6 mt-2">
              {fileLinks.map((link) => (
                <li key={link}>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Submit */}
        <button
          type="submit"
          className="bg-sh-primary text-white px-4 py-2 rounded hover:bg-sh-secondary transition-colors"
          disabled={submittingForm || uploadingFiles}
        >
          {submittingForm ? 'Submitting...' : 'Submit Website Update'}
        </button>
      </form>
    </div>
  );
}