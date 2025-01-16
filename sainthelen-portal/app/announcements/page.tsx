// app/announcements/page.tsx
'use client';

import { useState } from 'react';

export default function AnnouncementsFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [promotionStart, setPromotionStart] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [announcementBody, setAnnouncementBody] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle checkboxes for "Platforms"
  const handlePlatformChange = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // 1) Upload files to S3
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingFiles(true);

    try {
      const filesArray = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of filesArray) {
        // 1) Get presigned URL from our API
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

        // 2) Upload the file directly to S3
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

      // Store them in state
      setFileLinks((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(err.message || 'File upload failed');
    } finally {
      setUploadingFiles(false);
    }
  }

  // 2) Submit the form
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingForm(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          eventDate,
          eventTime,
          promotionStart,
          platforms,
          announcementBody,
          addToCalendar,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('Announcement submitted successfully!');
      // Reset form (if desired)
      setName('');
      setEmail('');
      setMinistry('');
      setEventDate('');
      setEventTime('');
      setPromotionStart('');
      setPlatforms([]);
      setAnnouncementBody('');
      setAddToCalendar(false);
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
      <h2 className="text-2xl font-semibold mb-4">Announcements Form</h2>

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

        {/* Event Date / Time */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block font-medium">Date of Event</label>
            <input
              type="date"
              className="border border-gray-300 rounded p-2 w-full"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block font-medium">Time of Event</label>
            <input
              type="time"
              className="border border-gray-300 rounded p-2 w-full"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
        </div>

        {/* Promotion Start Date */}
        <div>
          <label className="block font-medium">Promotion Start Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded p-2 w-full"
            value={promotionStart}
            onChange={(e) => setPromotionStart(e.target.value)}
          />
        </div>

        {/* Platforms: checkboxes */}
        <div>
          <span className="block font-medium">Platforms:</span>
          <label className="inline-flex items-center mr-3">
            <input
              type="checkbox"
              className="mr-1"
              checked={platforms.includes('Email Blast')}
              onChange={() => handlePlatformChange('Email Blast')}
            />
            Email Blast
          </label>
          <label className="inline-flex items-center mr-3">
            <input
              type="checkbox"
              className="mr-1"
              checked={platforms.includes('Bulletin')}
              onChange={() => handlePlatformChange('Bulletin')}
            />
            Bulletin
          </label>
          <label className="inline-flex items-center mr-3">
            <input
              type="checkbox"
              className="mr-1"
              checked={platforms.includes('Church Screens')}
              onChange={() => handlePlatformChange('Church Screens')}
            />
            Church Screens
          </label>
        </div>

        {/* Announcement Body */}
        <div>
          <label className="block font-medium">Announcement Body</label>
          <textarea
            className="border border-gray-300 rounded p-2 w-full"
            rows={4}
            value={announcementBody}
            onChange={(e) => setAnnouncementBody(e.target.value)}
            required
          />
        </div>

        {/* Add to Events Calendar */}
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={addToCalendar}
              onChange={(e) => setAddToCalendar(e.target.checked)}
            />
            Add to Events Calendar?
          </label>
        </div>

        {/* File Upload */}
        <div>
          <label className="block font-medium">
            Attach Files (optional)
          </label>
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
          {submittingForm ? 'Submitting...' : 'Submit Announcement'}
        </button>
      </form>
    </div>
  );
}