// app/announcements/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from '../components/ui/FrontCard';
import { Button } from '../components/ui/Button';
import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import MinistryAutocomplete from '../components/ui/MinistryAutocomplete';

interface Ministry {
  id: string;
  name: string;
  aliases?: string[];
  requiresApproval: boolean;
  approvalCoordinator?: string;
  description?: string;
  active: boolean;
}

export default function AnnouncementsFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | undefined>();
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [promotionStart, setPromotionStart] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [announcementBody, setAnnouncementBody] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [isExternalEvent, setIsExternalEvent] = useState(false);
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle ministry selection
  const handleMinistryChange = (value: string, ministryObj?: Ministry) => {
    setMinistry(value);
    setSelectedMinistry(ministryObj);
  };

  const handleApprovalStatusChange = (requiresApproval: boolean, ministryObj?: Ministry) => {
    setRequiresApproval(requiresApproval);
  };

  // Handle checkboxes for "Platforms"
  const handlePlatformChange = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // 1) Upload files to Vercel Blob
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingFiles(true);

    try {
      const filesArray = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of filesArray) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/blob-upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || `Failed to upload file: ${file.name}`);
        }

        const { url, objectUrl } = await res.json();
        uploadedUrls.push(objectUrl || url);
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

    // Basic client-side validation
    if (!name.trim()) {
      setErrorMessage('Name is required');
      setSubmittingForm(false);
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email is required');
      setSubmittingForm(false);
      return;
    }
    if (!announcementBody.trim()) {
      setErrorMessage('Announcement body is required');
      setSubmittingForm(false);
      return;
    }

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
          isExternalEvent,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      const successMsg = requiresApproval 
        ? 'Announcement submitted successfully! It will require approval from the Coordinator of Adult Discipleship before being published.'
        : 'Announcement submitted successfully!';
      setSuccessMessage(successMsg);
      
      // Reset form (if desired)
      setName('');
      setEmail('');
      setMinistry('');
      setSelectedMinistry(undefined);
      setRequiresApproval(false);
      setEventDate('');
      setEventTime('');
      setPromotionStart('');
      setPlatforms([]);
      setAnnouncementBody('');
      setAddToCalendar(false);
      setIsExternalEvent(false);
      setFileLinks([]);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setErrorMessage(err.message || 'Form submission failed');
    } finally {
      setSubmittingForm(false);
    }
  }

  return (
    <FrontLayout title="Submit an Announcement">
      <div className="max-w-4xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        {/* Editorial Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FrontCard className="mb-8 border-l-4 border-l-amber-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft">
            <FrontCardContent className="flex items-start gap-4 p-6">
              <div className="flex-shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <InformationCircleIcon className="h-7 w-7 text-amber-500" />
                </motion.div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Editorial Notice</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Announcements and content may be adjusted by the Director of Communications, in collaboration with 
                  the Pastor, to maintain consistency with Saint Helen's brand style and tone. Major changes (a full revamp of the message) will be 
                  communicated prior to publication, while minor adjustments may be 
                  made without prior notification. Any final decisions regarding messaging will be made by the Director of Communications, in collaboration with the Pastor.
                </p>
              </div>
            </FrontCardContent>
          </FrontCard>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <FrontCard className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft-lg border border-white/20 dark:border-gray-700/50">
            <FrontCardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 pb-4">
              <FrontCardTitle className="text-2xl font-bold bg-gradient-to-r from-sh-primary to-sh-sage bg-clip-text text-transparent">
                Announcement Details
              </FrontCardTitle>
            </FrontCardHeader>
            <FrontCardContent className="p-8">
              <form onSubmit={handleSubmitForm} className="space-y-8">
              {/* Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sh-primary/50 focus:border-sh-primary bg-white/80 text-gray-900 dark:bg-gray-700/50 dark:text-white transition-all duration-200 backdrop-blur-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </motion.div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
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
                <MinistryAutocomplete
                  value={ministry}
                  onChange={handleMinistryChange}
                  onApprovalStatusChange={handleApprovalStatusChange}
                  placeholder="Start typing ministry name..."
                />
              </div>

              {/* External Event Checkbox */}
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600 text-sh-primary focus:ring-sh-primary dark:bg-gray-700"
                    checked={isExternalEvent}
                    onChange={(e) => setIsExternalEvent(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    This is an external event or ministry outside of Saint Helen
                  </span>
                </label>
              </div>

              {/* External Event Warning */}
              {isExternalEvent && (
                <div className="p-4 bg-amber-50/80 dark:bg-amber-900/30 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/50 rounded-2xl shadow-soft">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-800 dark:text-amber-300">
                        External Event Notice
                      </p>
                      <p className="text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                        Priority is given to events directly affiliated with Saint Helen and Saint Helen Ministries. 
                        We may not have available space for external events, however we will make every effort to 
                        include where appropriate.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Date / Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Event
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time of Event
                  </label>
                  <input
                    type="time"
                    step="300"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Promotion Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Promotion Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={promotionStart}
                  onChange={(e) => setPromotionStart(e.target.value)}
                />
              </div>

              {/* Platforms */}
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Where should this announcement appear?</span>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="platform-email"
                      type="checkbox"
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                      checked={platforms.includes('Email Blast')}
                      onChange={() => handlePlatformChange('Email Blast')}
                    />
                    <label htmlFor="platform-email" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Email Blast
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="platform-bulletin"
                      type="checkbox"
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                      checked={platforms.includes('Bulletin')}
                      onChange={() => handlePlatformChange('Bulletin')}
                    />
                    <label htmlFor="platform-bulletin" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Bulletin
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="platform-screens"
                      type="checkbox"
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                      checked={platforms.includes('Church Screens')}
                      onChange={() => handlePlatformChange('Church Screens')}
                    />
                    <label htmlFor="platform-screens" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Church Screens
                    </label>
                  </div>
                </div>
              </div>

              {/* Announcement Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Announcement Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  rows={6}
                  value={announcementBody}
                  onChange={(e) => setAnnouncementBody(e.target.value)}
                  required
                  placeholder="Provide the full text of your announcement. Include all relevant details such as what, when, where, and contact information."
                />
              </div>

              {/* Add to Events Calendar */}
              <div className="flex items-center">
                <input
                  id="add-to-calendar"
                  type="checkbox"
                  className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                  checked={addToCalendar}
                  onChange={(e) => setAddToCalendar(e.target.checked)}
                />
                <label htmlFor="add-to-calendar" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Add to Saint Helen Events Calendar?
                </label>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attach Files (optional)
                </label>
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
                      PNG, JPG, PDF up to 10MB
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

              {/* Success and Error Messages */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div 
                    className="p-5 mb-4 rounded-xl bg-green-50/90 dark:bg-green-900/40 backdrop-blur-sm border border-green-200/50 dark:border-green-800/50 text-green-800 dark:text-green-300 shadow-soft"
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </motion.div>
                      <div>
                        <p className="font-medium">{successMessage}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {errorMessage && (
                  <motion.div 
                    className="p-5 mb-4 rounded-xl bg-red-50/90 dark:bg-red-900/40 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 text-red-800 dark:text-red-300 shadow-soft"
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start gap-3">
                      <ExclamationCircleIcon className="h-6 w-6 flex-shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <p className="font-medium">{errorMessage}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div 
                className="pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-sh-primary to-sh-primary-light hover:from-sh-primary-light hover:to-sh-primary text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sh-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={submittingForm || uploadingFiles}
                  whileHover={{ scale: submittingForm || uploadingFiles ? 1 : 1.02 }}
                  whileTap={{ scale: submittingForm || uploadingFiles ? 1 : 0.98 }}
                >
                  <div className="flex items-center justify-center">
                    {submittingForm && (
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    {submittingForm ? 'Submitting...' : 'Submit Announcement'}
                  </div>
                </motion.button>
              </motion.div>
            </form>
          </FrontCardContent>
        </FrontCard>
        </motion.div>
      </div>
    </FrontLayout>
  );
}