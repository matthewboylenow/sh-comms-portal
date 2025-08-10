// app/graphic-design/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from '../components/ui/FrontCard';
import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function GraphicDesignFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectRequirements, setProjectRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [priority, setPriority] = useState('Standard');
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
      const res = await fetch('/api/graphic-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          projectType,
          projectDescription,
          projectRequirements,
          deadline,
          deadlineTime,
          dimensions,
          priority,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('Graphic design request submitted successfully!');
      
      // Reset form
      setName('');
      setEmail('');
      setMinistry('');
      setProjectType('');
      setProjectDescription('');
      setProjectRequirements('');
      setDeadline('');
      setDeadlineTime('');
      setDimensions('');
      setPriority('Standard');
      setFileLinks([]);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setErrorMessage(err.message || 'Form submission failed');
    } finally {
      setSubmittingForm(false);
    }
  }

  return (
    <FrontLayout title="Request Graphic Design">
      <div className="max-w-3xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        {/* Introduction Card */}
        <FrontCard className="mb-6 border-l-4 border-l-indigo-500">
          <FrontCardContent className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">About Graphic Design Services</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                Our Graphic Design team can help create professional visual materials for your ministry or event. Common requests include:
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                <li>Social media graphics for Instagram, Facebook, etc.</li>
                <li>Posters and flyers for physical distribution</li>
                <li>Digital signage for church screens</li>
                <li>Logos and branding for ministries</li>
                <li>Email headers and graphics</li>
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
                Graphic Design Request
              </FrontCardTitle>
            </FrontCardHeader>
            <FrontCardContent className="p-8">
              <form onSubmit={handleSubmitForm} className="space-y-8">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
                
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
                    className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sh-primary/50 focus:border-sh-primary dark:bg-gray-700/50 dark:text-white transition-all duration-200 backdrop-blur-sm bg-white/80"
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

              {/* Project Information */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project Information</h3>
                
                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    required
                  >
                    <option value="">Select a project type</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Poster">Poster</option>
                    <option value="Flyer">Flyer</option>
                    <option value="Digital Screens">Digital Screens</option>
                    <option value="Logo">Logo</option>
                    <option value="Email Graphic">Email Graphic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Project Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    rows={4}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    required
                    placeholder="Please describe what you need designed, including the purpose, audience, and key information to include."
                  />
                </div>

                {/* Project Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Specific Requirements
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    rows={3}
                    value={projectRequirements}
                    onChange={(e) => setProjectRequirements(e.target.value)}
                    placeholder="Any specific fonts, colors, text, or other elements that must be included in the design."
                  />
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dimensions (if applicable)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="e.g., 1080x1080px for Instagram, 8.5x11 inches for a flyer"
                  />
                </div>

                {/* Deadline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline Time
                    </label>
                    <input
                      type="time"
                      step="300"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="priority-standard"
                        name="priority"
                        type="radio"
                        value="Standard"
                        checked={priority === 'Standard'}
                        onChange={() => setPriority('Standard')}
                        className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300"
                      />
                      <label htmlFor="priority-standard" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Standard (7-10 business days)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="priority-urgent"
                        name="priority"
                        type="radio"
                        value="Urgent"
                        checked={priority === 'Urgent'}
                        onChange={() => setPriority('Urgent')}
                        className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300"
                      />
                      <label htmlFor="priority-urgent" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Urgent (3-5 business days)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attach Files (logos, reference images, etc.)
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
                      PNG, JPG, PDF, AI, PSD up to 10MB
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
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="w-full bg-sh-primary text-white px-4 py-2 rounded-md hover:bg-sh-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sh-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingForm || uploadingFiles}
                >
                  {submittingForm ? 'Submitting...' : 'Submit Design Request'}
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