// app/lib/adminAuth.ts

import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getUserPermissions } from '../config/permissions';

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  const permissions = await getUserPermissions(session.user.email);
  
  return {
    ...session,
    user: {
      ...session.user,
      permissions
    }
  };
}

export async function requireAdminAccess() {
  const session = await getAdminSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  // For now, anyone with a session can access admin areas
  // We'll control specific access within components
  return session;
}

export async function requireApprovalAccess() {
  const session = await getAdminSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  if (!session.user.permissions.canAccessApprovals) {
    throw new Error('Insufficient permissions');
  }
  
  return session;
}