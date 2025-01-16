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

  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  // For showing the weekly summary text
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

  // Mark row as completed => remove from UI + call markCompleted
  async function handleCompleted(tableName: TableName, recordId: string, currentValue: boolean) {
    // remove row from local UI
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

  // overrideStatus only relevant for announcements
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
        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => signIn('azure-ad')}
        >
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
          <button
            onClick={handleManualSummary}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Manually Run Weekly Summary
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={doSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-2 mb-4 text-red-800 bg-red-200 rounded">{errorMessage}</div>
      )}

      {/* If we have a summary from Claude, display it. */}
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
            onOverrideStatus={handleOverrideStatus}
            onToggleCompleted={handleCompleted}
          />
          <WebsiteUpdatesTable
            records={websiteUpdates}
            hideCompleted={hideCompleted}
            onToggleCompleted={handleCompleted}
          />
          <SmsRequestsTable
            records={smsRequests}
            hideCompleted={hideCompleted}
            onToggleCompleted={handleCompleted}
          />
        </>
      )}
    </div>
  );
}

/* -----------------------------------------------------------------------
   Announcements Table
   Columns:
   - Name
   - Ministry
   - Date/Time of Event (Time in 12h AM/PM)
   - Promotion Start Date
   - Platforms
   - Announcement Body
   - File Links
   - Completed?
   - overrideStatus (select)
------------------------------------------------------------------------ */
function AnnouncementsTable({
  records,
  hideCompleted,
  onOverrideStatus,
  onToggleCompleted,
}: {
  records: AdminRecord[];
  hideCompleted: boolean;
  onOverrideStatus: (recordId: string, newStatus: string) => void;
  onToggleCompleted: (tableName: 'announcements', recordId: string, currentValue: boolean) => void;
}) {
  const displayed = hideCompleted ? records.filter((r) => !r.fields.Completed) : records;
  if (!displayed.length) return <></>;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold mb-2">Announcements</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <th className="border border-gray-300 dark:border-gray-600 p-2">Name</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Ministry</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Date/Time</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">
              Promotion Start
            </th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Platforms</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Body</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Files</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Override</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Completed?</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((rec) => {
            const f = rec.fields;
            const dateStr = f['Date of Event'] || '';
            const timeStr = convertTo12Hour(f['Time of Event'] || '');
            const promoDate = f['Promotion Start Date'] || '';
            return (
              <tr key={rec.id}>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {f.Name || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {f.Ministry || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {dateStr} {timeStr}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {promoDate}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {(f.Platforms || []).join(', ')}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100 max-w-sm">
                  {f['Announcement Body'] || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {f['File Links'] || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  <select
                    className="border rounded p-1 bg-white dark:bg-gray-800 text-black dark:text-gray-200"
                    value={f.overrideStatus || 'none'}
                    onChange={(e) => onOverrideStatus(rec.id, e.target.value)}
                  >
                    <option value="none">none</option>
                    <option value="forceExclude">forceExclude</option>
                    <option value="forceInclude">forceInclude</option>
                    <option value="defer">defer</option>
                  </select>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-black dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={!!f.Completed}
                    onChange={() =>
                      onToggleCompleted('announcements', rec.id, !!f.Completed)
                    }
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

/* -----------------------------------------------------------------------
   Website Updates Table
   Columns:
   - Page to Update
   - Description
   - Sign-Up URL
   - File Links
   - Completed?
------------------------------------------------------------------------ */
function WebsiteUpdatesTable({
  records,
  hideCompleted,
  onToggleCompleted,
}: {
  records: AdminRecord[];
  hideCompleted: boolean;
  onToggleCompleted: (tableName: 'websiteUpdates', recordId: string, currentValue: boolean) => void;
}) {
  const displayed = hideCompleted ? records.filter((r) => !r.fields.Completed) : records;
  if (!displayed.length) return <></>;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold mb-2">Website Updates</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <th className="border border-gray-300 dark:border-gray-600 p-2">Page to Update</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Description</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Sign-Up URL</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Files</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Completed?</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((rec) => {
            const f = rec.fields;
            return (
              <tr key={rec.id}>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {f['Page to Update'] || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100 max-w-sm">
                  {f.Description || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-blue-600 dark:text-blue-300 underline">
                  {f['Sign-Up URL'] || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {f['File Links'] || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-black dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={!!f.Completed}
                    onChange={() =>
                      onToggleCompleted('websiteUpdates', rec.id, !!f.Completed)
                    }
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

/* -----------------------------------------------------------------------
   SMS Requests Table
   Columns:
   - Name
   - Ministry
   - Requested Date
   - SMS Message
   - Additional Info
   - Completed?
------------------------------------------------------------------------ */
function SmsRequestsTable({
  records,
  hideCompleted,
  onToggleCompleted,
}: {
  records: AdminRecord[];
  hideCompleted: boolean;
  onToggleCompleted: (tableName: 'smsRequests', recordId: string, currentValue: boolean) => void;
}) {
  const displayed = hideCompleted ? records.filter((r) => !r.fields.Completed) : records;
  if (!displayed.length) return <></>;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold mb-2">SMS Requests</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <th className="border border-gray-300 dark:border-gray-600 p-2">Name</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Ministry</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Requested Date</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">SMS Message</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Additional Info</th>
            <th className="border border-gray-300 dark:border-gray-600 p-2">Completed?</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((rec) => {
            const f = rec.fields;
            return (
              <tr key={rec.id}>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {f.Name || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {f.Ministry || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  {f['Requested Date'] || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100 max-w-sm">
                  {f['SMS Message'] || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100 max-w-sm">
                  {f['Additional Info'] || ''}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-black dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={!!f.Completed}
                    onChange={() => onToggleCompleted('smsRequests', rec.id, !!f.Completed)}
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

/**
 * A quick helper to convert 24h strings to 12h AM/PM.
 * e.g. "14:30" => "2:30 PM".
 */
function convertTo12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr || '0', 10);

  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) {
    hour = 12; // 00:xx => 12 AM
  } else if (hour > 12) {
    hour = hour - 12;
  }
  return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}
