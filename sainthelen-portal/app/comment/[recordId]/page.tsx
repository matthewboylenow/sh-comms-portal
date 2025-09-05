'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChatBubbleLeftRightIcon, CheckCircleIcon, ExclamationTriangleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface CommentPageProps {
  params: { recordId: string };
}

export default function CommentResponsePage({ params }: CommentPageProps) {
  const searchParams = useSearchParams();
  const recordId = params.recordId;
  const tableName = searchParams.get('table');
  const requesterName = searchParams.get('name') || '';
  const requesterEmail = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    name: requesterName,
    email: requesterEmail,
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Pre-populate form if URL parameters are provided
    if (requesterName || requesterEmail) {
      setFormData(prev => ({
        ...prev,
        name: requesterName,
        email: requesterEmail
      }));
    }
  }, [requesterName, requesterEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableName || !recordId) {
      setStatus('error');
      setErrorMessage('Invalid request. Please check your link and try again.');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus('error');
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/comments/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId,
          tableName,
          message: formData.message,
          name: formData.name,
          email: formData.email,
          token: 'allow-public-comment'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setSuccessMessage(data.message || 'Thank you for your response!');
        setFormData(prev => ({ ...prev, message: '' }));
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to submit your comment. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!tableName || !recordId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Link</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This comment link appears to be invalid. Please check your email for the correct link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="bg-blue-600 dark:bg-blue-700 px-6 py-8">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">Respond to Comment</h1>
                <p className="text-blue-100 mt-1">Saint Helen Communications Portal</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {status === 'success' ? (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Thank You!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {successMessage}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You may close this window now.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Your Response
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please provide your response to the comment from the Saint Helen communications team.
                  </p>
                </div>

                {status === 'error' && (
                  <motion.div
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <p className="text-red-800 dark:text-red-300 text-sm">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="Enter your name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="Enter your response..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className={`
                        flex items-center px-6 py-3 rounded-lg font-medium transition-all
                        ${status === 'loading'
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                        }
                      `}
                    >
                      {status === 'loading' ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                          Send Response
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Saint Helen Parish Communications Portal • 
              <a href="https://sainthelen.org" className="hover:text-blue-600 dark:hover:text-blue-400 ml-1">
                sainthelen.org
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}