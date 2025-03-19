// app/graphic-design/page.tsx
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from '../components/ui/FrontCard';
import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function GraphicDesignFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [sizeDimensions, setSizeDimensions] = useState('');
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle brand colors selection
  const handleColorChange = (color: string) => {
    setBrandColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

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
        // Get presigned URL
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

        // Upload file
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
          deadline,
          priority,
          sizeDimensions,
          brandColors,
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
      setDeadline('');
      setPriority('Medium');
      setSizeDimensions('');
      setBrandColors([]);
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
        {/* Info Card */}
        <FrontCard className="mb-6 border-l-4 border-l-blue-500">
          <FrontCardContent className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">About Graphic Design Requests</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Our communications team can create various graphic designs for your ministry including flyers, social media graphics, 
                bulletin ads, and more. Please provide as much detail as possible about your request, including deadlines and any specific brand colors or elements needed. For best results, submit requests at least 5 business days before your deadline.
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
            <FrontCardTitle>Graphic Design Request Details</FrontCardTitle>
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
                    <option value="">Select project type</option>
                    <option value="Flyer">Flyer</option>
                    <option value="Social Media Graphic">Social Media Graphic</option>
                    <option value="Bulletin Ad">Bulletin Ad</option>
                    <option value="Banner">Banner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Size/Dimensions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Required Size/Dimensions
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={sizeDimensions}
                    onChange={(e) => setSizeDimensions(e.target.value)}
                    placeholder="e.g., 8.5x11 inches, 1200x630 pixels for Facebook"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                {/* Brand Colors */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saint Helen Brand Colors to Include:</span>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="color-primary-blue"
                        type="checkbox"
                        className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                        checked={brandColors.includes('Primary Blue')}
                        onChange={() => handleColorChange('Primary Blue')}
                      />
                      <label htmlFor="color-primary-blue" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Primary Blue
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="color-dark-brown"
                        type="checkbox"
                        className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                        checked={brandColors.includes('Dark Brown')}
                        onChange={() => handleColorChange('Dark Brown')}
                      />
                      <label htmlFor="color-dark-brown" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Dark Brown
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="color-sage"
                        type="checkbox"
                        className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                        checked={brandColors.includes('Sage')}
                        onChange={() => handleColorChange('Sage')}
                      />
                      <label htmlFor="color-sage" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Sage
                      </label>
                    </div>
                  </div>
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
                    placeholder="Please describe what you're looking for, including all text that should be included, any specific imagery needed, and the overall look and feel you want."
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attach Files (optional)
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Upload any reference images, logos, or content that should be included in the design.
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
                      PNG, JPG, PDF, DOCX up to 10MB
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
                  {submittingForm ? 'Submitting...' : 'Submit Graphic Design Request'}
                </button>
              </div>
            </form>
          </FrontCardContent>
        </FrontCard>
      </div>
    </FrontLayout>
  );
}