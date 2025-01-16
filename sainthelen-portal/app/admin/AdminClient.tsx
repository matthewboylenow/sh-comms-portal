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

  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);

  // store which items are “summarize: true”
  // Key: recordId, Value: boolean
  const [summarizeMap, setSummarizeMap] = useState<Record<string, boolean>>({});

  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  // Show the Claude summary after we get it
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllRequests();
    }
  }, [status]);

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

  // Completed logic - same as before
  async function handleCompleted(tableName: TableName, recordId: string, currentValue: boolean) {
    // remove row from UI
    if (tableName === 'announcements') {
      setAnnouncements((prev) => prev.filter((r) => r.id !== recordId));
    } else if (tableName === 'websiteUpdates') {
      setWebsiteUpdates((prev) => prev.filter((r) => r.id !== recordId));
    } else {
      setSmsRequests((prev) => prev.filter((r) => r.id !== recordId));
    }

    // patch Airtable
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

  // Announcements override status
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

  // When user toggles "Summarize?" box
  function handleToggleSummarize(recordId: string, isChecked: boolean) {
    setSummarizeMap((prev) => ({
      ...prev,
      [recordId]: isChecked,
    }));
  }

  // Summarize Selected => call our new route
  async function handleSummarizeSelected() {
    // collect all record IDs that have summarizeMap[id] = true
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
      alert('Successfully summarized selected items! (Check your email too)');
    } catch (err: any) {
      console.error(err);
      alert('Error summarizing items: ' + (err as Error).message);
    }
  }

  // For Weekly Summary (if you keep it or remove it)
  async function handleManualSummary() {
    try {
      const res = await fetch('/api/generateSummary', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate summary');
      const data = await res.json();
      setSummary(data.summaryText || 'No summary returned.');
      alert('Weekly summary triggered successfully!');
    } catch (err: any) {
      console.error(err);
      alert(`Error triggering summary: ${err.message}`);
    }
  }

  function doSignOut() {
    signOut();
  }

  if (status === 'loading') {
    return <div className="p-4">Loading session...</div>;
  }
  if (status === 'unauthenticated') {
    return (
      <div className="p-4">
        <p>You must be signed in to view admin dashboard.</p>
        <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => signIn('azure-ad')}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 text-gray-900 dark:text-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <div className="flex items-center gap-4">
          {/* If you keep the old manual summary approach */}
          <button
            onClick={handleManualSummary}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Manually Run Weekly Summary (Old)
          </button>

          {/* New approach: Summarize the user-selected items */}
          <button
            onClick={handleSummarizeSelected}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Summarize Selected
          </button>

          {/* Link to Completed */}
          <a
            href="/admin/completed"
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors"
          >
            View Completed Items
          </a>

          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={doSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-2 mb-4 text-red-800 bg-red-200 rounded">{errorMessage}</div>
      )}

      {summary && (
        <div className="mb-6 p-4 rounded bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">Claude Summary</h3>
          <pre className="whitespace-pre-wrap text-black dark:text-gray-100">{summary}</pre>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2">
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
        <p>Loading data...</p>
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
          <SMSRequestsTable
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

/* 3 Tables with a “Summarize?” checkbox at the beginning. 
   For each row, we do an <input type=checkbox> that calls handleToggleSummarize. 
   We also maintain the Completed logic as before.
*/

// ANNOUNCEMENTS
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
  const displayed = hideCompleted ? records.filter((r) => !r.fields.Completed) : records;
  if (!displayed.length) return <></>;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold mb-2">Announcements</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <th className="border p-2">Summarize?</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Ministry</th>
            <th className="border p-2">Date/Time</th>
            <th className="border p-2">Promotion Start</th>
            <th className="border p-2">Platforms</th>
            <th className="border p-2">Announcement Body</th>
            <th className="border p-2">File Links</th>
            <th className="border p-2">Override</th>
            <th className="border p-2">Completed?</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((r) => {
            const f = r.fields;
            const isSummarize = summarizeMap[r.id] || false;
            return (
              <tr key={r.id}>
                {/* Summarize? */}
                <td className="border p-2 text-center">
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
                <td className="border p-2 text-black dark:text-gray-100">{f.Name || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100">{f.Ministry || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100">
                  {f['Date of Event'] || ''} {f['Time of Event'] || ''}
                </td>
                <td className="border p-2 text-black dark:text-gray-100">
                  {f['Promotion Start Date'] || ''}
                </td>
                <td className="border p-2 text-black dark:text-gray-100">
                  {(f.Platforms || []).join(', ')}
                </td>
                <td className="border p-2 text-black dark:text-gray-100 max-w-md">
                  {f['Announcement Body'] || ''}
                </td>
                <td className="border p-2 text-black dark:text-gray-100">{f['File Links'] || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100">
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
                <td className="border p-2 text-center text-black dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={!!f.Completed}
                    onChange={() => onToggleCompleted('announcements', r.id, !!f.Completed)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

// WEBSITE UPDATES
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
  if (!displayed.length) return <></>;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold mb-2">Website Updates</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <th className="border p-2">Summarize?</th>
            <th className="border p-2">Page to Update</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Sign-Up URL</th>
            <th className="border p-2">File Links</th>
            <th className="border p-2">Completed?</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((r) => {
            const f = r.fields;
            const isSummarize = summarizeMap[r.id] || false;
            return (
              <tr key={r.id}>
                <td className="border p-2 text-center">
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
                <td className="border p-2 text-black dark:text-gray-100">{f['Page to Update'] || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100 max-w-md">{f.Description || ''}</td>
                <td className="border p-2 text-blue-600 dark:text-blue-300 underline">
                  {f['Sign-Up URL'] || ''}
                </td>
                <td className="border p-2 text-black dark:text-gray-100">{f['File Links'] || ''}</td>
                <td className="border p-2 text-center text-black dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={!!f.Completed}
                    onChange={() => onToggleCompleted('websiteUpdates', r.id, !!f.Completed)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

// SMS REQUESTS
function SMSRequestsTable({
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
  if (!displayed.length) return <></>;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold mb-2">SMS Requests</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <th className="border p-2">Summarize?</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Ministry</th>
            <th className="border p-2">Requested Date</th>
            <th className="border p-2">SMS Message</th>
            <th className="border p-2">Additional Info</th>
            <th className="border p-2">Completed?</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((r) => {
            const f = r.fields;
            const isSummarize = summarizeMap[r.id] || false;
            return (
              <tr key={r.id}>
                <td className="border p-2 text-center">
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
                <td className="border p-2 text-black dark:text-gray-100">{f.Name || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100">{f.Ministry || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100">{f['Requested Date'] || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100 max-w-md">{f['SMS Message'] || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100 max-w-md">{f['Additional Info'] || ''}</td>
                <td className="border p-2 text-center text-black dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={!!f.Completed}
                    onChange={() => onToggleCompleted('smsRequests', r.id, !!f.Completed)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
