// app/admin/analytics/AnalyticsClient.tsx
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

export default function AnalyticsClient() {
  const { data: session, status } = useSession();

  // Data states
  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);
  const [avRequests, setAvRequests] = useState<AdminRecord[]>([]);
  const [flyerReviews, setFlyerReviews] = useState<AdminRecord[]>([]);
  const [graphicDesign, setGraphicDesign] = useState<AdminRecord[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch data on load
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  async function fetchData() {
    setLoading(true);
    setError('');

    try {
      const timeStamp = Date.now();
      const res = await fetch(`/api/admin/fetchRequests?ts=${timeStamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Error fetching data: ${res.status}`);
      }

      const data = await res.json();
      
      setAnnouncements(data.announcements || []);
      setWebsiteUpdates(data.websiteUpdates || []);
      setSmsRequests(data.smsRequests || []);
      setAvRequests(data.avRequests || []);
      setFlyerReviews(data.flyerReviews || []);
      setGraphicDesign(data.graphicDesign || []);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sh-primary border-t-transparent mb-4"></div>
          <p className="text-gray-800 dark:text-gray-200">Loading session...</p>
        </div>
      </div>
    );
  }
  
  // Show sign in if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You must be signed in to view analytics.
          </p>
          <Button
            onClick={() => signIn('azure-ad')}
            className="w-full"
            size="lg"
          >
            Sign In with Microsoft 365
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Analytics Dashboard">
      <div className="mb-6 flex justify-end">
        <Button
          onClick={fetchData}
          variant="outline"
          className="flex items-center"
          disabled={loading}
          icon={<ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sh-primary border-t-transparent"></div>
        </div>
      ) : (
        <AnalyticsDashboard
          announcements={announcements}
          websiteUpdates={websiteUpdates}
          smsRequests={smsRequests}
          avRequests={avRequests}
          flyerReviews={flyerReviews}
          graphicDesign={graphicDesign}
        />
      )}
    </AdminLayout>
  );
}