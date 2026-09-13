import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Role } from '@prisma/client';
import {
  hasPermission,
  isFinancialRole,
  isTechnicalRole,
  isSecurityRole,
  isReceptionistRole,
  isManagementRole,
  isStaffRole,
} from '../src/lib/permissions';
import {
  authorizeInvoiceAccess,
  authorizeFeedbackAccess,
  authorizeVehicleAccess,
  authorizeContractAccess,
  SessionUser,
} from '../src/lib/authorization';

describe('Role-Based Access Control (RBAC) & Permission Abstraction Tests', () => {
  describe('1. Role Hierarchy & Classification Helpers', () => {
    it('MUST correctly identify management roles', () => {
      assert.equal(isManagementRole(Role.ADMIN), true);
      assert.equal(isManagementRole(Role.MANAGER), true);
      assert.equal(isManagementRole(Role.STAFF_TECHNICIAN), false);
      assert.equal(isManagementRole(Role.STAFF_SECURITY), false);
      assert.equal(isManagementRole(Role.STAFF_RECEPTIONIST), false);
      assert.equal(isManagementRole(Role.RESIDENT), false);
    });

    it('MUST correctly identify operational staff roles', () => {
      assert.equal(isStaffRole(Role.STAFF_TECHNICIAN), true);
      assert.equal(isStaffRole(Role.STAFF_SECURITY), true);
      assert.equal(isStaffRole(Role.STAFF_RECEPTIONIST), true);
      assert.equal(isStaffRole(Role.MANAGER), false);
      assert.equal(isStaffRole(Role.RESIDENT), false);
    });

    it('MUST correctly identify domain roles', () => {
      // Financial: only ADMIN and MANAGER
      assert.equal(isFinancialRole(Role.ADMIN), true);
      assert.equal(isFinancialRole(Role.MANAGER), true);
      assert.equal(isFinancialRole(Role.STAFF_TECHNICIAN), false);
      assert.equal(isFinancialRole(Role.STAFF_SECURITY), false);
      assert.equal(isFinancialRole(Role.STAFF_RECEPTIONIST), false);
      assert.equal(isFinancialRole(Role.RESIDENT), false);

      // Technical: ADMIN, MANAGER, and STAFF_TECHNICIAN
      assert.equal(isTechnicalRole(Role.STAFF_TECHNICIAN), true);
      assert.equal(isTechnicalRole(Role.MANAGER), true);
      assert.equal(isTechnicalRole(Role.STAFF_SECURITY), false);

      // Security: ADMIN, MANAGER, and STAFF_SECURITY
      assert.equal(isSecurityRole(Role.STAFF_SECURITY), true);
      assert.equal(isSecurityRole(Role.MANAGER), true);
      assert.equal(isSecurityRole(Role.STAFF_TECHNICIAN), false);

      // Receptionist: ADMIN, MANAGER, and STAFF_RECEPTIONIST
      assert.equal(isReceptionistRole(Role.STAFF_RECEPTIONIST), true);
      assert.equal(isReceptionistRole(Role.MANAGER), true);
      assert.equal(isReceptionistRole(Role.STAFF_SECURITY), false);
    });
  });

  describe('2. Permission Abstraction Matrix Checks', () => {
    it('MUST grant ADMIN wildcard access to any requested permission', () => {
      assert.equal(hasPermission(Role.ADMIN, 'invoice:generate'), true);
      assert.equal(hasPermission(Role.ADMIN, 'fee:manage'), true);
      assert.equal(hasPermission(Role.ADMIN, 'system:manage'), true);
      assert.equal(hasPermission(Role.ADMIN, 'parking_access:log'), true);
      assert.equal(hasPermission(Role.ADMIN, 'parcel:collect'), true);
    });

    it('MUST grant MANAGER full operational rights, but restrict superuser system admin', () => {
      assert.equal(hasPermission(Role.MANAGER, 'invoice:generate'), true);
      assert.equal(hasPermission(Role.MANAGER, 'fee:manage'), true);
      assert.equal(hasPermission(Role.MANAGER, 'feedback:assign'), true);
      assert.equal(hasPermission(Role.MANAGER, 'vehicle:approve'), true);
      assert.equal(hasPermission(Role.MANAGER, 'system:manage'), false, 'MANAGER must not have system:manage');
      assert.equal(hasPermission(Role.MANAGER, 'system:users:manage'), false, 'MANAGER must not have system:users:manage');
    });

    it('MUST enforce STAFF_TECHNICIAN boundaries (maintenance only, no finances/users)', () => {
      assert.equal(hasPermission(Role.STAFF_TECHNICIAN, 'feedback:read'), true);
      assert.equal(hasPermission(Role.STAFF_TECHNICIAN, 'feedback:process'), true);
      assert.equal(hasPermission(Role.STAFF_TECHNICIAN, 'feedback:resolve'), true);
      assert.equal(hasPermission(Role.STAFF_TECHNICIAN, 'feedback:comment:internal'), true);

      // Strict denials
      assert.equal(hasPermission(Role.STAFF_TECHNICIAN, 'invoice:read'), false);
      assert.equal(hasPermission(Role.STAFF_TECHNICIAN, 'invoice:generate'), false);
      assert.equal(hasPermission(Role.STAFF_TECHNICIAN, 'fee:manage'), false);
      assert.equal(hasPermission(Role.STAFF_TECHNICIAN, 'vehicle:approve'), false);
      assert.equal(hasPermission(Role.STAFF_TECHNICIAN, 'system:manage'), false);
    });

    it('MUST enforce STAFF_SECURITY boundaries (parking & gate only, no finances/residents)', () => {
      assert.equal(hasPermission(Role.STAFF_SECURITY, 'vehicle:read'), true);
      assert.equal(hasPermission(Role.STAFF_SECURITY, 'parking_card:read'), true);
      assert.equal(hasPermission(Role.STAFF_SECURITY, 'parking_access:log'), true);
      assert.equal(hasPermission(Role.STAFF_SECURITY, 'visitor:scan'), true);

      // Strict denials
      assert.equal(hasPermission(Role.STAFF_SECURITY, 'invoice:read'), false);
      assert.equal(hasPermission(Role.STAFF_SECURITY, 'fee:manage'), false);
      assert.equal(hasPermission(Role.STAFF_SECURITY, 'resident:delete'), false);
      assert.equal(hasPermission(Role.STAFF_SECURITY, 'feedback:assign'), false);
    });

    it('MUST enforce STAFF_RECEPTIONIST boundaries (parcels & directory only, no finances)', () => {
      assert.equal(hasPermission(Role.STAFF_RECEPTIONIST, 'parcel:manage'), true);
      assert.equal(hasPermission(Role.STAFF_RECEPTIONIST, 'parcel:receive'), true);
      assert.equal(hasPermission(Role.STAFF_RECEPTIONIST, 'resident:read:minimal'), true);

      // Strict denials
      assert.equal(hasPermission(Role.STAFF_RECEPTIONIST, 'invoice:read'), false);
      assert.equal(hasPermission(Role.STAFF_RECEPTIONIST, 'fee:manage'), false);
      assert.equal(hasPermission(Role.STAFF_RECEPTIONIST, 'vehicle:approve'), false);
      assert.equal(hasPermission(Role.STAFF_RECEPTIONIST, 'feedback:resolve'), false);
    });

    it('MUST restrict RESIDENT to only self-scoped permissions', () => {
      assert.equal(hasPermission(Role.RESIDENT, 'invoice:read:self'), true);
      assert.equal(hasPermission(Role.RESIDENT, 'invoice:pay:self'), true);
      assert.equal(hasPermission(Role.RESIDENT, 'feedback:create:self'), true);
      assert.equal(hasPermission(Role.RESIDENT, 'vehicle:create:self'), true);

      // Denials of management permissions
      assert.equal(hasPermission(Role.RESIDENT, 'invoice:generate'), false);
      assert.equal(hasPermission(Role.RESIDENT, 'invoice:read'), false);
      assert.equal(hasPermission(Role.RESIDENT, 'fee:manage'), false);
      assert.equal(hasPermission(Role.RESIDENT, 'vehicle:approve'), false);
      assert.equal(hasPermission(Role.RESIDENT, 'feedback:assign'), false);
    });
  });

  describe('3. Resource Guard Defense-in-Depth (authorization.ts)', () => {
    const mockPrisma = {
      resident: {
        findUnique: async () => null,
      },
    };

    const techUser: SessionUser = { id: 'u-tech', role: Role.STAFF_TECHNICIAN };
    const secUser: SessionUser = { id: 'u-sec', role: Role.STAFF_SECURITY };
    const receptUser: SessionUser = { id: 'u-rec', role: Role.STAFF_RECEPTIONIST };
    const managerUser: SessionUser = { id: 'u-mgr', role: Role.MANAGER };

    it('MUST DENY operational staff from invoice access', async () => {
      const techResult = await authorizeInvoiceAccess(techUser, 'apt-101', mockPrisma);
      assert.equal(techResult.allowed, false);
      assert.equal(techResult.statusCode, 403);

      const secResult = await authorizeInvoiceAccess(secUser, 'apt-101', mockPrisma);
      assert.equal(secResult.allowed, false);

      const recResult = await authorizeInvoiceAccess(receptUser, 'apt-101', mockPrisma);
      assert.equal(recResult.allowed, false);

      const mgrResult = await authorizeInvoiceAccess(managerUser, 'apt-101', mockPrisma);
      assert.equal(mgrResult.allowed, true);
    });

    it('MUST DENY non-security staff from vehicle management operations', async () => {
      const techResult = await authorizeVehicleAccess(techUser, 'apt-101', mockPrisma);
      assert.equal(techResult.allowed, false);

      const secResult = await authorizeVehicleAccess(secUser, 'apt-101', mockPrisma);
      assert.equal(secResult.allowed, true);

      const mgrResult = await authorizeVehicleAccess(managerUser, 'apt-101', mockPrisma);
      assert.equal(mgrResult.allowed, true);
    });

    it('MUST DENY non-technical staff from feedback ticket resolution access', async () => {
      const secResult = await authorizeFeedbackAccess(secUser, { apartmentId: 'apt-101' }, mockPrisma);
      assert.equal(secResult.allowed, false);

      const recResult = await authorizeFeedbackAccess(receptUser, { apartmentId: 'apt-101' }, mockPrisma);
      assert.equal(recResult.allowed, false);

      const techResult = await authorizeFeedbackAccess(techUser, { apartmentId: 'apt-101' }, mockPrisma);
      assert.equal(techResult.allowed, true);

      const mgrResult = await authorizeFeedbackAccess(managerUser, { apartmentId: 'apt-101' }, mockPrisma);
      assert.equal(mgrResult.allowed, true);
    });

    it('MUST DENY operational staff from accessing legal contracts', async () => {
      const techResult = await authorizeContractAccess(techUser, 'apt-101', mockPrisma);
      assert.equal(techResult.allowed, false);

      const secResult = await authorizeContractAccess(secUser, 'apt-101', mockPrisma);
      assert.equal(secResult.allowed, false);

      const mgrResult = await authorizeContractAccess(managerUser, 'apt-101', mockPrisma);
      assert.equal(mgrResult.allowed, true);
    });
  });
});
