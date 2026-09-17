import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { Role } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  hasPermission,
  can,
  isAdmin,
  isManager,
} from '../src/lib/permissions';
import {
  authorizeBuildingAccess,
  authorizeApartmentAccess,
  authorizeInvoiceAccess,
  authorizeFeedbackAccess,
  authorizeResidentProfileAccess,
  authorizeVehicleAccess,
  SessionUser,
} from '../src/lib/authorization';

describe('Admin & Manager RBAC, Scope Enforcement & IDOR Protection Tests', () => {
  let masterBuilding: any;
  let sunriseBuilding: any;
  let smartCityManager: SessionUser;
  let sunriseManager: SessionUser;
  let adminUser: SessionUser;
  let residentUser: SessionUser;
  let smartCityApartment: any;
  let sunriseApartment: any;

  before(async () => {
    // 1. Fetch buildings
    masterBuilding = await prisma.building.findUnique({
      where: { code: 'SMART-CITY' },
    });
    sunriseBuilding = await prisma.building.findUnique({
      where: { code: 'SUNRISE-TOWER' },
    });

    assert.ok(masterBuilding, 'Master building SMART-CITY must exist');
    assert.ok(sunriseBuilding, 'Sunrise building SUNRISE-TOWER must exist');

    // 2. Fetch sample apartments from both buildings
    smartCityApartment = await prisma.apartment.findFirst({
      where: { buildingId: masterBuilding.id },
    });
    sunriseApartment = await prisma.apartment.findFirst({
      where: { buildingId: sunriseBuilding.id },
    });

    assert.ok(smartCityApartment, 'SmartCity apartment must exist');
    assert.ok(sunriseApartment, 'Sunrise apartment must exist');

    // 3. Construct test session users
    adminUser = {
      id: 'admin-user-id',
      role: Role.ADMIN,
      email: 'admin@building.com',
    };

    // Manager A assigned ONLY to SMART-CITY
    smartCityManager = {
      id: 'manager-a-id',
      role: Role.MANAGER,
      email: 'manager-a@building.com',
      assignedBuildingIds: [masterBuilding.id],
    };

    // Manager B assigned ONLY to SUNRISE-TOWER
    sunriseManager = {
      id: 'manager-b-id',
      role: Role.MANAGER,
      email: 'manager-b@building.com',
      assignedBuildingIds: [sunriseBuilding.id],
    };

    residentUser = {
      id: 'resident-user-id',
      role: Role.RESIDENT,
      email: 'resident@building.com',
      apartmentId: smartCityApartment.id,
    };
  });

  describe('1. Role Hierarchy & Permission Matrix Checks', () => {
    it('MUST verify role classification helpers', () => {
      assert.equal(isAdmin(Role.ADMIN), true);
      assert.equal(isAdmin(Role.MANAGER), false);
      assert.equal(isManager(Role.MANAGER), true);
      assert.equal(isManager(Role.ADMIN), false);
    });

    it('MUST grant ADMIN wildcard permission (*)', () => {
      assert.equal(can(Role.ADMIN, 'building:create'), true);
      assert.equal(can(Role.ADMIN, 'building:delete'), true);
      assert.equal(can(Role.ADMIN, 'manager:create'), true);
      assert.equal(can(Role.ADMIN, 'access_control:manage'), true);
      assert.equal(can(Role.ADMIN, 'system:manage'), true);
    });

    it('MUST grant MANAGER operational permissions but DENY administrative platform permissions', () => {
      // Allowed operational permissions
      assert.equal(can(Role.MANAGER, 'apartment:read'), true);
      assert.equal(can(Role.MANAGER, 'apartment:update'), true);
      assert.equal(can(Role.MANAGER, 'invoice:generate'), true);
      assert.equal(can(Role.MANAGER, 'resident:read'), true);
      assert.equal(can(Role.MANAGER, 'feedback:assign'), true);
      assert.equal(can(Role.MANAGER, 'building:read'), true);

      // STRICTLY DENIED administrative permissions
      assert.equal(can(Role.MANAGER, 'building:create'), false, 'MANAGER cannot create buildings');
      assert.equal(can(Role.MANAGER, 'building:delete'), false, 'MANAGER cannot delete buildings');
      assert.equal(can(Role.MANAGER, 'manager:create'), false, 'MANAGER cannot create managers');
      assert.equal(can(Role.MANAGER, 'manager:assign'), false, 'MANAGER cannot assign managers');
      assert.equal(can(Role.MANAGER, 'access_control:manage'), false, 'MANAGER cannot manage access control');
      assert.equal(can(Role.MANAGER, 'system:manage'), false, 'MANAGER cannot manage system');
    });
  });

  describe('2. Building Scope Authorization', () => {
    it('MUST ALLOW ADMIN to access any building', async () => {
      const checkA = await authorizeBuildingAccess(adminUser, masterBuilding.id);
      const checkB = await authorizeBuildingAccess(adminUser, sunriseBuilding.id);

      assert.equal(checkA.allowed, true);
      assert.equal(checkB.allowed, true);
    });

    it('MUST ALLOW MANAGER to access their ASSIGNED building', async () => {
      const check = await authorizeBuildingAccess(smartCityManager, masterBuilding.id);
      assert.equal(check.allowed, true);
    });

    it('MUST DENY (403) when MANAGER attempts to access UNASSIGNED building', async () => {
      const check = await authorizeBuildingAccess(smartCityManager, sunriseBuilding.id);
      assert.equal(check.allowed, false);
      assert.equal(check.statusCode, 403);
    });
  });

  describe('3. IDOR Prevention: Apartment Access', () => {
    it('MUST ALLOW ADMIN to access any apartment across any building', async () => {
      const checkA = await authorizeApartmentAccess(adminUser, smartCityApartment.id);
      const checkB = await authorizeApartmentAccess(adminUser, sunriseApartment.id);

      assert.equal(checkA.allowed, true);
      assert.equal(checkB.allowed, true);
    });

    it('MUST ALLOW Manager A to access apartment in Building A (SmartCity)', async () => {
      const check = await authorizeApartmentAccess(smartCityManager, smartCityApartment.id);
      assert.equal(check.allowed, true);
    });

    it('MUST BLOCK Manager A (403 Forbidden) from accessing apartment in Building B (Sunrise Tower)', async () => {
      const check = await authorizeApartmentAccess(smartCityManager, sunriseApartment.id);
      assert.equal(check.allowed, false);
      assert.equal(check.statusCode, 403);
    });

    it('MUST ALLOW Manager B to access apartment in Building B (Sunrise Tower)', async () => {
      const check = await authorizeApartmentAccess(sunriseManager, sunriseApartment.id);
      assert.equal(check.allowed, true);
    });

    it('MUST BLOCK Manager B (403 Forbidden) from accessing apartment in Building A (SmartCity)', async () => {
      const check = await authorizeApartmentAccess(sunriseManager, smartCityApartment.id);
      assert.equal(check.allowed, false);
      assert.equal(check.statusCode, 403);
    });
  });

  describe('4. IDOR Prevention: Invoice Access', () => {
    it('MUST ALLOW Manager A to access invoices in Building A', async () => {
      const check = await authorizeInvoiceAccess(smartCityManager, smartCityApartment.id);
      assert.equal(check.allowed, true);
    });

    it('MUST BLOCK Manager A (403 Forbidden) from accessing invoices in Building B', async () => {
      const check = await authorizeInvoiceAccess(smartCityManager, sunriseApartment.id);
      assert.equal(check.allowed, false);
      assert.equal(check.statusCode, 403);
    });
  });

  describe('5. IDOR Prevention: Maintenance Ticket / Feedback Access', () => {
    it('MUST ALLOW Manager A to access tickets in Building A', async () => {
      const check = await authorizeFeedbackAccess(smartCityManager, {
        apartmentId: smartCityApartment.id,
      });
      assert.equal(check.allowed, true);
    });

    it('MUST BLOCK Manager A (403 Forbidden) from accessing tickets in Building B', async () => {
      const check = await authorizeFeedbackAccess(smartCityManager, {
        apartmentId: sunriseApartment.id,
      });
      assert.equal(check.allowed, false);
      assert.equal(check.statusCode, 403);
    });
  });

  describe('6. IDOR Prevention: Resident Profile Access', () => {
    it('MUST ALLOW Manager A to view resident residing in Building A', async () => {
      const check = await authorizeResidentProfileAccess(smartCityManager, {
        id: 'res-1',
        apartmentId: smartCityApartment.id,
      });
      assert.equal(check.allowed, true);
    });

    it('MUST BLOCK Manager A (403 Forbidden) from viewing resident residing in Building B', async () => {
      const check = await authorizeResidentProfileAccess(smartCityManager, {
        id: 'res-2',
        apartmentId: sunriseApartment.id,
      });
      assert.equal(check.allowed, false);
      assert.equal(check.statusCode, 403);
    });
  });

  describe('7. IDOR Prevention: Vehicle Access', () => {
    it('MUST ALLOW Manager A to view vehicles in Building A', async () => {
      const check = await authorizeVehicleAccess(smartCityManager, smartCityApartment.id);
      assert.equal(check.allowed, true);
    });

    it('MUST BLOCK Manager A (403 Forbidden) from viewing vehicles in Building B', async () => {
      const check = await authorizeVehicleAccess(smartCityManager, sunriseApartment.id);
      assert.equal(check.allowed, false);
      assert.equal(check.statusCode, 403);
    });
  });
});
