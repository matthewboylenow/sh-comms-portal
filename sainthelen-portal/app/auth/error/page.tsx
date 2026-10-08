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
    <div className="flex min-h-screen flex-col justify-center bg-canvas px-4 py-12 text-ink sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-status-approval-bg p-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-status-approval-t" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-xl font-semibold">
          Sign-in did not work
        </h2>
        <p className="mt-1 text-center text-sm text-ink-2">
          {getErrorMessage(error)}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-lg border border-line bg-surface px-5 py-6 sm:px-8">
          <div className="space-y-4">
            <div className="rounded-r border-l-[3px] border-status-scheduled-d bg-status-scheduled-bg px-3.5 py-2.5">
              <h3 className="mb-1 text-sm font-medium text-status-scheduled-t">
                Things to try
              </h3>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-status-scheduled-t">
                <li>Clear your browser cache and cookies</li>
                <li>Try signing in again with your Microsoft 365 account</li>
                <li>Contact IT support if the problem persists</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleClearCache}
                className="inline-flex h-9 w-full items-center justify-center rounded border border-line-2 bg-surface text-sm font-medium text-ink hover:bg-surface-2"
              >
                Clear cached sign-in and reload
              </button>
              
              <Link
                href="/admin"
                className="inline-flex h-9 w-full items-center justify-center rounded bg-navy text-sm font-medium text-on-navy hover:bg-navy-hover"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Try signing in again
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-navy hover:underline"
          >
            Back to the portal
          </Link>
        </div>
      </div>
    </div>
  );
}