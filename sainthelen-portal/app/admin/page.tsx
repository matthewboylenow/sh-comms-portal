// app/admin/page.tsx
export const dynamic = 'force-dynamic';

import AdminClient from './AdminClient';

export default function AdminPageServer() {
  return <AdminClient />;
}