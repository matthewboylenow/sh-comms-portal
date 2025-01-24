// app/admin/AdminClient.tsx

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

/** Type Declarations */
type TableName = 'announcements' | 'websiteUpdates' | 'smsRequests';

type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

/** Helper parse date if needed for sorting, but we'll keep it minimal. */
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

  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  // 1) Start with hideCompleted = true
  const [hideCompleted, setHideCompleted] = useState(true);

  // If you want to display a summary from Summarize Items
  const [summary, setSummary] = useState<string | null>(null);

  // On load, if user is authenticated, fetch data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllRequests();
    }
  }, [status]);

  // Example sorting if you want it
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
    // Example to put urgent = true on top
    return [...records].sort((a, b) => {
      const aUrgent = !!a.fields['Urgent'];
      const bUrgent = !!b.fields['Urgent'];
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return 0;
    });
  }

  async function fetchAllRequests() {
    setLoadingData(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/fetchRequests');
      if (!res.ok) {
        throw new Error(`Error fetching data: ${res.status}`);
      }
      const data = await res.json();

      // sort announcements if needed
      const sortedAnnouncements = sortAnnouncements(data.announcements || []);
      const sortedWebsiteUpdates = sortWebsiteUpdates(
        data.websiteUpdates || []
      );

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
    if (tableName === 'announcements') {
      setAnnouncements((prev) => prev.filter((r) => r.id !== recordId));
    } else if (tableName === 'websiteUpdates') {
      setWebsiteUpdates((prev) => prev.filter((r) => r.id !== recordId));
    } else {
      setSmsRequests((prev) => prev.filter((r) => r.id !== recordId));
    }

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
      if (!res.ok) throw new Error('Failed to update Completed status');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    }
  }

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
      fetchAllRequests();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
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
    } catch (err: any) {
      console.error(err);
      alert('Error summarizing items: ' + (err as Error).message);
    }
  }

  function doSignOut() {
    signOut();
  }

  // If loading or unauth
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

  // 2) A top nav (brand bar) that is consistent
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Brand Nav */}
      <header className="bg-blue-900 text-white py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/admin" className="text-xl font-bold hover:opacity-80">
            Saint Helen Admin
          </a>
          {/* Another link to completed */}
          <a
            href="/admin/completed"
            className="hover:opacity-80 transition-opacity"
          >
            Completed Items
          </a>
        </div>
        <div>
          <button
            onClick={doSignOut}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main container */}
      <main className="flex-1 p-4 text-gray-900 dark:text-gray-200 space-y-4">
        {/* Additional top controls row */}
        <div className="flex items-center justify-between border-b pb-2 mb-3">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllRequests}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Refresh Data
            </button>
            <button
              onClick={handleSummarizeSelected}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Summarize Selected
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-100 text-red-800 rounded border border-red-200">
            {errorMessage}
          </div>
        )}

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

        {/* Hide Completed? */}
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
          <div className="text-gray-800 dark:text-gray-100">Loading data...</div>
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
      </main>
    </div>
  );
}

/* Now you can place the table components below:
   AnnouncementsTable, WebsiteUpdatesTable, SmsRequestsTable 
   with your styling, show more logic, clickable S3 links, etc.
   We'll re-paste final versions with 'table-auto w-full' and so on. 
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
  const [expandedRows, setExpandedRows] = useLocalState<Record<string, boolean>>({});

  function truncateWords(text: string, limit: number) {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= limit) return text;
    return words.slice(0, limit).join(' ') + '...';
  }

  function toggleExpand(rowId: string) {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  }

  function renderFileLinks(linksStr: string) {
    if (!linksStr) return null;
    const parts = linksStr.split(/\s+/).filter(Boolean);
    return (
      <ul className="space-y-1">
        {parts.map((link, idx) => (
          <li key={idx}>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-300 underline break-words"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    );
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
                      onChange={(e) =>
                        setSummarizeMap((prev) => ({
                          ...prev,
                          [r.id]: e.target.checked,
                        }))
                      }
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
                    <div className="whitespace-pre-wrap">{displayText}</div>
                    {fullText.split(/\s+/).length > 80 && (
                      <button
                        onClick={() =>
                          setExpandedRows((prev) => ({
                            ...prev,
                            [r.id]: !prev[r.id],
                          }))
                        }
                        className="text-blue-600 dark:text-blue-300 underline mt-1"
                      >
                        {isExpanded ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 border text-black dark:text-gray-100 whitespace-normal break-words leading-relaxed">
                    {renderFileLinks(f['File Links'] || '')}
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

/* WebsiteUpdates: show urgent in red, also file links clickable */
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

  function renderFileLinks(linksStr: string) {
    if (!linksStr) return null;
    const parts = linksStr.split(/\s+/).filter(Boolean);
    return (
      <ul className="space-y-1">
        {parts.map((link, idx) => (
          <li key={idx}>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-300 underline break-words"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    );
  }

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
              const urgent = !!f['Urgent'];
              const rowClass = urgent
                ? 'text-red-600 dark:text-red-500'
                : 'text-black dark:text-gray-100';

              return (
                <tr
                  key={r.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${rowClass}`}
                >
                  <td className="px-4 py-2 border text-center whitespace-normal break-words leading-relaxed">
                    <input
                      type="checkbox"
                      checked={isSummarize}
                      onChange={(e) =>
                        setSummarizeMap((prev) => ({
                          ...prev,
                          [r.id]: e.target.checked,
                        }))
                      }
                    />
                  </td>
                  <td className="px-4 py-2 border whitespace-normal break-words leading-relaxed">
                    {f['Page to Update'] || ''}
                  </td>
                  <td className="px-4 py-2 border whitespace-normal break-words leading-relaxed max-w-md">
                    {f.Description || ''}
                  </td>
                  <td className="px-4 py-2 border whitespace-normal break-words leading-relaxed">
                    <a
                      href={f['Sign-Up URL'] || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-300 underline break-words"
                    >
                      {f['Sign-Up URL'] || ''}
                    </a>
                  </td>
                  <td className="px-4 py-2 border whitespace-normal break-words leading-relaxed">
                    {renderFileLinks(f['File Links'] || '')}
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

/* SMS Requests Table - clickable S3 links, hide completed by default */
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

  function renderFileLinks(linksStr: string) {
    if (!linksStr) return null;
    const parts = linksStr.split(/\s+/).filter(Boolean);
    return (
      <ul className="space-y-1">
        {parts.map((link, idx) => (
          <li key={idx}>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-300 underline break-words"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    );
  }

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
                      onChange={(e) =>
                        setSummarizeMap((prev) => ({
                          ...prev,
                          [r.id]: e.target.checked,
                        }))
                      }
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
