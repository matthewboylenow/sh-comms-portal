'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { UserPermissions } from '../config/permissions';

export function usePermissions() {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (!session?.user?.email) {
        setPermissions(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/permissions');
        if (response.ok) {
          const data = await response.json();
          setPermissions(data.permissions);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [session?.user?.email]);

  return { permissions, loading };
}