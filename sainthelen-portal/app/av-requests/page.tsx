// app/av-requests/page.tsx
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from '../components/ui/FrontCard';
import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

// Type for multiple date/time entries
type DateTimeEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

export default function AVRequestsFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [eventName, setEventName] = useState('');
  const [dateTimeEntries, setDateTimeEntries] = useState<DateTimeEntry[]>([
    { id: '1', date: '', startTime: '', endTime: '' },
  ]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [needsLivestream, setNeedsLivestream] = useState(false);
  const [avNeeds, setAvNeeds] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Generate time options in 5-minute increments
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        const time = `${hourStr}:${minuteStr}`;
        options.push(
          <option key={time} value={time}>
            {hour > 12 ? `${hour - 12}:${minuteStr} PM` : (hour === 0 ? `12:${minuteStr} AM` : `${hour}:${minuteStr} ${hour === 12 ? 'PM' : 'AM'}`)}
          </option>
        );
      }
    }
    return options;
  };

  // Add a new date/time entry
  const addDateTimeEntry = () => {
    const newId = (parseInt(dateTimeEntries[dateTimeEntries.length - 1].id) + 1).toString();
    setDateTimeEntries([...dateTimeEntries, { id: newId, date: '', startTime: '', endTime: '' }]);
  };

  // Remove a date/time entry
  const removeDateTimeEntry = (id: string) => {
    if (dateTimeEntries.length > 1) {
      setDateTimeEntries(dateTimeEntries.filter(entry => entry.id !== id));
    }
  };

  // Update a specific date/time entry
  const updateDateTimeEntry = (id: string, field: 'date' | 'startTime' | 'endTime', value: string) => {
    setDateTimeEntries(
      dateTimeEntries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Handle file uploads
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingFiles(true);

    try {
      const filesArray = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of filesArray) {
        // Get presigned URL
        const res = await fetch('/api/s3-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });

        if (!res.ok) throw new Error('Failed to get S3 upload URL');
        const { uploadUrl, objectUrl } = await res.json();

        // Upload file to S3
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) throw new Error(`Failed to upload file: ${file.name}`);
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

  // Submit form
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingForm(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/av-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          eventName,
          dateTimeEntries,
          description,
          location,
          needsLivestream,
          avNeeds,
          expectedAttendees,
          additionalNotes,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('A/V request submitted successfully!');
      
      // Reset form
      setName('');
      setEmail('');
      setMinistry('');
      setEventName('');
      setDateTimeEntries([{ id: '1', date: '', startTime: '', endTime: '' }]);
      setDescription('');
      setLocation('');
      setNeedsLivestream(false);
      setAvNeeds('');
      setExpectedAttendees('');
      setAdditionalNotes('');
      setFileLinks([]);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setErrorMessage(err.message || 'Form submission failed');
    } finally {
      setSubmittingForm(false);
    }
  }

  return (
    <FrontLayout title="Request A/V or Livestream">
      <div className="max-w-3xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        {/* Informational Card */}
        <FrontCard className="mb-6 border-l-4 border-l-blue-500">
          <FrontCardContent className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">About A/V and Livestream Requests</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Please submit your A/V and livestream requests at least 2 weeks in advance to ensure we can properly 
                prepare for your event. Our team will review your request and contact you to confirm the details.
                Livestream requests require additional preparation time and may not be available for all events.
              </p>
            </div>
          </FrontCardContent>
        </FrontCard>

        {successMessage && (
          <div className="p-4 mb-6 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="p-4 mb-6 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-start gap-2">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <FrontCard>
          <FrontCardHeader>
            <FrontCardTitle>A/V and Livestream Request Details</FrontCardTitle>
          </FrontCardHeader>
          <FrontCardContent>
            <form onSubmit={handleSubmitForm} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Ministry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ministry/Organization
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={ministry}
                    onChange={(e) => setMinistry(e.target.value)}
                  />
                </div>
              </div>

              {/* Event Information */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Event Information</h3>
                
                {/* Event Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder="e.g., Main Church, Meaney Hall, Gym, etc."
                  />
                </div>

                {/* Expected Attendees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expected Number of Attendees
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={expectedAttendees}
                    onChange={(e) => setExpectedAttendees(e.target.value)}
                    placeholder="e.g., 50-100 people"
                  />
                </div>

                {/* Multiple Date/Time Entries */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Event Date(s) and Time(s) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add all dates and times for this event. For recurring events, please add each date separately.
                  </p>
                  
                  {dateTimeEntries.map((entry) => (
                    <div key={entry.id} className="flex flex-col md:flex-row gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                          value={entry.date}
                          onChange={(e) => updateDateTimeEntry(entry.id, 'date', e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Start Time <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                          value={entry.startTime}
                          onChange={(e) => updateDateTimeEntry(entry.id, 'startTime', e.target.value)}
                          required
                        >
                          <option value="">Select a time</option>
                          {generateTimeOptions()}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Time <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                          value={entry.endTime}
                          onChange={(e) => updateDateTimeEntry(entry.id, 'endTime', e.target.value)}
                          required
                        >
                          <option value="">Select a time</option>
                          {generateTimeOptions()}
                        </select>
                      </div>
                      {dateTimeEntries.length > 1 && (
                        <div className="flex items-end pb-2">
                          <button
                            type="button"
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            onClick={() => removeDateTimeEntry(entry.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-sh-primary bg-white dark:bg-gray-700 dark:text-blue-400 border border-sh-primary dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600"
                      onClick={addDateTimeEntry}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Add Another Date/Time
                    </button>
                  </div>
                </div>

                {/* Event Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Please provide a brief description of your event"
                  />
                </div>
              </div>

              {/* A/V & Livestream Requirements */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">A/V & Livestream Requirements</h3>

                {/* Livestream Checkbox */}
                <div className="flex items-center">
                  <input
                    id="needs-livestream"
                    type="checkbox"
                    className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                    checked={needsLivestream}
                    onChange={(e) => setNeedsLivestream(e.target.checked)}
                  />
                  <label htmlFor="needs-livestream" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    This event requires livestreaming
                  </label>
                </div>

                {/* A/V Needs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Audio/Visual Requirements <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    rows={4}
                    value={avNeeds}
                    onChange={(e) => setAvNeeds(e.target.value)}
                    required
                    placeholder="e.g., Microphones, projector, music playback, PowerPoint presentation, etc."
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Notes or Special Requirements
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any other details that would help us prepare for your event"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attach Files (optional)
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Upload any presentations, music files, or documents that will be used during the event.
                </p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-sh-primary dark:text-blue-400 hover:text-blue-600 focus-within:outline-none"
                      >
                        <span className="px-2 py-1">Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          onChange={handleFileUpload}
                          disabled={uploadingFiles}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PPT, PPTX, DOC, DOCX, PDF, MP3, MP4 up to 20MB
                    </p>
                  </div>
                </div>
                {uploadingFiles && (
                  <div className="mt-2 flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-sh-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Uploading files...</span>
                  </div>
                )}
                {fileLinks.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Uploaded Files:</h4>
                    <ul className="space-y-1">
                      {fileLinks.map((link, index) => (
                        <li key={index} className="text-sm">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                            {link.split('/').pop() || `File ${index + 1}`}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="w-full bg-sh-primary text-white px-4 py-2 rounded-md hover:bg-sh-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sh-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingForm || uploadingFiles}
                >
                  {submittingForm ? 'Submitting...' : 'Submit A/V Request'}
                </button>
              </div>
            </form>
          </FrontCardContent>
        </FrontCard>
      </div>
    </FrontLayout>
  );
}