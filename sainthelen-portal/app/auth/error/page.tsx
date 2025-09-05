'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to access the admin portal.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'Default':
        return 'An error occurred during authentication.';
      default:
        return 'An unknown error occurred. Please try again.';
    }
  };

  const handleClearCache = () => {
    // Clear all possible cached data
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker cache if available
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Force reload without cache
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Authentication Error
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {getErrorMessage(error)}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Troubleshooting Steps:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Clear your browser cache and cookies</li>
                <li>Try signing in again with your Microsoft 365 account</li>
                <li>Contact IT support if the problem persists</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleClearCache}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Clear Cache & Reload
              </button>
              
              <Link
                href="/admin"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Try Again
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            ← Back to Saint Helen Portal
          </Link>
        </div>
      </div>
    </div>
  );
}