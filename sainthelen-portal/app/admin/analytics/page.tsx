// app/admin/analytics/page.tsx
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import AnalyticsClient from './AnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Saint Helen Communications Portal',
  description: 'View communication request statistics and analytics.',
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}