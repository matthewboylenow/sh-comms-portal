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
  CalendarIcon,
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
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [creatingEvents, setCreatingEvents] = useState(false);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar checkboxes
  const [calendarMap, setCalendarMap] = useState<Record<string, boolean>>({});

  // Calendar results
  const [calendarResults, setCalendarResults] = useState<any[] | null>(null);

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
    setSuccessMessage('');
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

  // Handle calendar checkbox toggle
  function handleToggleCalendar(recordId: string, isChecked: boolean) {
    setCalendarMap((prev) => ({
      ...prev,
      [recordId]: isChecked,
    }));
  }

  // Process adding selected announcements to the calendar
  async function handleAddToCalendar() {
    // Get the selected record IDs
    const selectedIds: string[] = [];
    announcements.forEach((r) => {
      if (calendarMap[r.id]) {
        selectedIds.push(r.id);
      }
    });
    
    if (!selectedIds.length) {
      setErrorMessage('No items selected for calendar!');
      return;
    }
    
    setCreatingEvents(true);
    setErrorMessage('');
    setSuccessMessage('');
    setCalendarResults(null);
    
    try {
      const res = await fetch('/api/calendar/add-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordIds: selectedIds }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create events');
      }
      
      const data = await res.json();
      
      if (data.success) {
        setSuccessMessage(`Successfully created ${data.results.length} events${data.errors.length > 0 ? ` (with ${data.errors.length} errors)` : ''}!`);
        setCalendarResults(data.results);
        
        // Clear checkboxes for successful items
        const newCalendarMap = { ...calendarMap };
        data.results.forEach((result: any) => {
          delete newCalendarMap[result.recordId];
        });
        setCalendarMap(newCalendarMap);
      } else {
        throw new Error(data.error || 'Failed to create events');
      }
    } catch (err: any) {
      console.error('Error adding to calendar:', err);
      setErrorMessage('Error creating events: ' + (err as Error).message);
    } finally {
      setCreatingEvents(false);
    }
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

        <div className="flex space-x-2">
          <Button
            onClick={fetchCompleted}
            variant="outline"
            className="flex items-center"
            disabled={loadingData}
            icon={<ArrowPathIcon className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          
          <Button
            onClick={handleAddToCalendar}
            variant="success"
            className="flex items-center"
            disabled={creatingEvents || Object.keys(calendarMap).filter(key => calendarMap[key]).length === 0}
            icon={<CalendarIcon className="h-4 w-4" />}
          >
            Add To Calendar
          </Button>
        </div>
      </div>

      {/* Error messages */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
          {errorMessage}
        </div>
      )}
      
      {/* Success messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-4 rounded-md mb-6">
          {successMessage}
        </div>
      )}
      
      {/* Calendar Results */}
      {calendarResults && calendarResults.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Calendar Events Created</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {calendarResults.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        Event #{index + 1} (ID: {result.eventId})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <a 
                          href={result.editUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline mr-4"
                        >
                          Edit
                        </a>
                        <a 
                          href={result.eventUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                calendarMap={calendarMap}
                onToggleSummarize={handleToggleSummarize}
                onToggleCalendar={handleToggleCalendar}
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