// app/admin/AdminClient.tsx
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardStats from '../components/admin/DashboardStats';
import AnnouncementCard from '../components/admin/AnnouncementCard';
import WebsiteUpdateCard from '../components/admin/WebsiteUpdateCard';
import SmsRequestCard from '../components/admin/SmsRequestCard';
import AVRequestCard from '../components/admin/AVRequestCard';
import FlyerReviewCard from '../components/admin/FlyerReviewCard';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

/** Type Declarations */
type TableName = 'announcements' | 'websiteUpdates' | 'smsRequests' | 'avRequests' | 'flyerReviews';

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
  const [avRequests, setAvRequests] = useState<AdminRecord[]>([]);
  const [flyerReviews, setFlyerReviews] = useState<AdminRecord[]>([]);

  // Summarize checkboxes
  const [summarizeMap, setSummarizeMap] = useState<Record<string, boolean>>({});
  
  // Calendar checkboxes
  const [calendarMap, setCalendarMap] = useState<Record<string, boolean>>({});

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Status states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [creatingEvents, setCreatingEvents] = useState(false);
  
  // Start with hideCompleted = true
  const [hideCompleted, setHideCompleted] = useState(true);

  // If you want to display a summary from Summarize Items
  const [summary, setSummary] = useState<string | null>(null);
  
  // Calendar results
  const [calendarResults, setCalendarResults] = useState<any[] | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<TableName>('announcements');

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

  function sortAvRequests(records: AdminRecord[]): AdminRecord[] {
    // Put livestream = true on top
    return [...records].sort((a, b) => {
      const aLivestream = !!a.fields['Needs Livestream'];
      const bLivestream = !!b.fields['Needs Livestream'];
      if (aLivestream && !bLivestream) return -1;
      if (!aLivestream && bLivestream) return 1;
      return 0;
    });
  }

  function sortFlyerReviews(records: AdminRecord[]): AdminRecord[] {
    // Put urgent = true on top
    return [...records].sort((a, b) => {
      const aUrgent = a.fields['Urgency'] === 'urgent';
      const bUrgent = b.fields['Urgency'] === 'urgent';
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
    setSuccessMessage('');

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
      const sortedAvRequests = sortAvRequests(data.avRequests || []);
      const sortedFlyerReviews = sortFlyerReviews(data.flyerReviews || []);

      setAnnouncements(sortedAnnouncements);
      setWebsiteUpdates(sortedWebsiteUpdates);
      setSmsRequests(data.smsRequests || []);
      setAvRequests(sortedAvRequests);
      setFlyerReviews(sortedFlyerReviews);
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
      } else if (tableName === 'smsRequests') {
        setSmsRequests((prev) => 
          prev.map(item => 
            item.id === recordId 
              ? { ...item, fields: { ...item.fields, Completed: !currentValue } } 
              : item
          )
        );
      } else if (tableName === 'avRequests') {
        setAvRequests((prev) => 
          prev.map(item => 
            item.id === recordId 
              ? { ...item, fields: { ...item.fields, Completed: !currentValue } } 
              : item
          )
        );
      } else if (tableName === 'flyerReviews') {
        setFlyerReviews((prev) => 
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

  async function handleSummarizeSelected() {
    const selectedIds: string[] = [];
    [...announcements, ...websiteUpdates, ...smsRequests, ...avRequests, ...flyerReviews].forEach((r) => {
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
      
      // Search in A/V request specific fields
      if (fields['Event Name'] && fields['Event Name'].toLowerCase().includes(lowercaseQuery)) return true;
      if (fields['Location'] && fields['Location'].toLowerCase().includes(lowercaseQuery)) return true;
      if (fields['A/V Needs'] && fields['A/V Needs'].toLowerCase().includes(lowercaseQuery)) return true;
      
      // Search in Flyer Review specific fields
      if (fields['Target Audience'] && fields['Target Audience'].toLowerCase().includes(lowercaseQuery)) return true;
      if (fields['Feedback Needed'] && fields['Feedback Needed'].toLowerCase().includes(lowercaseQuery)) return true;
      if (fields['Purpose'] && fields['Purpose'].toLowerCase().includes(lowercaseQuery)) return true;
      
      return false;
    });
  }
  
  // Apply filters and search to get displayed records
  function getFilteredRecords() {
    let filteredAnnouncements = [...announcements];
    let filteredWebsiteUpdates = [...websiteUpdates];
    let filteredSmsRequests = [...smsRequests];
    let filteredAvRequests = [...avRequests];
    let filteredFlyerReviews = [...flyerReviews];
    
    // Apply hide completed filter
    if (hideCompleted) {
      filteredAnnouncements = filteredAnnouncements.filter(r => !r.fields.Completed);
      filteredWebsiteUpdates = filteredWebsiteUpdates.filter(r => !r.fields.Completed);
      filteredSmsRequests = filteredSmsRequests.filter(r => !r.fields.Completed);
      filteredAvRequests = filteredAvRequests.filter(r => !r.fields.Completed);
      filteredFlyerReviews = filteredFlyerReviews.filter(r => !r.fields.Completed);
    }
    
    // Apply search query
    if (searchQuery) {
      filteredAnnouncements = filterRecords(filteredAnnouncements, searchQuery);
      filteredWebsiteUpdates = filterRecords(filteredWebsiteUpdates, searchQuery);
      filteredSmsRequests = filterRecords(filteredSmsRequests, searchQuery);
      filteredAvRequests = filterRecords(filteredAvRequests, searchQuery);
      filteredFlyerReviews = filterRecords(filteredFlyerReviews, searchQuery);
    }
    
    return {
      filteredAnnouncements,
      filteredWebsiteUpdates,
      filteredSmsRequests,
      filteredAvRequests,
      filteredFlyerReviews
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
    filteredSmsRequests,
    filteredAvRequests,
    filteredFlyerReviews
  } = getFilteredRecords();

  return (
    <AdminLayout title="Dashboard">
      {/* Dashboard Stats */}
      <DashboardStats 
        announcements={announcements}
        websiteUpdates={websiteUpdates}
        smsRequests={smsRequests}
        avRequests={avRequests}
        flyerReviews={flyerReviews}
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

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'announcements'
                  ? 'border-sh-primary text-sh-primary dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Announcements {filteredAnnouncements.length > 0 && `(${filteredAnnouncements.length})`}
            </button>
            <button
              onClick={() => setActiveTab('websiteUpdates')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'websiteUpdates'
                  ? 'border-sh-primary text-sh-primary dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Website Updates {filteredWebsiteUpdates.length > 0 && `(${filteredWebsiteUpdates.length})`}
            </button>
            <button
              onClick={() => setActiveTab('smsRequests')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'smsRequests'
                  ? 'border-sh-primary text-sh-primary dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              SMS Requests {filteredSmsRequests.length > 0 && `(${filteredSmsRequests.length})`}
            </button>
            <button
              onClick={() => setActiveTab('avRequests')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'avRequests'
                  ? 'border-sh-primary text-sh-primary dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              A/V Requests {filteredAvRequests.length > 0 && `(${filteredAvRequests.length})`}
            </button>
            <button
              onClick={() => setActiveTab('flyerReviews')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'flyerReviews'
                  ? 'border-sh-primary text-sh-primary dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Flyer Reviews {filteredFlyerReviews.length > 0 && `(${filteredFlyerReviews.length})`}
            </button>
          </nav>
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
        filteredSmsRequests.length === 0 &&
        filteredAvRequests.length === 0 &&
        filteredFlyerReviews.length === 0 && (
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
            {activeTab === 'announcements' && (
        <section id="announcements" className="mb-8">
          <div className="space-y-4">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((record) => (
                <AnnouncementCard
                  key={record.id}
                  record={record}
                  summarizeMap={summarizeMap}
                  calendarMap={calendarMap}
                  onToggleSummarize={handleToggleSummarize}
                  onToggleCalendar={handleToggleCalendar}
                  onOverrideStatus={handleOverrideStatus}
                  onToggleCompleted={handleCompleted}
                />
              ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-500 dark:text-gray-400">No announcements available</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Website Updates Section */}
      {activeTab === 'websiteUpdates' && (
        <section id="websiteUpdates" className="mb-8">
          <div className="space-y-4">
            {filteredWebsiteUpdates.length > 0 ? (
              filteredWebsiteUpdates.map((record) => (
                <WebsiteUpdateCard
                  key={record.id}
                  record={record}
                  summarizeMap={summarizeMap}
                  onToggleSummarize={handleToggleSummarize}
                  onToggleCompleted={handleCompleted}
                />
              ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-500 dark:text-gray-400">No website updates available</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SMS Requests Section */}
      {activeTab === 'smsRequests' && (
        <section id="smsRequests" className="mb-8">
          <div className="space-y-4">
            {filteredSmsRequests.length > 0 ? (
              filteredSmsRequests.map((record) => (
                <SmsRequestCard
                  key={record.id}
                  record={record}
                  summarizeMap={summarizeMap}
                  onToggleSummarize={handleToggleSummarize}
                  onToggleCompleted={handleCompleted}
                />
              ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-500 dark:text-gray-400">No SMS requests available</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* A/V Requests Section */}
      {activeTab === 'avRequests' && (
        <section id="avRequests" className="mb-8">
          <div className="space-y-4">
            {filteredAvRequests.length > 0 ? (
              filteredAvRequests.map((record) => (
                <AVRequestCard
                  key={record.id}
                  record={record}
                  summarizeMap={summarizeMap}
                  onToggleSummarize={handleToggleSummarize}
                  onToggleCompleted={handleCompleted}
                />
              ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-500 dark:text-gray-400">No A/V requests available</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Flyer Reviews Section */}
      {activeTab === 'flyerReviews' && (
        <section id="flyerReviews" className="mb-8">
          <div className="space-y-4">
            {filteredFlyerReviews.length > 0 ? (
              filteredFlyerReviews.map((record) => (
                <FlyerReviewCard
                  key={record.id}
                  record={record}
                  summarizeMap={summarizeMap}
                  onToggleSummarize={handleToggleSummarize}
                  onToggleCompleted={handleCompleted}
                />
              ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-500 dark:text-gray-400">No flyer reviews available</p>
              </div>
            )}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}