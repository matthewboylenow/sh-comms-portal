'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
      <div className="flex min-h-screen items-center justify-center bg-canvas p-4 text-ink">
        <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-ink mb-2">Invalid Link</h1>
          <p className="text-ink-2">
            This comment link appears to be invalid. Please check your email for the correct link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div
          className="overflow-hidden rounded-lg border border-line bg-surface"
        >
          {/* Header */}
          <div className="border-b border-line bg-surface-2 px-6 py-5">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="mr-3 h-6 w-6 text-ink-3" />
              <div>
                <h1 className="text-xl font-semibold text-ink">Reply to the office</h1>
                <p className="mt-0.5 text-sm text-ink-3">Saint Helen Communications Portal</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {status === 'success' ? (
              <div
                className="text-center"
              >
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-ink mb-4">
                  Thank You!
                </h2>
                <p className="text-ink-2 mb-6">
                  {successMessage}
                </p>
                <p className="text-sm text-ink-3">
                  You may close this window now.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-ink mb-2">
                    Your Response
                  </h2>
                  <p className="text-ink-2">
                    Please provide your response to the comment from the Saint Helen communications team.
                  </p>
                </div>

                {status === 'error' && (
                  <div
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
                  >
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <p className="text-red-800 dark:text-red-300 text-sm">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-ink-2 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="block w-full rounded border border-line-2 bg-surface px-[11px] py-2 text-md text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/25"
                        placeholder="Enter your name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-ink-2 mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="block w-full rounded border border-line-2 bg-surface px-[11px] py-2 text-md text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/25"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-ink-2 mb-2">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className="block w-full rounded border border-line-2 bg-surface px-[11px] py-2 text-md text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/25"
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
                          ? 'bg-gray-300 dark:bg-gray-600 text-ink-3 cursor-not-allowed'
                          : 'bg-navy hover:bg-navy-hover text-white hover: transform hover:-translate-y-0.5'
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
          <div className="border-t border-line bg-surface-2 px-6 py-4">
            <p className="text-xs text-ink-3 text-center">
              Saint Helen Communications • 
              <a href="https://sainthelen.org" className="ml-1 text-navy hover:underline">
                sainthelen.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}