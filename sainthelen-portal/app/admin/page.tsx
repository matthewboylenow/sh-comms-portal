// app/admin/page.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

// We'll define some types for table data
type AnnouncementRecord = {
  id: string;
  fields: {
    Name: string;
    Email: string;
    Ministry: string;
    'Date of Event': string;
    'Time of Event': string;
    'Promotion Start Date': string;
    Platforms: string[];
    'Announcement Body': string;
    'Add to Events Calendar': string;
    'File Links': string;
    overrideStatus?: string;
  };
};

type WebsiteUpdateRecord = {
  id: string;
  fields: {
    Name: string;
    Email: string;
    Urgent: string;
    'Page to Update': string;
    Description: string;
    'Sign-Up URL': string;
    'File Links': string;
  };
};

type SMSRequestRecord = {
  id: string;
  fields: {
    Name: string;
    Email: string;
    Ministry: string;
    'SMS Message': string;
    'Requested Date': string;
    'Additional Info': string;
    'File Links': string;
  };
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [websiteUpdates, setWebsiteUpdates] = useState<WebsiteUpdateRecord[]>([]);
  const [smsRequests, setSmsRequests] = useState<SMSRequestRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch the data once the user is logged in
      fetchData();
    }
  }, [status]);

  async function fetchData() {
    try {
      setLoadingData(true);
      setErrorMessage('');

      const res = await fetch('/api/admin/fetchRequests');
      if (!res.ok) {
        throw new Error(`Failed to fetch requests: ${res.status}`);
      }
      const data = await res.json();
      setAnnouncements(data.announcements);
      setWebsiteUpdates(data.websiteUpdates);
      setSmsRequests(data.smsRequests);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error fetching data');
    } finally {
      setLoadingData(false);
    }
  }

  // Handle override status update
  async function handleOverrideStatus(id: string, newStatus: string) {
    try {
      const res = await fetch('/api/admin/updateOverrideStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: id, overrideStatus: newStatus }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update override status for ${id}`);
      }
      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    }
  }

  // Handle manual weekly summary trigger
  async function handleManualSummary() {
    try {
      const res = await fetch('/api/generateSummary', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to generate summary email');
      }
      alert('Weekly summary email triggered!');
    } catch (err: any) {
      console.error(err);
      alert('Error triggering summary: ' + err.message);
    }
  }

  if (status === 'loading') {
    return <div className="p-4">Loading session...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-4">
        <p>You must be signed in to view admin dashboard.</p>
        <button
          className="mt-2 bg-sh-primary text-white px-4 py-2 rounded"
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
          className="bg-sh-primary text-white px-4 py-2 rounded"
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

      {loadingData ? (
        <p>Loading data...</p>
      ) : (
        <>
          <button
            onClick={handleManualSummary}
            className="bg-green-600 text-white px-4 py-2 rounded mb-6 hover:bg-green-700"
          >
            Manually Run Weekly Summary
          </button>

          {/* Announcements Section */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-2">Announcements</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Ministry</th>
                  <th className="border p-2">Date/Time</th>
                  <th className="border p-2">Status Override</th>
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
                        value={ann.fields.overrideStatus || 'none'}
                        onChange={(e) =>
                          handleOverrideStatus(ann.id, e.target.value)
                        }
                        className="border rounded p-1"
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

          {/* Website Updates Section */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-2">Website Updates</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Urgent</th>
                  <th className="border p-2">Page to Update</th>
                </tr>
              </thead>
              <tbody>
                {websiteUpdates.map((wu) => (
                  <tr key={wu.id}>
                    <td className="border p-2">{wu.fields.Name}</td>
                    <td className="border p-2">{wu.fields.Email}</td>
                    <td className="border p-2">{wu.fields.Urgent}</td>
                    <td className="border p-2">{wu.fields['Page to Update']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* SMS Requests Section */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-2">SMS Requests</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Ministry</th>
                  <th className="border p-2">SMS Message</th>
                </tr>
              </thead>
              <tbody>
                {smsRequests.map((sms) => (
                  <tr key={sms.id}>
                    <td className="border p-2">{sms.fields.Name}</td>
                    <td className="border p-2">{sms.fields.Email}</td>
                    <td className="border p-2">{sms.fields.Ministry}</td>
                    <td className="border p-2">{sms.fields['SMS Message']}</td>
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
