import { Role } from '@prisma/client';

/**
 * Standard Granular System Permissions
 * Format: Resource:Action[:Scope] or '*'
 */
export type Permission =
  | '*'
  // Apartment
  | 'apartment:read'
  | 'apartment:create'
  | 'apartment:update'
  | 'apartment:delete'
  | 'apartment:read:self'
  // Resident
  | 'resident:read'
  | 'resident:create'
  | 'resident:update'
  | 'resident:delete'
  | 'resident:read:minimal'
  | 'resident:read:self'
  // Contract
  | 'contract:read'
  | 'contract:create'
  | 'contract:update'
  | 'contract:delete'
  | 'contract:read:self'
  // Fee & Billing (Financial)
  | 'fee:read'
  | 'fee:manage'
  | 'invoice:read'
  | 'invoice:generate'
  | 'invoice:create'
  | 'invoice:update'
  | 'invoice:cancel'
  | 'invoice:pay'
  | 'invoice:read:self'
  | 'invoice:pay:self'
  | 'payment:process'
  | 'payment:read'
  // Vehicle & Parking (Security / Access)
  | 'vehicle:read'
  | 'vehicle:create'
  | 'vehicle:update'
  | 'vehicle:delete'
  | 'vehicle:approve'
  | 'vehicle:reject'
  | 'vehicle:read:self'
  | 'vehicle:create:self'
  | 'parking_card:read'
  | 'parking_card:manage'
  | 'parking_card:read:self'
  | 'parking_access:read'
  | 'parking_access:log'
  | 'parking:read'
  | 'parking:manage'
  | 'parking:request'
  | 'parking:approve'
  | 'parking:operate'
  | 'parking:read:self'
  // Feedback & Maintenance (Technical / Operations)
  | 'feedback:read'
  | 'feedback:create'
  | 'feedback:assign'
  | 'feedback:process'
  | 'feedback:resolve'
  | 'feedback:close'
  | 'feedback:reject'
  | 'feedback:comment:internal'
  | 'feedback:comment:public'
  | 'feedback:rate'
  | 'feedback:read:assigned'
  | 'feedback:update:assigned'
  | 'feedback:read:self'
  | 'feedback:create:self'
  | 'asset:read'
  | 'maintenance:update'
  | 'maintenance:read'
  // Notification
  | 'notification:create'
  | 'notification:read'
  | 'notification:delete'
  | 'notification:read:self'
  // Visitor & Parcel & Facility
  | 'visitor:manage'
  | 'visitor:scan'
  | 'visitor:checkin'
  | 'visitor:create:self'
  | 'visitor:read:self'
  | 'parcel:manage'
  | 'parcel:receive'
  | 'parcel:collect'
  | 'parcel:read:self'
  | 'facility:manage'
  | 'facility:book:self'
  | 'facility:read'
  // Dashboard & Analytics
  | 'dashboard:management'
  | 'dashboard:technician'
  | 'dashboard:security'
  | 'dashboard:receptionist'
  | 'dashboard:resident'
  // Building (Property)
  | 'building:read'
  | 'building:create'
  | 'building:update'
  | 'building:delete'
  | 'building:assign_manager'
  // Manager Management
  | 'manager:read'
  | 'manager:create'
  | 'manager:update'
  | 'manager:delete'
  | 'manager:assign'
  // Staff Management
  | 'staff:read'
  | 'staff:create'
  | 'staff:update'
  | 'staff:delete'
  // Reports
  | 'report:read'
  | 'report:export'
  // Access Control & System Administration
  | 'access_control:manage'
  | 'audit:read'
  | 'system:manage'
  | 'system:users:manage';

