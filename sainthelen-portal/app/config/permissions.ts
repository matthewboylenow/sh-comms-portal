// app/config/permissions.ts

import { getAirtableBase, TABLE_NAMES } from '../lib/airtable';

export type UserRole = 'admin' | 'adult_faith_approver';

export interface UserPermissions {
  role: UserRole;
  canAccessMainDashboard: boolean;
  canAccessApprovals: boolean;
  canAccessAnalytics: boolean;
  canAccessMinistries: boolean;
  canAccessCompleted: boolean;
  approvalScope?: string[]; // Which ministries they can approve
}

// Define user roles and permissions
const ROLE_PERMISSIONS: Record<UserRole, Omit<UserPermissions, 'role'>> = {
  admin: {
    canAccessMainDashboard: true,
    canAccessApprovals: true,
    canAccessAnalytics: true,
    canAccessMinistries: true,
    canAccessCompleted: true,
  },
  adult_faith_approver: {
    canAccessMainDashboard: false,
    canAccessApprovals: true,
    canAccessAnalytics: false,
    canAccessMinistries: false,
    canAccessCompleted: false,
    // approvalScope will be dynamically loaded from Airtable
  }
};

// Define which users have which roles
const USER_ROLES: Record<string, UserRole> = {
  'mboyle@sainthelen.org': 'admin',
  'ccolonna@sainthelen.org': 'adult_faith_approver',
  'mauricchio@sainthelen.org': 'adult_faith_approver'
};

export function getUserRole(email: string): UserRole {
  return USER_ROLES[email.toLowerCase()] || 'admin'; // Default to admin for existing users
}

export async function getUserPermissions(email: string): Promise<UserPermissions> {
  const role = getUserRole(email);
  const basePermissions = ROLE_PERMISSIONS[role];
  
  // For adult_faith_approver, dynamically load approval scope from Airtable
  if (role === 'adult_faith_approver') {
    const approvalScope = await getApprovalRequiredMinistries();
    return {
      role,
      ...basePermissions,
      approvalScope
    };
  }
  
  return {
    role,
    ...basePermissions
  };
}

export async function canUserAccessApprovals(email: string): Promise<boolean> {
  const permissions = await getUserPermissions(email);
  return permissions.canAccessApprovals;
}

export async function canUserAccessMainDashboard(email: string): Promise<boolean> {
  const permissions = await getUserPermissions(email);
  return permissions.canAccessMainDashboard;
}

export async function getUserApprovalScope(email: string): Promise<string[] | undefined> {
  const permissions = await getUserPermissions(email);
  return permissions.approvalScope;
}

// Helper function to get ministries that require approval from Airtable
export async function getApprovalRequiredMinistries(): Promise<string[]> {
  try {
    const base = getAirtableBase();
    const records = await base(TABLE_NAMES.MINISTRIES)
      .select({
        filterByFormula: 'AND({Requires Approval} = TRUE(), {Active} = TRUE())',
        fields: ['Name']
      })
      .all();
    
    return records.map(record => record.fields.Name as string).filter(Boolean);
  } catch (error) {
    console.error('Error fetching approval-required ministries:', error);
    // Fallback to empty array if Airtable is not available
    return [];
  }
}