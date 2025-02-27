// app/admin/page.tsx
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Saint Helen Communications Portal',
  description: 'Manage announcements, website updates and SMS requests for Saint Helen Parish.',
};

export default function AdminPageServer() {
  return <AdminClient />;
}