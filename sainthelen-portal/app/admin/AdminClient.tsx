// app/admin/AdminClient.tsx
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardStats from '../components/admin/DashboardStats';
import AnnouncementCard from '../components/admin/AnnouncementCard';
import WebsiteUpdateCard from '../components/admin/WebsiteUpdateCard';
import SmsRequestCard from '../components/admin/SmsRequestCard';
import AVRequestCard from '../components/admin/AVRequestCard';
import FlyerReviewCard from '../components/admin/FlyerReviewCard';
import GraphicDesignCard from '../components/admin/GraphicDesignCard';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

/** Type Declarations */
type TableName = 'announcements' | 'websiteUpdates' | 'smsRequests' | 'avRequests' | 'flyerReviews' | 'graphicDesign';
type SortDirection = 'asc' | 'desc';
type SortField = 'createdTime' | 'name' | 'date';

type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

/** Helper parse date if needed for sorting. */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Check if in YYYY-MM-DD format
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map((p) => parseInt(p, 10));
    if (!year || !month || !day) return null;
    const dt = new Date(year, month - 1, day);
    return isNaN(dt.getTime()) ? null : dt;
  }
  // Check if in MM/DD/YY format
  else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    let [month, day, year] = parts.map((p) => parseInt(p, 10));
    // Convert 2-digit year to 4-digit
    if (year < 100) year += 2000;
    if (!year || !month || !day) return null;
    const dt = new Date(year, month - 1, day);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

