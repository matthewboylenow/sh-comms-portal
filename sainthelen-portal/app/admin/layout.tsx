// app/admin/layout.tsx
// Every admin page shares one load of the request tables (sidebar counts,
// the Inbox, the panel), so the provider lives here rather than per page.
import { RequestsProvider } from '../context/RequestsContext';

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <RequestsProvider>{children}</RequestsProvider>;
}
