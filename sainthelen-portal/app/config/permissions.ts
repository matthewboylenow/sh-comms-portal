// app/config/permissions.ts

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
    approvalScope: [
      'Adult Faith Formation',
      'Adult Discipleship Retreat',
      'Bible Study',
      'RCIA',
      'Theology on Tap'
    ]
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

export function getUserPermissions(email: string): UserPermissions {
  const role = getUserRole(email);
  return {
    role,
    ...ROLE_PERMISSIONS[role]
  };
}

export function canUserAccessApprovals(email: string): boolean {
  return getUserPermissions(email).canAccessApprovals;
}

export function canUserAccessMainDashboard(email: string): boolean {
  return getUserPermissions(email).canAccessMainDashboard;
}

export function getUserApprovalScope(email: string): string[] | undefined {
  return getUserPermissions(email).approvalScope;
}