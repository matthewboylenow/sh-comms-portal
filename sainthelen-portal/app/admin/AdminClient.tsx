// app/admin/AdminClient.tsx
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardStats from '../components/admin/DashboardStats';
import AnnouncementCard from '../components/admin/AnnouncementCard';
import WebsiteUpdateCard from '../components/admin/WebsiteUpdateCard';
import SmsRequestCard from '../components/admin/SmsRequestCard';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

/** Type Declarations */
type TableName = 'announcements' | 'websiteUpdates' | 'smsRequests';

type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

/** Helper parse date if needed for sorting. */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((p) => parseInt(p, 10));
  if (!year || !month || !day) return null;
  const dt = new Date(year, month - 1, day);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function AdminClient() {
  const { data: session, status } = useSession();

  // We'll store the data for each table
  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);

  // Summarize checkboxes
  const [summarizeMap, setSummarizeMap] = useState<Record<string, boolean>>({});

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  // Start with hideCompleted = true
  const [hideCompleted, setHideCompleted] = useState(true);

  // If you want to display a summary from Summarize Items
  const [summary, setSummary] = useState<string | null>(null);

  // On load, if user is authenticated, fetch data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllRequests();
    }
  }, [status]);

  function sortAnnouncements(records: AdminRecord[]): AdminRecord[] {
    return [...records].sort((a, b) => {
      const aStr = a.fields['Promotion Start Date'] || '';
      const bStr = b.fields['Promotion Start Date'] || '';
      const aDate = parseDate(aStr);
      const bDate = parseDate(bStr);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate.getTime() - bDate.getTime();
    });
  }

  function sortWebsiteUpdates(records: AdminRecord[]): AdminRecord[] {
    // Put urgent = true on top
    return [...records].sort((a, b) => {
      const aUrgent = !!a.fields['Urgent'];
      const bUrgent = !!b.fields['Urgent'];
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return 0;
    });
  }

  /** 
   * Fetch data with cache busting
   */
  async function fetchAllRequests() {
    setLoadingData(true);
    setErrorMessage('');

    try {
      const timeStamp = Date.now();
      const res = await fetch(`/api/admin/fetchRequests?ts=${timeStamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store', // critical: ensures Next/browsers won't store this
      });

      if (!res.ok) {
        throw new Error(`Error fetching data: ${res.status}`);
      }

      const data = await res.json();

      // Sort if needed
      const sortedAnnouncements = sortAnnouncements(data.announcements || []);
      const sortedWebsiteUpdates = sortWebsiteUpdates(data.websiteUpdates || []);

      setAnnouncements(sortedAnnouncements);
      setWebsiteUpdates(sortedWebsiteUpdates);
      setSmsRequests(data.smsRequests || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleCompleted(
    tableName: TableName,
    recordId: string,
    currentValue: boolean
  ) {
    try {
      // Update UI optimistically
      if (tableName === 'announcements') {
        setAnnouncements((prev) => 
          prev.map(item => 
            item.id === recordId 
              ? { ...item, fields: { ...item.fields, Completed: !currentValue } } 
              : item
          )
        );
      } else if (tableName === 'websiteUpdates') {
        setWebsiteUpdates((prev) => 
          prev.map(item => 
            item.id === recordId 
              ? { ...item, fields: { ...item.fields, Completed: !currentValue } } 
              : item
          )
        );
      } else {
        setSmsRequests((prev) => 
          prev.map(item => 
            item.id === recordId 
              ? { ...item, fields: { ...item.fields, Completed: !currentValue } } 
              : item
          )
        );
      }

      // Update in Airtable
      const res = await fetch('/api/admin/markCompleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: tableName,
          recordId,
          completed: !currentValue,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to update Completed status');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      // Revert UI if the API call failed
      fetchAllRequests();
    }
  }

  async function handleOverrideStatus(recordId: string, newStatus: string) {
    try {
      // Optimistic UI update
      setAnnouncements((prev) => 
        prev.map(item => 
          item.id === recordId 
            ? { ...item, fields: { ...item.fields, overrideStatus: newStatus } } 
            : item
        )
      );

      const res = await fetch('/api/admin/updateOverrideStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, overrideStatus: newStatus }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update override status');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      // Revert UI if the API call failed
      fetchAllRequests();
    }
  }

  function handleToggleSummarize(recordId: string, isChecked: boolean) {
    setSummarizeMap((prev) => ({
      ...prev,
      [recordId]: isChecked,
    }));
  }

  async function handleSummarizeSelected() {
    const selectedIds: string[] = [];
    [...announcements, ...websiteUpdates, ...smsRequests].forEach((r) => {
      if (summarizeMap[r.id]) {
        selectedIds.push(r.id);
      }
    });
    
    if (!selectedIds.length) {
      setErrorMessage('No items selected for summarization!');
      return;
    }
    
    setSummary(null);
    setLoadingData(true);
    
    try {
      const res = await fetch('/api/admin/summarizeItems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordIds: selectedIds }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to summarize items');
      }
      
      const data = await res.json();
      setSummary(data.summaryText || 'No summary returned.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Error summarizing items: ' + (err as Error).message);
    } finally {
      setLoadingData(false);
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
  
  // Apply filters and search to get displayed records
  function getFilteredRecords() {
    let filteredAnnouncements = [...announcements];
    let filteredWebsiteUpdates = [...websiteUpdates];
    let filteredSmsRequests = [...smsRequests];
    
    // Apply hide completed filter
    if (hideCompleted) {
      filteredAnnouncements = filteredAnnouncements.filter(r => !r.fields.Completed);
      filteredWebsiteUpdates = filteredWebsiteUpdates.filter(r => !r.fields.Completed);
      filteredSmsRequests = filteredSmsRequests.filter(r => !r.fields.Completed);
    }
    
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
            You must be signed in to view the admin dashboard.
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

  return (
    <AdminLayout title="Dashboard">
      {/* Dashboard Stats */}
      <DashboardStats 
        announcements={announcements}
        websiteUpdates={websiteUpdates}
        smsRequests={smsRequests}
        hideCompleted={hideCompleted}
      />
      
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
        <div className="flex items-center">
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

          <div className="ml-4 flex items-center">
            <input
              type="checkbox"
              id="hideCompleted"
              className="h-4 w-4 text-sh-primary rounded border-gray-300 focus:ring-sh-primary"
              checked={hideCompleted}
              onChange={() => setHideCompleted(!hideCompleted)}
            />
            <label htmlFor="hideCompleted" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Hide Completed
            </label>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={fetchAllRequests}
            variant="outline"
            className="flex items-center"
            disabled={loadingData}
            icon={<ArrowPathIcon className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            onClick={handleSummarizeSelected}
            variant="primary"
            className="flex items-center"
            disabled={loadingData || Object.keys(summarizeMap).filter(key => summarizeMap[key]).length === 0}
            icon={<DocumentTextIcon className="h-4 w-4" />}
          >
            Summarize Selected
          </Button>
        </div>
      </div>

      {/* Error messages */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
          {errorMessage}
        </div>
      )}

      {/* Claude Summary */}
      {summary && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Generated Summary</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md whitespace-pre-wrap text-sm">
              {summary}
            </div>
          </CardContent>
        </Card>
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No items found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Try adjusting your search or filters' : 'There are no items to display'}
          </p>
          <Button
            onClick={() => {
              setSearchQuery('');
              setHideCompleted(false);
            }}
            variant="outline"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Announcements Section */}
      {filteredAnnouncements.length > 0 && (
        <section id="announcements" className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Announcements</h2>
          <div className="space-y-4">
            {filteredAnnouncements.map((record) => (
              <AnnouncementCard
                key={record.id}
                record={record}
                summarizeMap={summarizeMap}
                onToggleSummarize={handleToggleSummarize}
                onOverrideStatus={handleOverrideStatus}
                onToggleCompleted={handleCompleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Website Updates Section */}
      {filteredWebsiteUpdates.length > 0 && (
        <section id="websiteUpdates" className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Website Updates</h2>
          <div className="space-y-4">
            {filteredWebsiteUpdates.map((record) => (
              <WebsiteUpdateCard
                key={record.id}
                record={record}
                summarizeMap={summarizeMap}
                onToggleSummarize={handleToggleSummarize}
                onToggleCompleted={handleCompleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* SMS Requests Section */}
      {filteredSmsRequests.length > 0 && (
        <section id="smsRequests" className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">SMS Requests</h2>
          <div className="space-y-4">
            {filteredSmsRequests.map((record) => (
              <SmsRequestCard
                key={record.id}
                record={record}
                summarizeMap={summarizeMap}
                onToggleSummarize={handleToggleSummarize}
                onToggleCompleted={handleCompleted}
              />
            ))}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}