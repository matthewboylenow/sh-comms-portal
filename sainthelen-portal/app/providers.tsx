// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // We wrap the entire subtree in SessionProvider so
  // any component can call useSession() without error.
  return <SessionProvider>{children}</SessionProvider>;
}
