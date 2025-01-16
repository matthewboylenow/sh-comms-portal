// app/admin/AdminClient.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

type TableName = 'announcements' | 'websiteUpdates' | 'smsRequests';
type AdminRecord = { id: string; fields: Record<string, any> };

export default function AdminClient() {
  const { data: session, status } = useSession();

  // Table states
  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);

  // UI states
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  // *** New: we store the summary text returned from generateSummary
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

  // Completed logic
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

  // Override logic
  async function handleOverrideStatus(tableName: TableName, recordId: string, newStatus: string) {
    if (tableName !== 'announcements') return;
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

  // *** New: We store summary from route
  async function handleManualSummary() {
    try {
      const res = await fetch('/api/generateSummary', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to generate summary');
      }
      const data = await res.json();
      // Display the summary text in the UI
      setSummary(data.summaryText || 'No summary returned.');
      alert('Weekly summary triggered successfully! (Check your email too)');
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

      {/* If we have a summary from Claude, display it below */}
      {summary && (
        <div className="mb-6 p-4 rounded bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
            Claude Summary
          </h3>
          <pre className="whitespace-pre-wrap text-black dark:text-gray-100">
            {summary}
          </pre>
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

type RequestTableProps = {
  tableName: TableName;
  records: AdminRecord[];
  hideCompleted: boolean;
  onToggleCompleted: (tableName: TableName, recordId: string, currentValue: boolean) => void;
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
        <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <th className="border border-gray-300 dark:border-gray-600 p-2">Name</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Email</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Ministry</th>
          <th className="border border-gray-300 dark:border-gray-600 p-2">Date/Time</th>
          {showOverride && (
            <th className="border border-gray-300 dark:border-gray-600 p-2">Override</th>
          )}
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
                    onChange={(e) => onOverrideStatus(tableName, rec.id, e.target.value)}
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
                  checked={!!f.Completed}
                  onChange={() => onToggleCompleted(tableName, rec.id, !!f.Completed)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
