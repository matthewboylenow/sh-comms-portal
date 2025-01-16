// app/admin/completed/page.tsx
export const dynamic = 'force-dynamic';

import CompletedClient from './CompletedClient';

export default function CompletedPageServer() {
  return <CompletedClient />;
}
