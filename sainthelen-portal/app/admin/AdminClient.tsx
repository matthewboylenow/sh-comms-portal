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

/** A helper to parse a 'YYYY-MM-DD' or '2025-02-20' style string into a Date or null. */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // If your date is '2025-01-22' or something. Adjust parsing as needed.
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((p) => parseInt(p, 10));
  if (!year || !month || !day) return null;
  const dt = new Date(year, month - 1, day);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function AdminClient() {
  const { data: session, status } = useSession();

  // States for each table
  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);

  // Summarize? checkboxes
  const [summarizeMap, setSummarizeMap] = useState<Record<string, boolean>>({});

  // UI states
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  // 1) Default to hide completed
  const [hideCompleted, setHideCompleted] = useState(true);

  // If you want to display the summary from Summarize
  const [summary, setSummary] = useState<string | null>(null);

  // Auto-fetch data once user is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllRequests();
    }
  }, [status]);

  /** 
   * Sort Announcements by Promotion Start Date ascending.
   * We'll parse the 'Promotion Start Date' field if it exists.
   */
  function sortAnnouncementsByPromotion(records: AdminRecord[]): AdminRecord[] {
    return [...records].sort((a, b) => {
      const aDateStr = a.fields['Promotion Start Date'] || '';
      const bDateStr = b.fields['Promotion Start Date'] || '';
      const aDate = parseDate(aDateStr);
      const bDate = parseDate(bDateStr);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate.getTime() - bDate.getTime();
    });
  }

  /**
   * Sort Website Updates so Urgent ones appear on top, in red. 
   * We'll do it by sorting urgent == true before false. 
   */
  function sortWebsiteUpdatesByUrgent(records: AdminRecord[]): AdminRecord[] {
    return [...records].sort((a, b) => {
      const aUrgent = !!a.fields['Urgent'];
      const bUrgent = !!b.fields['Urgent'];
      // if A is urgent and B not => A first
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return 0;
    });
  }

  // 2) Fetch from /api/admin/fetchRequests and apply sorts
  async function fetchAllRequests() {
    setLoadingData(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/admin/fetchRequests');
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      const data = await response.json();

      // Sort announcements by Promotion Start date
      const sortedAnnouncements = sortAnnouncementsByPromotion(
        data.announcements || []
      );

      // Sort website updates so urgent appear on top
      const sortedWebsiteUpdates = sortWebsiteUpdatesByUrgent(
        data.websiteUpdates || []
      );

      setAnnouncements(sortedAnnouncements);
      setWebsiteUpdates(sortedWebsiteUpdates);
      setSmsRequests(data.smsRequests || []);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    } finally {
      setLoadingData(false);
    }
  }

  /**
   * Mark an item as completed => remove from local array => update in Airtable
   */
  async function handleCompleted(
    tableName: TableName,
    recordId: string,
    currentValue: boolean
  ) {
    // remove from local UI
    if (tableName === 'announcements') {
      setAnnouncements((prev) => prev.filter((r) => r.id !== recordId));
    } else if (tableName === 'websiteUpdates') {
      setWebsiteUpdates((prev) => prev.filter((r) => r.id !== recordId));
    } else {
      setSmsRequests((prev) => prev.filter((r) => r.id !== recordId));
    }

    // patch airtable
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

  /**
   * Override status (Announcements only)
   */
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
      // optionally re-fetch
      fetchAllRequests();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
    }
  }

  /**
   * Summarize? checkboxes logic
   */
  function handleToggleSummarize(recordId: string, isChecked: boolean) {
    setSummarizeMap((prev) => ({
      ...prev,
      [recordId]: isChecked,
    }));
  }

  async function handleSummarizeSelected() {
    const selectedIds: string[] = [];
    // gather from all 3 sets
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

  // sign out
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

  // The main Admin UI
  return (
    <div className="p-4 text-gray-900 dark:text-gray-200 space-y-4">
      {/* Heading / actions */}
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

          {/* Summarize Selected */}
          <button
            onClick={handleSummarizeSelected}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Summarize Selected
          </button>

          {/* Completed Items */}
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

      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-800 rounded border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Summarize Response */}
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

      {/* Hide Completed Toggle: default is true */}
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

      {/* If loading data */}
      {loadingData ? (
        <div className="text-gray-800 dark:text-gray-100">Loading data...</div>
      ) : (
        <>
          {/* Announcements Table */}
          <AnnouncementsTable
            records={announcements}
            hideCompleted={hideCompleted}
            summarizeMap={summarizeMap}
            setSummarizeMap={setSummarizeMap}
            onOverrideStatus={handleOverrideStatus}
            onToggleCompleted={handleCompleted}
          />
          {/* Website Updates Table */}
          <WebsiteUpdatesTable
            records={websiteUpdates}
            hideCompleted={hideCompleted}
            summarizeMap={summarizeMap}
            setSummarizeMap={setSummarizeMap}
            onToggleCompleted={handleCompleted}
          />
          {/* SMS Requests Table */}
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
   Announcements Table - Show More / Show Less, sorted by Promotion Start
   Also includes S3 file links as clickable <a> tags
------------------------------------------------------------------------ */
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

  function truncateWords(text: string, wordLimit: number) {
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

  // Filter out completed if hideCompleted is true
  const displayed = hideCompleted ? records.filter((r) => !r.fields.Completed) : records;
  if (!displayed.length) return null;

  // A helper to parse multiple S3 links or handle one link
  function renderFileLinks(linksStr: string) {
    if (!linksStr) return null;
    // If you store them newline- or space-separated, adjust as needed
    const parts = linksStr
      .split(/\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return null;

    return (
      <ul className="space-y-1">
        {parts.map((link, idx) => (
          <li key={idx}>
            {/* 2) Make them clickable, open in new tab */}
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

              // Show more/less logic for the body
              const isExpanded = !!expandedRows[r.id];
              const fullBody = f['Announcement Body'] || '';
              const displayBody = isExpanded
                ? fullBody
                : truncateWords(fullBody, 80);

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
                      {displayBody}
                    </div>
                    {fullBody.split(/\s+/).length > 80 && (
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

/* ------------------------------------------------------------------------
   WebsiteUpdatesTable - Urgent items at top, in red
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
              // 4) If urgent => row text is dark red
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
                        onToggleCompleted(
                          'websiteUpdates',
                          r.id,
                          !!f.Completed
                        )
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
   SMS Requests Table - clickable S3 links, default hide completed
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