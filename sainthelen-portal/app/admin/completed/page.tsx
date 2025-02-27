// app/admin/completed/page.tsx
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import CompletedClient from './CompletedClient';

export const metadata: Metadata = {
  title: 'Completed Items | Saint Helen Communications Portal',
  description: 'View and manage completed announcements, website updates and SMS requests.',
};

export default function CompletedPageServer() {
  return <CompletedClient />;
}