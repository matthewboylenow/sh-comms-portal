// app/admin/AdminClient.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

// For easier reference
type TableName = 'announcements' | 'websiteUpdates' | 'smsRequests';

type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

export default function AdminClient() {
  const { data: session, status } = useSession();

  // store the data for all 3 tables
  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  // optionally a hideCompleted toggle
  const [hideCompleted, setHideCompleted] = useState(false);

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

  // Toggle "Completed" in Airtable + local state
  async function handleCompleted(
    tableName: TableName,
    recordId: string,
    currentValue: boolean
  ) {
    // 1) Immediate local update
    if (tableName === 'announcements') {
      setAnnouncements((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? { ...r, fields: { ...r.fields, Completed: !currentValue } }
            : r
        )
      );
    } else if (tableName === 'websiteUpdates') {
      setWebsiteUpdates((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? { ...r, fields: { ...r.fields, Completed: !currentValue } }
            : r
        )
      );
    } else if (tableName === 'smsRequests') {
      setSmsRequests((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? { ...r, fields: { ...r.fields, Completed: !currentValue } }
            : r
        )
      );
    }

    // 2) Send request to update Airtable
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

  // Example override status (only for announcements)
  async function handleOverrideStatus(
    tableName: TableName,
    recordId: string,
    newStatus: string
  ) {
    try {
      // If not announcements, skip
      if (tableName !== 'announcements') return;
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

  // Manual Trigger for Weekly Summary
  async function handleManualSummary() {
    try {
      const res = await fetch('/api/generateSummary', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate summary');
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
    // Use text-gray-900 in light mode and text-gray-200 (or white) in dark mode
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
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={doSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-2 mb-4 text-red-800 bg-red-200 rounded">
          {errorMessage}
        </div>
      )}

      {/* Hide Completed Toggle */}
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
          {/* Announcements */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-2">Announcements</h3>
            <RequestTable
              tableName="announcements"
              records={announcements}
              hideCompleted={hideCompleted}
              onToggleCompleted={handleCompleted}
              onOverrideStatus={handleOverrideStatus}
              showOverride={true}
            />
          </section>

          {/* Website Updates */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-2">Website Updates</h3>
            <RequestTable
              tableName="websiteUpdates"
              records={websiteUpdates}
              hideCompleted={hideCompleted}
              onToggleCompleted={handleCompleted}
              onOverrideStatus={handleOverrideStatus}
              showOverride={false}
            />
          </section>

          {/* SMS Requests */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-2">SMS Requests</h3>
            <RequestTable
              tableName="smsRequests"
              records={smsRequests}
              hideCompleted={hideCompleted}
              onToggleCompleted={handleCompleted}
              onOverrideStatus={handleOverrideStatus}
              showOverride={false}
            />
          </section>
        </>
      )}
    </div>
  );
}

/** 
 * Reusable table for any request type, ensuring the text is visible in light mode.
 */
type RequestTableProps = {
  tableName: TableName;
  records: AdminRecord[];
  hideCompleted: boolean;
  onToggleCompleted: (
    tableName: TableName,
    recordId: string,
    currentValue: boolean
  ) => void;
  onOverrideStatus: (tableName: TableName, recordId: string, newStatus: string) => void;
  showOverride: boolean;
};

function RequestTable({
  tableName,
  records,
  hideCompleted,
  onToggleCompleted,
  onOverrideStatus,
  showOverride,
}: RequestTableProps) {
  const displayed = hideCompleted
    ? records.filter((r) => !r.fields.Completed)
    : records;

  if (!displayed.length) {
    return <p className="text-sm italic">No records found.</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        {/* Make the header row easily readable in light mode */}
        <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <th className="border border-gray-300 dark:border-gray-600 p-2">Name</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Email</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Ministry</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Date/Time</th>
          {showOverride && (
            <th className="border border-gray-300 dark:border-gray-600 p-2">
              Override
            </th>
          )}
          <th className="border border-gray-300 dark:border-gray-600 p-2">
            Completed?
          </th>
        </tr>
      </thead>
      <tbody>
        {displayed.map((rec) => {
          const f = rec.fields;
          return (
            <tr key={rec.id}>
              {/* We'll set a border & text color for each cell 
                  so it's readable in light mode */}
              <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                {f.Name || ''}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                {f.Email || ''}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                {f.Ministry || ''}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                {f['Date of Event'] || ''} {f['Time of Event'] || ''}
              </td>
              {showOverride && (
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-gray-100">
                  <select
                    className="border rounded p-1 bg-white dark:bg-gray-800 text-black dark:text-gray-200"
                    value={f.overrideStatus || 'none'}
                    onChange={(e) =>
                      onOverrideStatus(tableName, rec.id, e.target.value)
                    }
                  >
                    <option value="none">none</option>
                    <option value="forceExclude">forceExclude</option>
                    <option value="forceInclude">forceInclude</option>
                    <option value="defer">defer</option>
                  </select>
                </td>
              )}
              <td className="border border-gray-300 dark:border-gray-600 p-2 text-center text-black dark:text-gray-100">
                <input
                  type="checkbox"
                  checked={f.Completed || false}
                  onChange={() =>
                    onToggleCompleted(tableName, rec.id, f.Completed || false)
                  }
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
