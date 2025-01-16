// app/admin/page.tsx
// This file is a Server Component by default in Next.js App Router.
// We'll force dynamic rendering so there's no static generation.

export const dynamic = 'force-dynamic';

// Optionally, you can export metadata here since it's a server file:
// export const metadata = {
//   title: 'Admin Dashboard',
// };

import AdminClient from './AdminClient'; // Client Component

export default function AdminPageServer() {
  // We do NOT import or call `useSession` here. 
  // We simply return the client component that handles session logic.
  return <AdminClient />;
}