/**
 * Mapping of Roles to Granted Permissions
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ['*'],

  MANAGER: [
    // Building (Scoped to assigned)
    'building:read',
    'building:update',
    // Apartment
    'apartment:read',
    'apartment:create',
    'apartment:update',
    'apartment:delete',
    // Resident
    'resident:read',
    'resident:create',
    'resident:update',
    'resident:delete',
    // Contract
    'contract:read',
    'contract:create',
    'contract:update',
    'contract:delete',
    // Staff (Scoped operational staff only)
    'staff:read',
    'staff:create',
    'staff:update',
    // Financial
    'fee:read',
    'fee:manage',
    'invoice:read',
    'invoice:generate',
    'invoice:create',
    'invoice:update',
    'invoice:cancel',
    'invoice:pay',
    'payment:process',
    'payment:read',
    // Vehicle & Parking
    'vehicle:read',
    'vehicle:create',
    'vehicle:update',
    'vehicle:delete',
    'vehicle:approve',
    'vehicle:reject',
    'parking_card:read',
    'parking_card:manage',
    'parking_access:read',
    'parking_access:log',
    'parking:read',
    'parking:manage',
    'parking:approve',
    'parking:operate',
    // Feedback & Maintenance
    'feedback:read',
    'feedback:create',
    'feedback:assign',
    'feedback:process',
    'feedback:resolve',
    'feedback:close',
    'feedback:reject',
    'feedback:comment:internal',
    'feedback:comment:public',
    'asset:read',
    'maintenance:read',
    'maintenance:update',
    // Notification
    'notification:create',
    'notification:read',
    'notification:delete',
    // Visitor & Parcel & Facility
    'visitor:manage',
    'visitor:scan',
    'visitor:checkin',
    'parcel:manage',
    'parcel:receive',
    'parcel:collect',
    'facility:manage',
    'facility:read',
    // Dashboard & Reports
    'dashboard:management',
    'report:read',
    'report:export',
  ],

  STAFF_TECHNICIAN: [
    'feedback:read',
    'feedback:read:assigned',
    'feedback:update:assigned',
    'feedback:process',
    'feedback:resolve',
    'feedback:comment:internal',
    'feedback:comment:public',
    'asset:read',
    'maintenance:read',
    'maintenance:update',
    'apartment:read',
    'notification:read',
    'dashboard:technician',
  ],

  STAFF_SECURITY: [
    'vehicle:read',
    'parking_card:read',
    'parking_access:read',
    'parking_access:log',
    'parking:read',
    'parking:operate',
    'visitor:manage',
    'visitor:scan',
    'visitor:checkin',
    'apartment:read',
    'notification:read',
    'dashboard:security',
  ],

  STAFF_RECEPTIONIST: [
    'parcel:manage',
    'parcel:receive',
    'parcel:collect',
    'resident:read:minimal',
    'apartment:read',
    'parking:read',
    'visitor:manage',
    'notification:read',
    'notification:create',
    'dashboard:receptionist',
  ],

  RESIDENT: [
    'apartment:read:self',
    'resident:read:self',
    'contract:read:self',
    'invoice:read:self',
    'invoice:pay:self',
    'vehicle:read:self',
    'vehicle:create:self',
    'parking_card:read:self',
    'parking:read',
    'parking:read:self',
    'parking:request',
    'feedback:read:self',
    'feedback:create:self',
    'feedback:comment:public',
    'feedback:rate',
    'notification:read:self',
    'visitor:create:self',
    'visitor:read:self',
    'parcel:read:self',
    'facility:book:self',
    'facility:read',
    'dashboard:resident',
  ],
};

/**
 * Check if a given role has a specific permission
 */
export function hasPermission(role: Role | string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const roleEnum = role as Role;
  const permissions = ROLE_PERMISSIONS[roleEnum];
  if (!permissions) return false;

  // Wildcard superuser check
  if (permissions.includes('*')) return true;

  return permissions.includes(permission);
}

/**
 * Check if a role has any of the listed permissions
 */
export function hasAnyPermission(
  role: Role | string | undefined | null,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Role category helper functions for clean business logic
 */
export const isSuperAdmin = (role: Role | string | undefined | null): boolean =>
  role === Role.ADMIN;

export const isManagementRole = (role: Role | string | undefined | null): boolean =>
  role === Role.ADMIN || role === Role.MANAGER;

export const isStaffRole = (role: Role | string | undefined | null): boolean =>
  role === Role.STAFF_TECHNICIAN ||
  role === Role.STAFF_SECURITY ||
  role === Role.STAFF_RECEPTIONIST;

export const isOperationalUser = (role: Role | string | undefined | null): boolean =>
  isManagementRole(role) || isStaffRole(role);

export const isResidentRole = (role: Role | string | undefined | null): boolean =>
  role === Role.RESIDENT;

export const isFinancialRole = (role: Role | string | undefined | null): boolean =>
  role === Role.ADMIN || role === Role.MANAGER;

export const isTechnicalRole = (role: Role | string | undefined | null): boolean =>
  role === Role.ADMIN || role === Role.MANAGER || role === Role.STAFF_TECHNICIAN;

export const isSecurityRole = (role: Role | string | undefined | null): boolean =>
  role === Role.ADMIN || role === Role.MANAGER || role === Role.STAFF_SECURITY;

export const isReceptionistRole = (role: Role | string | undefined | null): boolean =>
  role === Role.ADMIN || role === Role.MANAGER || role === Role.STAFF_RECEPTIONIST;

export const isAdmin = (role: Role | string | undefined | null): boolean =>
  role === Role.ADMIN || role === 'ADMIN';

export const isManager = (role: Role | string | undefined | null): boolean =>
  role === Role.MANAGER || role === 'MANAGER';

export const can = (role: Role | string | undefined | null, permission: Permission): boolean =>
  hasPermission(role, permission);