export default function AdminClient() {
  const { data: session, status } = useSession();

  // We'll store the data for each table
  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);
  const [avRequests, setAvRequests] = useState<AdminRecord[]>([]);
  const [flyerReviews, setFlyerReviews] = useState<AdminRecord[]>([]);
  const [graphicDesign, setGraphicDesign] = useState<AdminRecord[]>([]);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('createdTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Summarize checkboxes (only for announcements now)
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

  function sortRecords(records: AdminRecord[]): AdminRecord[] {
    return [...records].sort((a, b) => {
      if (sortField === 'createdTime') {
        // Most Airtable records have a createdTime field
        const aTime = a.fields.createdTime || '';
        const bTime = b.fields.createdTime || '';
        return sortDirection === 'asc' 
          ? aTime.localeCompare(bTime)
          : bTime.localeCompare(aTime);
      } 
      else if (sortField === 'name') {
        const aName = a.fields.Name || '';
        const bName = b.fields.Name || '';
        return sortDirection === 'asc'
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      }
      else if (sortField === 'date') {
        // First, determine which date field to use based on the table
        let aDateStr = '';
        let bDateStr = '';
        
        if (activeTab === 'announcements') {
          aDateStr = a.fields['Date of Event'] || '';
          bDateStr = b.fields['Date of Event'] || '';
        } else if (activeTab === 'avRequests') {
          // For A/V requests, just use the first date string in the dates and times field
          const aDates = a.fields['Event Dates and Times'] || '';
          const bDates = b.fields['Event Dates and Times'] || '';
          aDateStr = aDates.split('\n')[0]?.split(',')[0] || '';
          bDateStr = bDates.split('\n')[0]?.split(',')[0] || '';
        } else if (activeTab === 'flyerReviews') {
          aDateStr = a.fields['Event Date'] || '';
          bDateStr = b.fields['Event Date'] || '';
        } else if (activeTab === 'smsRequests') {
          aDateStr = a.fields['Requested Date'] || '';
          bDateStr = b.fields['Requested Date'] || '';
        } else if (activeTab === 'graphicDesign') {
          aDateStr = a.fields['Deadline'] || '';
          bDateStr = b.fields['Deadline'] || '';
        }
        
        const aDate = parseDate(aDateStr);
        const bDate = parseDate(bDateStr);
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return sortDirection === 'asc' ? -1 : 1;
        if (!bDate) return sortDirection === 'asc' ? 1 : -1;
        
        return sortDirection === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }
      
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

      // Apply sorting to all record types
      setAnnouncements(data.announcements || []);
      setWebsiteUpdates(data.websiteUpdates || []);
      setSmsRequests(data.smsRequests || []);
      setAvRequests(data.avRequests || []);
      setFlyerReviews(data.flyerReviews || []);
      setGraphicDesign(data.graphicDesign || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setLoadingData(false);
    }
  }

  // Function to handle changing sort
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      // If same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If new field, set to that field and default to descending (newest first)
      setSortField(field);
      setSortDirection('desc');
    }
  };

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
      } else if (tableName === 'graphicDesign') {
        setGraphicDesign((prev) => 
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

  async function handleUpdateStatus(recordId: string, newStatus: string) {
    try {
      // Optimistic UI update
      setGraphicDesign((prev) => 
        prev.map(item => 
          item.id === recordId 
            ? { ...item, fields: { ...item.fields, Status: newStatus } } 
            : item
        )
      );
      const res = await fetch('/api/admin/updateDesignStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, status: newStatus }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update design status');
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
    [...announcements].forEach((r) => {
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
      
      // Search in Graphic Design specific fields
      if (fields['Project Type'] && fields['Project Type'].toLowerCase().includes(lowercaseQuery)) return true;
      if (fields['Project Description'] && fields['Project Description'].toLowerCase().includes(lowercaseQuery)) return true;
      if (fields['Status'] && fields['Status'].toLowerCase().includes(lowercaseQuery)) return true;
      
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
    let filteredGraphicDesign = [...graphicDesign];
    
    // Apply hide completed filter
    if (hideCompleted) {
      filteredAnnouncements = filteredAnnouncements.filter(r => !r.fields.Completed);
      filteredWebsiteUpdates = filteredWebsiteUpdates.filter(r => !r.fields.Completed);
      filteredSmsRequests = filteredSmsRequests.filter(r => !r.fields.Completed);
      filteredAvRequests = filteredAvRequests.filter(r => !r.fields.Completed);
      filteredFlyerReviews = filteredFlyerReviews.filter(r => !r.fields.Completed);
      filteredGraphicDesign = filteredGraphicDesign.filter(r => !r.fields.Completed);
    }
    
    // Apply search query
    if (searchQuery) {
      filteredAnnouncements = filterRecords(filteredAnnouncements, searchQuery);
      filteredWebsiteUpdates = filterRecords(filteredWebsiteUpdates, searchQuery);
      filteredSmsRequests = filterRecords(filteredSmsRequests, searchQuery);
      filteredAvRequests = filterRecords(filteredAvRequests, searchQuery);
      filteredFlyerReviews = filterRecords(filteredFlyerReviews, searchQuery);
      filteredGraphicDesign = filterRecords(filteredGraphicDesign, searchQuery);
    }
    
    // Apply sorting based on active tab
    if (activeTab === 'announcements') {
      filteredAnnouncements = sortRecords(filteredAnnouncements);
    } else if (activeTab === 'websiteUpdates') {
      filteredWebsiteUpdates = sortRecords(filteredWebsiteUpdates);
    } else if (activeTab === 'smsRequests') {
      filteredSmsRequests = sortRecords(filteredSmsRequests);
    } else if (activeTab === 'avRequests') {
      filteredAvRequests = sortRecords(filteredAvRequests);
    } else if (activeTab === 'flyerReviews') {
      filteredFlyerReviews = sortRecords(filteredFlyerReviews);
    } else if (activeTab === 'graphicDesign') {
      filteredGraphicDesign = sortRecords(filteredGraphicDesign);
    }
    
    return {
      filteredAnnouncements,
      filteredWebsiteUpdates,
      filteredSmsRequests,
      filteredAvRequests,
      filteredFlyerReviews,
      filteredGraphicDesign
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
    filteredFlyerReviews,
    filteredGraphicDesign
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
        graphicDesign={graphicDesign}
        hideCompleted={hideCompleted}
      />
      
      {/* Modern toolbar with intuitive layout */}
      <div className="mb-8">
        {/* Primary toolbar with search and important actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 mb-5 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            {/* Search field - expanded on mobile, reasonable width on desktop */}
            <div className="relative flex-grow lg:max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-11 pr-4 py-3 w-full bg-gray-50 dark:bg-slate-700 border-0 shadow-inner rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white transition-all"
                placeholder="Search communications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Main action buttons - horizontal on all screens */}
            <div className="flex flex-wrap gap-3 my-3 lg:my-0">
              <Button
                onClick={fetchAllRequests}
                variant="outline"
                className="rounded-xl h-11"
                disabled={loadingData}
                icon={<ArrowPathIcon className={`h-5 w-5 ${loadingData ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>

              {activeTab === 'announcements' && (
                <>
                  <Button
                    onClick={handleSummarizeSelected}
                    variant="primary"
                    className="rounded-xl h-11"
                    disabled={loadingData || Object.keys(summarizeMap).filter(key => summarizeMap[key]).length === 0}
                    icon={<DocumentTextIcon className="h-5 w-5" />}
                  >
                    Summarize
                  </Button>
                  
                  <Button
                    onClick={handleAddToCalendar}
                    variant="success"
                    className="rounded-xl h-11"
                    disabled={creatingEvents || Object.keys(calendarMap).filter(key => calendarMap[key]).length === 0}
                    icon={<CalendarIcon className="h-5 w-5" />}
                  >
                    Calendar
                  </Button>
                </>
              )}
            </div>

            {/* Hide completed toggle with visual switch */}
            <div className="flex items-center ml-auto p-1.5 bg-gray-50 dark:bg-slate-700 rounded-xl">
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="hideCompleted" 
                  className="sr-only peer" 
                  checked={hideCompleted}
                  onChange={() => setHideCompleted(!hideCompleted)}
                />
                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Hide Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary toolbar with sorting options */}
        <div className="bg-white dark:bg-slate-800 backdrop-blur-lg rounded-xl shadow-md py-3 px-5 flex flex-wrap items-center gap-3 transition-all">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sort by:</span>
          
          <div className="flex bg-gray-50 dark:bg-slate-700 rounded-xl p-1">
            <button
              onClick={() => handleSortChange('createdTime')}
              className={`px-4 py-2 text-sm rounded-lg flex items-center transition-all ${
                sortField === 'createdTime' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Date Added
              {sortField === 'createdTime' && (
                <span className="ml-1.5">
                  {sortDirection === 'asc' ? <ArrowUpIcon className="h-3.5 w-3.5" /> : <ArrowDownIcon className="h-3.5 w-3.5" />}
                </span>
              )}
            </button>
            
            <button
              onClick={() => handleSortChange('name')}
              className={`px-4 py-2 text-sm rounded-lg flex items-center mx-1 transition-all ${
                sortField === 'name' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Name
              {sortField === 'name' && (
                <span className="ml-1.5">
                  {sortDirection === 'asc' ? <ArrowUpIcon className="h-3.5 w-3.5" /> : <ArrowDownIcon className="h-3.5 w-3.5" />}
                </span>
              )}
            </button>
            
            <button
              onClick={() => handleSortChange('date')}
              className={`px-4 py-2 text-sm rounded-lg flex items-center transition-all ${
                sortField === 'date' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Event Date
              {sortField === 'date' && (
                <span className="ml-1.5">
                  {sortDirection === 'asc' ? <ArrowUpIcon className="h-3.5 w-3.5" /> : <ArrowDownIcon className="h-3.5 w-3.5" />}
                </span>
              )}
            </button>
          </div>
          
          <div className="ml-auto text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <span className="hidden md:inline">Showing</span> 
            <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
              {
                activeTab === 'announcements' ? filteredAnnouncements.length :
                activeTab === 'websiteUpdates' ? filteredWebsiteUpdates.length :
                activeTab === 'smsRequests' ? filteredSmsRequests.length :
                activeTab === 'avRequests' ? filteredAvRequests.length :
                activeTab === 'flyerReviews' ? filteredFlyerReviews.length :
                filteredGraphicDesign.length
              }
            </span> 
            <span className="ml-1 hidden md:inline">items</span>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="min-w-max">
          <nav className="flex space-x-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-md">
            {[
              { id: 'announcements', label: 'Announcements', count: filteredAnnouncements.length, icon: <MegaphoneIcon className="h-4 w-4" /> },
              { id: 'websiteUpdates', label: 'Website Updates', count: filteredWebsiteUpdates.length, icon: <GlobeAltIcon className="h-4 w-4" /> },
              { id: 'smsRequests', label: 'SMS Requests', count: filteredSmsRequests.length, icon: <ChatBubbleLeftRightIcon className="h-4 w-4" /> },
              { id: 'avRequests', label: 'A/V Requests', count: filteredAvRequests.length, icon: <VideoCameraIcon className="h-4 w-4" /> },
              { id: 'flyerReviews', label: 'Flyer Reviews', count: filteredFlyerReviews.length, icon: <DocumentTextIcon className="h-4 w-4" /> },
              { id: 'graphicDesign', label: 'Graphic Design', count: filteredGraphicDesign.length, icon: <PencilSquareIcon className="h-4 w-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TableName)}
                className={`whitespace-nowrap py-2 px-4 rounded-lg font-medium text-sm flex items-center transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error messages */}
      {errorMessage && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-red-500 h-2"></div>
          <div className="p-5 flex items-start">
            <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-2 rounded-full mr-4">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-1">Error</h3>
              <p className="text-red-700 dark:text-red-300">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success messages */}
      {successMessage && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-green-500 h-2"></div>
          <div className="p-5 flex items-start">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-4">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-1">Success</h3>
              <p className="text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Claude Summary */}
      {summary && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-white">Generated Summary</h3>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 dark:bg-slate-700 p-5 rounded-lg whitespace-pre-wrap text-sm shadow-inner border border-gray-100 dark:border-slate-600">
              {summary}
            </div>
          </div>
        </div>
      )}
      
      {/* Calendar Results */}
      {calendarResults && calendarResults.length > 0 && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-white">Calendar Events Created</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto bg-gray-50 dark:bg-slate-700 rounded-lg shadow-inner">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Event</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                  {calendarResults.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                        Event #{index + 1} <span className="text-gray-500 dark:text-gray-400 text-xs">(ID: {result.eventId})</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-3">
                        <a 
                          href={result.editUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </a>
                        <a 
                          href={result.eventUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator - modern pulse effect */}
      {loadingData && (
        <div className="flex flex-col justify-center items-center p-12">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
            <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-blue-600 dark:border-blue-400 animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading data...</p>
        </div>
      )}

      {/* No results message - styled */}
      {!loadingData && 
        filteredAnnouncements.length === 0 && 
        filteredWebsiteUpdates.length === 0 && 
        filteredSmsRequests.length === 0 &&
        filteredAvRequests.length === 0 &&
        filteredFlyerReviews.length === 0 &&
        filteredGraphicDesign.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center flex flex-col items-center justify-center">
          <div className="bg-gray-50 dark:bg-slate-700 rounded-full p-6 mb-6 relative">
            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 relative z-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No items found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            {searchQuery ? 
              "Your search didn't match any items. Try adjusting your search terms or filters." : 
              "There are no items to display at this time."}
          </p>
          <Button
            onClick={() => {
              setSearchQuery('');
              setHideCompleted(false);
            }}
            variant="outline"
            className="rounded-xl px-6 py-3"
            icon={<AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />}
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

      {/* Graphic Design Section */}
      {activeTab === 'graphicDesign' && (
        <section id="graphicDesign" className="mb-8">
          <div className="space-y-4">
            {filteredGraphicDesign.length > 0 ? (
              filteredGraphicDesign.map((record) => (
                <GraphicDesignCard
                  key={record.id}
                  record={record}
                  onToggleCompleted={handleCompleted}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-500 dark:text-gray-400">No graphic design requests available</p>
              </div>
            )}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}