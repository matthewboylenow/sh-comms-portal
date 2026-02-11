// app/flyer-review/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from '../components/ui/FrontCard';
import { ExclamationCircleIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { uploadFile } from '@/app/lib/upload';

export default function FlyerReviewFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [audience, setAudience] = useState('');
  const [purpose, setPurpose] = useState('');
  const [feedbackNeeded, setFeedbackNeeded] = useState('');
  const [urgency, setUrgency] = useState('standard');
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle file uploads using client-side Vercel Blob upload (bypasses 4.5MB serverless limit)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingFiles(true);

    try {
      const filesArray = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of filesArray) {
        const result = await uploadFile(file);
        uploadedUrls.push(result.url);
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
      const res = await fetch('/api/flyer-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          eventName,
          eventDate,
          audience,
          purpose,
          feedbackNeeded,
          urgency,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('Flyer review request submitted successfully!');
      
      // Reset form
      setName('');
      setEmail('');
      setMinistry('');
      setEventName('');
      setEventDate('');
      setAudience('');
      setPurpose('');
      setFeedbackNeeded('');
      setUrgency('standard');
      setFileLinks([]);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setErrorMessage(err.message || 'Form submission failed');
    } finally {
      setSubmittingForm(false);
    }
  }

  return (
    <FrontLayout title="Request Flyer Design Review">
      <div className="max-w-3xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        {/* Benefits of Flyer Review Card */}
        <FrontCard className="mb-6 border-l-4 border-l-green-500">
          <FrontCardContent className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Benefits of Design Feedback</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                Our team can provide valuable feedback to help make your flyer more effective and to ensure that your flyer is successful:
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                <li>Ensure alignment with Saint Helen brand guidelines</li>
                <li>Improve readability and visual appeal</li>
                <li>Clarify key information and calls to action</li>
                <li>Verify that all necessary details are included</li>
                <li>Suggest design improvements for better engagement</li>
              </ul>
            </div>
          </FrontCardContent>
        </FrontCard>

        {/* Tips for Effective Flyers Card */}
        <FrontCard className="mb-6 border-l-4 border-l-blue-500">
          <FrontCardContent className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tips for Effective Flyers</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                <li>Include a clear, bold headline that states the purpose</li>
                <li>Feature essential details: who, what, when, where</li>
                <li>Use high-quality, appropriate images (that you have rights to use)</li>
                <li>Keep text concise and easy to read</li>
                <li>Include contact information or a QR code for more details</li>
                <li>Use consistent fonts and colors that align with Saint Helen branding</li>
              </ul>
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
                Flyer Design Review Request
              </FrontCardTitle>
            </FrontCardHeader>
            <FrontCardContent className="p-8">
              <form onSubmit={handleSubmitForm} className="space-y-8">
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

              {/* Flyer Information */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Flyer Information</h3>
                
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

                {/* Event Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Audience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    required
                    placeholder="e.g., Families with children, Young adults, Seniors, All parishioners"
                  />
                </div>

                {/* Purpose of Flyer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purpose of Flyer <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                  >
                    <option value="">Select purpose</option>
                    <option value="Event Promotion">Event Promotion</option>
                    <option value="Ministry Recruitment">Ministry Recruitment</option>
                    <option value="Information/Education">Information/Education</option>
                    <option value="Fundraising">Fundraising</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Type of Feedback Needed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type of Feedback Needed <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    rows={3}
                    value={feedbackNeeded}
                    onChange={(e) => setFeedbackNeeded(e.target.value)}
                    required
                    placeholder="What specific feedback are you looking for? (e.g., design improvements, clarity of message, branding alignment, etc.)"
                  />
                </div>

                {/* Review Urgency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Review Urgency
                  </label>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="urgency-standard"
                        name="urgency"
                        type="radio"
                        value="standard"
                        checked={urgency === 'standard'}
                        onChange={() => setUrgency('standard')}
                        className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300"
                      />
                      <label htmlFor="urgency-standard" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Standard (3-5 business days)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="urgency-urgent"
                        name="urgency"
                        type="radio"
                        value="urgent"
                        checked={urgency === 'urgent'}
                        onChange={() => setUrgency('urgent')}
                        className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300"
                      />
                      <label htmlFor="urgency-urgent" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Urgent (1-2 business days)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload Flyer <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Upload your flyer design in PDF, PNG, or JPG format. For editable files, you can also upload source files (DOCX, PPTX, etc.).
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
                          accept="image/png,image/jpeg,.png,.jpg,.jpeg,.pdf,application/pdf,.docx,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={handleFileUpload}
                          disabled={uploadingFiles}
                          required={fileLinks.length === 0}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, PNG, JPG, JPEG, DOCX, PPTX up to 10MB
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
              {successMessage && (
                <div className="p-4 mb-4 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
                  {successMessage}
                </div>
              )}
              
              {errorMessage && (
                <div className="p-4 mb-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-start gap-2">
                  <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="w-full bg-sh-primary text-white px-4 py-2 rounded-md hover:bg-sh-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sh-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingForm || uploadingFiles || fileLinks.length === 0}
                >
                  {submittingForm ? 'Submitting...' : 'Submit Flyer for Review'}
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