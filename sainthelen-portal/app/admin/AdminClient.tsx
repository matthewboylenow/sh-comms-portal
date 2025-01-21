// app/admin/AdminClient.tsx

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

// Types for table name and records
type TableName = 'announcements' | 'websiteUpdates' | 'smsRequests';

type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

export default function AdminClient() {
  const { data: session, status } = useSession();

  // States for each category
  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);

  // Summarize? checkboxes
  const [summarizeMap, setSummarizeMap] = useState<Record<string, boolean>>({});

  // Generic UI states
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  // Optionally store the summary from a “Summarize Selected” operation
  const [summary, setSummary] = useState<string | null>(null);

  // Fetch data once user is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllRequests();
    }
  }, [status]);

  // Fetch all 3 categories (announcements, website updates, sms) from /api/admin/fetchRequests
  async function fetchAllRequests() {
    setLoadingData(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/admin/fetchRequests');
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      const data = await response.json();
      setAnnouncements(data.announcements || []);
      setWebsiteUpdates(data.websiteUpdates || []);
      setSmsRequests(data.smsRequests || []);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    } finally {
      setLoadingData(false);
    }
  }

  // Mark item as completed => remove from UI + call /api/admin/markCompleted
  async function handleCompleted(
    tableName: TableName,
    recordId: string,
    currentValue: boolean
  ) {
    // Remove from local UI
    if (tableName === 'announcements') {
      setAnnouncements((prev) => prev.filter((r) => r.id !== recordId));
    } else if (tableName === 'websiteUpdates') {
      setWebsiteUpdates((prev) => prev.filter((r) => r.id !== recordId));
    } else {
      setSmsRequests((prev) => prev.filter((r) => r.id !== recordId));
    }

    // Patch in Airtable
    try {
      const res = await fetch('/api/admin/markCompleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: tableName,
          recordId,
          completed: !currentValue,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to update Completed status.');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    }
  }

  // Override status (only for Announcements)
  async function handleOverrideStatus(recordId: string, newStatus: string) {
    try {
      const res = await fetch('/api/admin/updateOverrideStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, overrideStatus: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update override status');
      }
      // Optionally re-fetch the data after changing override
      fetchAllRequests();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    }
  }

  // Summarize? checkboxes logic
  function handleToggleSummarize(recordId: string, isChecked: boolean) {
    setSummarizeMap((prev) => ({
      ...prev,
      [recordId]: isChecked,
    }));
  }

  // Summarize Selected => call /api/admin/summarizeItems
  async function handleSummarizeSelected() {
    const selectedIds: string[] = [];
    // Gather all records from announcements, website updates, sms
    [...announcements, ...websiteUpdates, ...smsRequests].forEach((r) => {
      if (summarizeMap[r.id]) {
        selectedIds.push(r.id);
      }
    });

    if (!selectedIds.length) {
      alert('No items selected for summarization!');
      return;
    }

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
      alert('Successfully summarized selected items!');
    } catch (error: any) {
      console.error(error);
      alert('Error summarizing items: ' + (error as Error).message);
    }
  }

  function doSignOut() {
    signOut();
  }

  // Auth gating
  if (status === 'loading') {
    return (
      <div className="p-4 text-gray-800 dark:text-gray-200">
        <p>Loading session...</p>
      </div>
    );
  }
  if (status === 'unauthenticated') {
    return (
      <div className="p-4 text-gray-800 dark:text-gray-200">
        <p>You must be signed in to view admin dashboard.</p>
        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => signIn('azure-ad')}
        >
          Sign In
        </button>
      </div>
    );
  }

  // Main Admin Dashboard
  return (
    <div className="p-4 text-gray-900 dark:text-gray-200 space-y-4">
      <div className="flex justify-between items-center border-b pb-2 mb-3">
        <h2 className="text-2xl font-bold">Saint Helen Admin Dashboard</h2>
        <div className="flex items-center gap-3">
          {/* Refresh Data */}
          <button
            onClick={fetchAllRequests}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Refresh Data
          </button>

          {/* Summarize selected items */}
          <button
            onClick={handleSummarizeSelected}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Summarize Selected
          </button>

          {/* Link to completed items */}
          <a
            href="/admin/completed"
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors"
          >
            View Completed Items
          </a>

          {/* Sign Out */}
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={doSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-800 rounded border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* If we have a summary from Summarize Items */}
      {summary && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
            Claude Summary
          </h3>
          <pre className="whitespace-pre-wrap text-black dark:text-gray-100">
            {summary}
          </pre>
        </div>
      )}

      {/* Hide Completed Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hideCompleted"
          className="h-4 w-4"
          checked={hideCompleted}
          onChange={() => setHideCompleted(!hideCompleted)}
        />
        <label htmlFor="hideCompleted" className="text-sm">
          Hide Completed?
        </label>
      </div>

      {loadingData ? (
        <div className="text-gray-800 dark:text-gray-100">
          Loading data...
        </div>
      ) : (
        <>
          <AnnouncementsTable
            records={announcements}
            hideCompleted={hideCompleted}
            summarizeMap={summarizeMap}
            setSummarizeMap={setSummarizeMap}
            onOverrideStatus={handleOverrideStatus}
            onToggleCompleted={handleCompleted}
          />
          <WebsiteUpdatesTable
            records={websiteUpdates}
            hideCompleted={hideCompleted}
            summarizeMap={summarizeMap}
            setSummarizeMap={setSummarizeMap}
            onToggleCompleted={handleCompleted}
          />
          <SmsRequestsTable
            records={smsRequests}
            hideCompleted={hideCompleted}
            summarizeMap={summarizeMap}
            setSummarizeMap={setSummarizeMap}
            onToggleCompleted={handleCompleted}
          />
        </>
      )}
    </div>
  );
}

/**
 * Announcements Table - with Show More / Show Less for Body
 * and improved spacing to avoid scrunching.
 */
import { useState as useLocalState } from 'react';

function AnnouncementsTable({
  records,
  hideCompleted,
  summarizeMap,
  setSummarizeMap,
  onOverrideStatus,
  onToggleCompleted,
}: {
  records: AdminRecord[];
  hideCompleted: boolean;
  summarizeMap: Record<string, boolean>;
  setSummarizeMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onOverrideStatus: (recordId: string, newStatus: string) => void;
  onToggleCompleted: (
    tableName: 'announcements',
    recordId: string,
    currentValue: boolean
  ) => void;
}) {
  // For Show More / Show Less
  const [expandedRows, setExpandedRows] = useLocalState<Record<string, boolean>>({});

  function truncateWords(text: string, wordLimit = 80) {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  }

  function toggleExpand(rowId: string) {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  }

  const displayed = hideCompleted ? records.filter((r) => !r.fields.Completed) : records;
  if (!displayed.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">
        Announcements
      </h3>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <th className="px-4 py-2 border">Summarize?</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Ministry</th>
              <th className="px-4 py-2 border">Date/Time</th>
              <th className="px-4 py-2 border">Promotion Start</th>
              <th className="px-4 py-2 border">Platforms</th>
              <th className="px-4 py-2 border">Announcement Body</th>
              <th className="px-4 py-2 border">File Links</th>
              <th className="px-4 py-2 border">Override</th>
              <th className="px-4 py-2 border">Completed?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
            {displayed.map((r) => {
              const f = r.fields;
              const isSummarize = summarizeMap[r.id] || false;

              const isExpanded = !!expandedRows[r.id];
              const fullText = f['Announcement Body'] || '';
              const displayText = isExpanded
                ? fullText
                : truncateWords(fullText, 80);

              return (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-2 border text-center whitespace-normal break-words leading-relaxed">
                    <input
                      type="checkbox"
                      checked={isSummarize}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSummarizeMap((prev) => ({
                          ...prev,
                          [r.id]: checked,
                        }));
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f.Name || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f.Ministry || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f['Date of Event'] || ''} {f['Time of Event'] || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f['Promotion Start Date'] || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {(f.Platforms || []).join(', ')}
                  </td>

                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    <div className="whitespace-pre-wrap">
                      {displayText}
                    </div>
                    {fullText.split(/\s+/).length > 80 && (
                      <button
                        onClick={() => toggleExpand(r.id)}
                        className="text-blue-600 dark:text-blue-300 underline mt-1"
                      >
                        {isExpanded ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </td>

                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f['File Links'] || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    <select
                      className="border rounded p-1 bg-white dark:bg-gray-800 text-black dark:text-gray-200"
                      value={f.overrideStatus || 'none'}
                      onChange={(e) => onOverrideStatus(r.id, e.target.value)}
                    >
                      <option value="none">none</option>
                      <option value="forceExclude">forceExclude</option>
                      <option value="forceInclude">forceInclude</option>
                      <option value="defer">defer</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border text-center whitespace-normal break-words leading-relaxed">
                    <input
                      type="checkbox"
                      checked={!!f.Completed}
                      onChange={() =>
                        onToggleCompleted('announcements', r.id, !!f.Completed)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------
   WebsiteUpdatesTable
------------------------------------------------------------------------ */
function WebsiteUpdatesTable({
  records,
  hideCompleted,
  summarizeMap,
  setSummarizeMap,
  onToggleCompleted,
}: {
  records: AdminRecord[];
  hideCompleted: boolean;
  summarizeMap: Record<string, boolean>;
  setSummarizeMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onToggleCompleted: (
    tableName: 'websiteUpdates',
    recordId: string,
    currentValue: boolean
  ) => void;
}) {
  const displayed = hideCompleted ? records.filter((r) => !r.fields.Completed) : records;
  if (!displayed.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">
        Website Updates
      </h3>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <th className="px-4 py-2 border">Summarize?</th>
              <th className="px-4 py-2 border">Page to Update</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Sign-Up URL</th>
              <th className="px-4 py-2 border">File Links</th>
              <th className="px-4 py-2 border">Completed?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
            {displayed.map((r) => {
              const f = r.fields;
              const isSummarize = summarizeMap[r.id] || false;
              return (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-2 border text-center whitespace-normal break-words leading-relaxed">
                    <input
                      type="checkbox"
                      checked={isSummarize}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSummarizeMap((prev) => ({
                          ...prev,
                          [r.id]: checked,
                        }));
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f['Page to Update'] || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed max-w-md">
                    {f.Description || ''}
                  </td>
                  <td className="px-4 py-2 border text-blue-600 dark:text-blue-300 underline whitespace-normal break-words leading-relaxed">
                    {f['Sign-Up URL'] || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f['File Links'] || ''}
                  </td>
                  <td className="px-4 py-2 border text-center whitespace-normal break-words leading-relaxed">
                    <input
                      type="checkbox"
                      checked={!!f.Completed}
                      onChange={() =>
                        onToggleCompleted('websiteUpdates', r.id, !!f.Completed)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------
   SmsRequestsTable
------------------------------------------------------------------------ */
function SmsRequestsTable({
  records,
  hideCompleted,
  summarizeMap,
  setSummarizeMap,
  onToggleCompleted,
}: {
  records: AdminRecord[];
  hideCompleted: boolean;
  summarizeMap: Record<string, boolean>;
  setSummarizeMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onToggleCompleted: (
    tableName: 'smsRequests',
    recordId: string,
    currentValue: boolean
  ) => void;
}) {
  const displayed = hideCompleted ? records.filter((r) => !r.fields.Completed) : records;
  if (!displayed.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">
        SMS Requests
      </h3>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <th className="px-4 py-2 border">Summarize?</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Ministry</th>
              <th className="px-4 py-2 border">Requested Date</th>
              <th className="px-4 py-2 border">SMS Message</th>
              <th className="px-4 py-2 border">Additional Info</th>
              <th className="px-4 py-2 border">Completed?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
            {displayed.map((r) => {
              const f = r.fields;
              const isSummarize = summarizeMap[r.id] || false;
              return (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-2 border text-center whitespace-normal break-words leading-relaxed">
                    <input
                      type="checkbox"
                      checked={isSummarize}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSummarizeMap((prev) => ({
                          ...prev,
                          [r.id]: checked,
                        }));
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f.Name || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f.Ministry || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {f['Requested Date'] || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed max-w-md">
                    {f['SMS Message'] || ''}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed max-w-md">
                    {f['Additional Info'] || ''}
                  </td>
                  <td className="px-4 py-2 border text-center whitespace-normal break-words leading-relaxed">
                    <input
                      type="checkbox"
                      checked={!!f.Completed}
                      onChange={() =>
                        onToggleCompleted('smsRequests', r.id, !!f.Completed)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
