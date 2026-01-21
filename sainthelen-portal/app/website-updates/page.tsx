// app/website-updates/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from '../components/ui/FrontCard';
import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

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

  // Upload files to Vercel Blob
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
    <FrontLayout title="Request a Website Update">
      <div className="max-w-3xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        {/* Editorial Notice */}
        <FrontCard className="mb-6 border-l-4 border-l-amber-500">
          <FrontCardContent className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Editorial Notice</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Website content may be adjusted by the Director of Communications, in collaboration with 
                the Pastor, to maintain consistency with Saint Helen's brand style and tone. Major changes will be 
                communicated prior to publishing, while minor adjustments (grammar, formatting, etc.) may be 
                made without prior notification.
              </p>
            </div>
          </FrontCardContent>
        </FrontCard>


        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <FrontCard className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft-lg border border-white/20 dark:border-gray-700/50">
            <FrontCardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 pb-4">
              <FrontCardTitle className="text-2xl font-bold bg-gradient-to-r from-sh-primary to-sh-sage bg-clip-text text-transparent">
                Website Update Details
              </FrontCardTitle>
            </FrontCardHeader>
            <FrontCardContent className="p-8">
              <form onSubmit={handleSubmitForm} className="space-y-8">
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

              {/* Urgent Checkbox */}
              <div className="flex items-center">
                <input
                  id="urgent"
                  type="checkbox"
                  className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                />
                <label htmlFor="urgent" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  This update is urgent (within 24 hours)
                </label>
              </div>

              {/* Page to Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Page to Update <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                  value={pageToUpdate}
                  onChange={(e) => setPageToUpdate(e.target.value)}
                  required
                  placeholder="Example: Homepage, Ministry Page, Calendar, etc."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Describe the changes you need in detail. Include what content should be added, removed, or modified."
                />
              </div>

              {/* Sign-Up URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sign-Up URL (if applicable)
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                  value={signUpUrl}
                  onChange={(e) => setSignUpUrl(e.target.value)}
                  placeholder="https://example.com"
                />
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
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-sh-primary text-white px-4 py-2 rounded-md hover:bg-sh-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sh-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingForm || uploadingFiles}
                >
                  {submittingForm ? 'Submitting...' : 'Submit Website Update Request'}
                </button>
              </div>
              </form>
            </FrontCardContent>
          </FrontCard>
        </motion.div>
      </div>
    </FrontLayout>
  );
}