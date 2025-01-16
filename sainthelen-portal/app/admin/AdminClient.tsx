// app/admin/AdminClient.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

type AnnouncementRecord = {
  id: string;
  fields: {
    Name: string;
    Email: string;
    Ministry?: string;
    'Date of Event'?: string;
    'Time of Event'?: string;
    overrideStatus?: string;
  };
};

export default function AdminClient() {
  // 1) Access session client-side
  const { data: session, status } = useSession();

  // 2) State for fetched data
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  // 3) Fetch data once the user is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnnouncements();
    }
  }, [status]);

  async function fetchAnnouncements() {
    setLoadingData(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/fetchRequests');
      if (!res.ok) {
        throw new Error(`Error fetching data: ${res.status}`);
      }
      const data = await res.json();
      // Suppose we only use data.announcements here
      setAnnouncements(data.announcements);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error fetching announcements');
    } finally {
      setLoadingData(false);
    }
  }

  // 4) Update override status
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
      fetchAnnouncements();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    }
  }

  // 5) Manual summary trigger
  async function handleManualSummary() {
    try {
      const res = await fetch('/api/generateSummary', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to generate summary');
      }
      alert('Weekly summary email triggered!');
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  // AUTH STATES:
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

  // If authenticated:
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => signOut()}
        >
          Sign Out
        </button>
      </div>

      {errorMessage && (
        <div className="p-2 mb-4 text-red-800 bg-red-200 rounded">
          {errorMessage}
        </div>
      )}

      <button
        onClick={handleManualSummary}
        className="bg-green-600 text-white px-4 py-2 rounded mb-6 hover:bg-green-700"
      >
        Manually Run Weekly Summary
      </button>

      {loadingData ? (
        <p>Loading announcements...</p>
      ) : (
        <>
          {/* Announcements Table */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-2">Announcements</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Ministry</th>
                  <th className="border p-2">Date/Time</th>
                  <th className="border p-2">Override</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((ann) => (
                  <tr key={ann.id}>
                    <td className="border p-2">{ann.fields.Name}</td>
                    <td className="border p-2">{ann.fields.Email}</td>
                    <td className="border p-2">{ann.fields.Ministry}</td>
                    <td className="border p-2">
                      {ann.fields['Date of Event']} {ann.fields['Time of Event']}
                    </td>
                    <td className="border p-2">
                      <select
                        className="border rounded p-1"
                        value={ann.fields.overrideStatus || 'none'}
                        onChange={(e) =>
                          handleOverrideStatus(ann.id, e.target.value)
                        }
                      >
                        <option value="none">none</option>
                        <option value="forceExclude">forceExclude</option>
                        <option value="forceInclude">forceInclude</option>
                        <option value="defer">defer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}