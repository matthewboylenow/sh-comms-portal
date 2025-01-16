// app/admin/completed/CompletedClient.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

type TableName = 'announcements' | 'websiteUpdates' | 'smsRequests';
type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

export default function CompletedClient() {
  const { data: session, status } = useSession();

  const [announcements, setAnnouncements] = useState<AdminRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<AdminRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<AdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCompleted();
    }
  }, [status]);

  async function fetchCompleted() {
    setLoadingData(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/fetchCompletedRequests');
      if (!res.ok) throw new Error(`Error fetching completed: ${res.status}`);
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

  // If you want to un-check completed items:
  async function handleUncheck(tableName: TableName, recordId: string) {
    // remove from local state
    if (tableName === 'announcements') {
      setAnnouncements((prev) => prev.filter((r) => r.id !== recordId));
    } else if (tableName === 'websiteUpdates') {
      setWebsiteUpdates((prev) => prev.filter((r) => r.id !== recordId));
    } else {
      setSmsRequests((prev) => prev.filter((r) => r.id !== recordId));
    }
    // patch in Airtable
    try {
      const res = await fetch('/api/admin/markCompleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: tableName,
          recordId,
          completed: false, // re-open
        }),
      });
      if (!res.ok) throw new Error('Failed to uncheck Completed');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
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
        <p>You must be signed in to view completed items.</p>
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
        <h2 className="text-2xl font-bold">Completed Items</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={doSignOut}>
          Sign Out
        </button>
      </div>

      {errorMessage && (
        <div className="p-2 mb-4 text-red-800 bg-red-200 rounded">{errorMessage}</div>
      )}

      {loadingData ? (
        <p>Loading completed items...</p>
      ) : (
        <>
          <AnnouncementsCompleted announcements={announcements} onUncheck={handleUncheck} />
          <WebsiteUpdatesCompleted websiteUpdates={websiteUpdates} onUncheck={handleUncheck} />
          <SMSRequestsCompleted smsRequests={smsRequests} onUncheck={handleUncheck} />
        </>
      )}
    </div>
  );
}

/* 
  Announcements: show same columns 
  but the Completed? box is checked => uncheck to re-open
*/
function AnnouncementsCompleted({
  announcements,
  onUncheck,
}: {
  announcements: AdminRecord[];
  onUncheck: (tableName: TableName, recordId: string) => void;
}) {
  if (!announcements.length) return <></>;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold mb-2">Completed Announcements</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Ministry</th>
            <th className="border p-2">Date/Time</th>
            <th className="border p-2">Promotion Start</th>
            <th className="border p-2">Platforms</th>
            <th className="border p-2">Body</th>
            <th className="border p-2">Files</th>
            <th className="border p-2">Completed?</th>
          </tr>
        </thead>
        <tbody>
          {announcements.map((r) => {
            const f = r.fields;
            // optionally define your convertTo12Hour again here or share from a utility file
            return (
              <tr key={r.id}>
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
                <td className="border p-2 text-black dark:text-gray-100 max-w-sm">
                  {f['Announcement Body'] || ''}
                </td>
                <td className="border p-2 text-black dark:text-gray-100">
                  {f['File Links'] || ''}
                </td>
                <td className="border p-2 text-center text-black dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => onUncheck('announcements', r.id)}
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

/* 
   Website Updates
*/
function WebsiteUpdatesCompleted({
  websiteUpdates,
  onUncheck,
}: {
  websiteUpdates: AdminRecord[];
  onUncheck: (tableName: TableName, recordId: string) => void;
}) {
  if (!websiteUpdates.length) return <></>;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold mb-2">Completed Website Updates</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <th className="border p-2">Page to Update</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Sign-Up URL</th>
            <th className="border p-2">Files</th>
            <th className="border p-2">Completed?</th>
          </tr>
        </thead>
        <tbody>
          {websiteUpdates.map((r) => {
            const f = r.fields;
            return (
              <tr key={r.id}>
                <td className="border p-2 text-black dark:text-gray-100">
                  {f['Page to Update'] || ''}
                </td>
                <td className="border p-2 text-black dark:text-gray-100 max-w-sm">
                  {f.Description || ''}
                </td>
                <td className="border p-2 text-blue-600 dark:text-blue-300 underline">
                  {f['Sign-Up URL'] || ''}
                </td>
                <td className="border p-2 text-black dark:text-gray-100">
                  {f['File Links'] || ''}
                </td>
                <td className="border p-2 text-center text-black dark:text-gray-100">
                  <input type="checkbox" checked={true} onChange={() => onUncheck('websiteUpdates', r.id)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/* 
   SMS Requests
*/
function SMSRequestsCompleted({
  smsRequests,
  onUncheck,
}: {
  smsRequests: AdminRecord[];
  onUncheck: (tableName: TableName, recordId: string) => void;
}) {
  if (!smsRequests.length) return <></>;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold mb-2">Completed SMS Requests</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Ministry</th>
            <th className="border p-2">Requested Date</th>
            <th className="border p-2">SMS Message</th>
            <th className="border p-2">Additional Info</th>
            <th className="border p-2">Completed?</th>
          </tr>
        </thead>
        <tbody>
          {smsRequests.map((r) => {
            const f = r.fields;
            return (
              <tr key={r.id}>
                <td className="border p-2 text-black dark:text-gray-100">{f.Name || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100">{f.Ministry || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100">{f['Requested Date'] || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100 max-w-sm">{f['SMS Message'] || ''}</td>
                <td className="border p-2 text-black dark:text-gray-100 max-w-sm">{f['Additional Info'] || ''}</td>
                <td className="border p-2 text-center text-black dark:text-gray-100">
                  <input type="checkbox" checked={true} onChange={() => onUncheck('smsRequests', r.id)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
