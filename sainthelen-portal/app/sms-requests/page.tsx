// app/sms-requests/page.tsx
'use client';

import { useState } from 'react';

export default function SMSRequestsFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle file uploads via the S3 route
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingFiles(true);

    try {
      const filesArray = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of filesArray) {
        // 1) Get presigned URL
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

        // 2) Upload file
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

  // Submit form to /api/sms-requests
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingForm(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/sms-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          smsMessage,
          requestedDate,
          additionalInfo,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('SMS request submitted successfully!');
      // Reset
      setName('');
      setEmail('');
      setMinistry('');
      setSmsMessage('');
      setRequestedDate('');
      setAdditionalInfo('');
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
      <h2 className="text-2xl font-semibold mb-4">SMS Requests Form</h2>

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
        {/* Ministry */}
        <div>
          <label className="block font-medium">Ministry</label>
          <input
            type="text"
            className="border border-gray-300 rounded p-2 w-full"
            value={ministry}
            onChange={(e) => setMinistry(e.target.value)}
          />
        </div>
        {/* SMS Message */}
        <div>
          <label className="block font-medium">
            SMS Message (max 160 chars)
          </label>
          <textarea
            className="border border-gray-300 rounded p-2 w-full"
            rows={3}
            maxLength={160}
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            required
          />
        </div>
        {/* Requested Date */}
        <div>
          <label className="block font-medium">Requested Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded p-2 w-full"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
          />
        </div>
        {/* Additional Info */}
        <div>
          <label className="block font-medium">Additional Info</label>
          <textarea
            className="border border-gray-300 rounded p-2 w-full"
            rows={3}
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
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
          {submittingForm ? 'Submitting...' : 'Submit SMS Request'}
        </button>
      </form>
    </div>
  );
}