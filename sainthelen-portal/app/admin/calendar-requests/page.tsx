// app/admin/calendar-requests/page.tsx
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import CalendarRequestsClient from './CalendarRequestsClient';

export const metadata: Metadata = {
  title: 'Calendar Requests | Saint Helen Communications Portal',
  description: 'View announcement requests that have been flagged for the events calendar.',
};

export default function CalendarRequestsPageServer() {
  return <CalendarRequestsClient />;
}
