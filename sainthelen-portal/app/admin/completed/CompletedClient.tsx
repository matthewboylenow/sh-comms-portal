// app/admin/completed/CompletedClient.tsx
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AnnouncementCard from '../../components/admin/AnnouncementCard';
import WebsiteUpdateCard from '../../components/admin/WebsiteUpdateCard';
import SmsRequestCard from '../../components/admin/SmsRequestCard';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type TableName = 'announcements' | 'websiteUpdates' | 'smsRequests';
type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

export default function CompletedClient() {
  const { data: session, status } = useSession();

  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy summarize map for the card components
  const [summarizeMap, setSummarizeMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCompleted();
    }
  }, [status]);

  async function fetchCompleted() {
    setLoadingData(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/fetchCompletedRequests');
      if (!res.ok) throw new Error(`Error fetching completed: ${res.status}`);
      const data = await res.json();
      setAnnouncements(data.announcements || []);
      setWebsiteUpdates(data.websiteUpdates || []);
      setSmsRequests(data.smsRequests || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setLoadingData(false);
    }
  }

  // Un-check completed items to move them back to active
  async function handleUncheck(tableName: TableName, recordId: string) {
    try {
      // Update UI optimistically
      if (tableName === 'announcements') {
        setAnnouncements((prev) => prev.filter((r) => r.id !== recordId));
      } else if (tableName === 'websiteUpdates') {
        setWebsiteUpdates((prev) => prev.filter((r) => r.id !== recordId));
      } else {
        setSmsRequests((prev) => prev.filter((r) => r.id !== recordId));
      }
      
      // Update in Airtable
      const res = await fetch('/api/admin/markCompleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: tableName,
          recordId,
          completed: false, // re-open
        }),
      });
      
      if (!res.ok) throw new Error('Failed to uncheck Completed');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      // Revert UI changes if API call failed
      fetchCompleted();
    }
  }

  // Filter function for search
  function filterRecords<T extends AdminRecord>(records: T[], query: string): T[] {
    if (!query.trim()) return records;
    
    const lowercaseQuery = query.toLowerCase();
    return records.filter(record => {
      const fields = record.fields;
      
      // Search in common fields
      if (fields.Name && fields.Name.toLowerCase().includes(lowercaseQuery)) return true;
      if (fields.Ministry && fields.Ministry.toLowerCase().includes(lowercaseQuery)) return true;
      
      // Search in announcement specific fields
      if (fields['Announcement Body'] && fields['Announcement Body'].toLowerCase().includes(lowercaseQuery)) return true;
      
      // Search in website update specific fields
      if (fields['Page to Update'] && fields['Page to Update'].toLowerCase().includes(lowercaseQuery)) return true;
      if (fields['Description'] && fields['Description'].toLowerCase().includes(lowercaseQuery)) return true;
      
      // Search in SMS specific fields
      if (fields['SMS Message'] && fields['SMS Message'].toLowerCase().includes(lowercaseQuery)) return true;
      
      return false;
    });
  }

  // Apply filtering
  function getFilteredRecords() {
    let filteredAnnouncements = [...announcements];
    let filteredWebsiteUpdates = [...websiteUpdates];
    let filteredSmsRequests = [...smsRequests];
    
    // Apply search query
    if (searchQuery) {
      filteredAnnouncements = filterRecords(filteredAnnouncements, searchQuery);
      filteredWebsiteUpdates = filterRecords(filteredWebsiteUpdates, searchQuery);
      filteredSmsRequests = filterRecords(filteredSmsRequests, searchQuery);
    }
    
    return {
      filteredAnnouncements,
      filteredWebsiteUpdates,
      filteredSmsRequests
    };
  }

  // Dummy handlers for card components (no actions taken)
  const handleToggleSummarize = () => {};
  const handleOverrideStatus = () => {};

  // If loading or unauthenticated, show appropriate UI
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
  
  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You must be signed in to view the completed items.
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

  // Get filtered records
  const { 
    filteredAnnouncements, 
    filteredWebsiteUpdates, 
    filteredSmsRequests 
  } = getFilteredRecords();

  // Count total completed items
  const totalCompletedItems = announcements.length + websiteUpdates.length + smsRequests.length;

  return (
    <AdminLayout title="Completed Items">
      {/* Stats Card */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 mr-3">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Completed Items</p>
              <p className="text-2xl font-bold">{totalCompletedItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 focus:ring-sh-primary focus:border-sh-primary block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button
          onClick={fetchCompleted}
          variant="outline"
          className="flex items-center"
          disabled={loadingData}
          icon={<ArrowPathIcon className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      {/* Error messages */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
          {errorMessage}
        </div>
      )}

      {/* Loading indicator */}
      {loadingData && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-sh-primary border-t-transparent"></div>
        </div>
      )}

      {/* No results message */}
      {!loadingData && 
        filteredAnnouncements.length === 0 && 
        filteredWebsiteUpdates.length === 0 && 
        filteredSmsRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
            <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No completed items found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'There are no completed items to display'}
          </p>
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
            >
              Clear Search
            </Button>
          )}
        </div>
      )}

      {/* Announcements Section */}
      {filteredAnnouncements.length > 0 && (
        <section id="announcements" className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Completed Announcements</h2>
          <div className="space-y-4">
            {filteredAnnouncements.map((record) => (
              <AnnouncementCard
                key={record.id}
                record={record}
                summarizeMap={summarizeMap}
                onToggleSummarize={handleToggleSummarize}
                onOverrideStatus={handleOverrideStatus}
                onToggleCompleted={() => handleUncheck('announcements', record.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Website Updates Section */}
      {filteredWebsiteUpdates.length > 0 && (
        <section id="websiteUpdates" className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Completed Website Updates</h2>
          <div className="space-y-4">
            {filteredWebsiteUpdates.map((record) => (
              <WebsiteUpdateCard
                key={record.id}
                record={record}
                summarizeMap={summarizeMap}
                onToggleSummarize={handleToggleSummarize}
                onToggleCompleted={() => handleUncheck('websiteUpdates', record.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* SMS Requests Section */}
      {filteredSmsRequests.length > 0 && (
        <section id="smsRequests" className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Completed SMS Requests</h2>
          <div className="space-y-4">
            {filteredSmsRequests.map((record) => (
              <SmsRequestCard
                key={record.id}
                record={record}
                summarizeMap={summarizeMap}
                onToggleSummarize={handleToggleSummarize}
                onToggleCompleted={() => handleUncheck('smsRequests', record.id)}
              />
            ))}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}