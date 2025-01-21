// app/admin/AdminClient.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

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

  // If you still want Summarize logic
  const [summarizeMap, setSummarizeMap] = useState<Record<string, boolean>>({});

  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  // Optionally store the summary from Summarize route
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllRequests();
    }
  }, [status]);

  // 1) Fetch data from /api/admin/fetchRequests
  async function fetchAllRequests() {
    setLoadingData(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/fetchRequests');
      if (!res.ok) throw new Error(`Error fetching data: ${res.status}`);
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

  // 2) Mark item as Completed
  async function handleCompleted(
    tableName: TableName,
    recordId: string,
    currentValue: boolean
  ) {
    // Immediately remove from local UI
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
      if (!res.ok) throw new Error('Failed to update Completed status.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    }
  }

  // 3) Override status (Announcements only)
  async function handleOverrideStatus(recordId: string, newStatus: string) {
    try {
      const res = await fetch('/api/admin/updateOverrideStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, overrideStatus: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update override status');
      fetchAllRequests();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  }

  // 4) Summarize logic
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
      alert('No items selected for summarization!');
      return;
    }
    try {
      const res = await fetch('/api/admin/summarizeItems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordIds: selectedIds }),
      });
      if (!res.ok) throw new Error('Failed to summarize items');
      const data = await res.json();
      setSummary(data.summaryText || 'No summary returned.');
      alert('Successfully summarized selected items!');
    } catch (err: any) {
      console.error(err);
      alert('Error summarizing items: ' + (err as Error).message);
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

  // Main Admin Dashboard UI
  return (
    <div className="p-4 text-gray-900 dark:text-gray-200 space-y-4">
      {/* Heading / Actions */}
      <div className="flex justify-between items-center border-b pb-2 mb-3">
        <h2 className="text-2xl font-bold">Saint Helen Admin Dashboard</h2>
        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            onClick={fetchAllRequests}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Refresh Data
          </button>

          {/* Summarize Selected */}
          <button
            onClick={handleSummarizeSelected}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Summarize Selected
          </button>

          {/* Completed Items Link */}
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

      {/* Summary display */}
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

      {/* If data is loading */}
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

/* ------------------------------------------------------------------------
   Announcements Table with Show More / Show Less on the Body
------------------------------------------------------------------------ */
import { useState as useStateLocal } from 'react';

// We rename it 'useStateLocal' if you prefer. 
// Alternatively, just place this logic inline and remove the second import.
// We do need a separate state inside the component to track expansion.

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
  // Track expanded rows
  const [expandedRows, setExpandedRows] = useStateLocal<Record<string, boolean>>({});

  // truncate text
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
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <th className="px-3 py-2 border">Summarize?</th>
              <th className="px-3 py-2 border">Name</th>
              <th className="px-3 py-2 border">Ministry</th>
              <th className="px-3 py-2 border">Date/Time</th>
              <th className="px-3 py-2 border">Promotion Start</th>
              <th className="px-3 py-2 border">Platforms</th>

              {/* Make the body column wider */}
              <th className="px-3 py-2 border w-[400px]">
                Announcement Body
              </th>

              {/* Shrink the file links column */}
              <th className="px-3 py-2 border w-[150px]">
                File Links
              </th>
              <th className="px-3 py-2 border">Override</th>
              <th className="px-3 py-2 border">Completed?</th>
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
                  <td className="px-3 py-2 border text-center">
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
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {f.Name || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {f.Ministry || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {f['Date of Event'] || ''} {f['Time of Event'] || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {f['Promotion Start Date'] || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {(f.Platforms || []).join(', ')}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100 align-top">
                    {/* truncated or full text */}
                    <div className="whitespace-pre-wrap">
                      {displayText}
                    </div>
                    {/* show more/less if over 80 words */}
                    {fullText.split(/\s+/).length > 80 && (
                      <button
                        onClick={() => toggleExpand(r.id)}
                        className="text-blue-600 dark:text-blue-300 underline mt-1"
                      >
                        {isExpanded ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100 align-top">
                    {f['File Links'] || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100 align-top">
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
                  <td className="px-3 py-2 border text-center text-black dark:text-gray-100 align-top">
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
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <th className="px-3 py-2 border">Summarize?</th>
              <th className="px-3 py-2 border">Page to Update</th>
              <th className="px-3 py-2 border">Description</th>
              <th className="px-3 py-2 border">Sign-Up URL</th>
              <th className="px-3 py-2 border">File Links</th>
              <th className="px-3 py-2 border">Completed?</th>
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
                  <td className="px-3 py-2 border text-center">
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
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {f['Page to Update'] || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100 max-w-md">
                    {f.Description || ''}
                  </td>
                  <td className="px-3 py-2 border text-blue-600 dark:text-blue-300 underline">
                    {f['Sign-Up URL'] || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {f['File Links'] || ''}
                  </td>
                  <td className="px-3 py-2 border text-center text-black dark:text-gray-100">
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
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <th className="px-3 py-2 border">Summarize?</th>
              <th className="px-3 py-2 border">Name</th>
              <th className="px-3 py-2 border">Ministry</th>
              <th className="px-3 py-2 border">Requested Date</th>
              <th className="px-3 py-2 border">SMS Message</th>
              <th className="px-3 py-2 border">Additional Info</th>
              <th className="px-3 py-2 border">Completed?</th>
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
                  <td className="px-3 py-2 border text-center">
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
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {f.Name || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {f.Ministry || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100">
                    {f['Requested Date'] || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100 max-w-md">
                    {f['SMS Message'] || ''}
                  </td>
                  <td className="px-3 py-2 border text-black dark:text-gray-100 max-w-md">
                    {f['Additional Info'] || ''}
                  </td>
                  <td className="px-3 py-2 border text-center text-black dark:text-gray-100">
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
