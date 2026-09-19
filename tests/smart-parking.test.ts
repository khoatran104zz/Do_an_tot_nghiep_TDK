import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { parkingService } from '../src/modules/parking/parking.service';
import { parkingRepository } from '../src/modules/parking/parking.repository';
import { ParkingError } from '../src/modules/parking/parking.types';
import { SessionUser } from '../src/lib/authorization';
import { prisma } from '../src/lib/prisma';
import {
  ParkingSlotStatus,
  ParkingRequestStatus,
  ParkingAssignmentStatus,
  SlotVehicleType,
  VehicleType,
} from '@prisma/client';

describe('Smart Parking Management Module Test Suite', () => {
  let building: any;
  let areaB1: any;
  let residentUser: SessionUser;
  let managerUser: SessionUser;
  let unauthorizedManagerUser: SessionUser;
  let adminUser: SessionUser;
  let testVehicle: any;
  let testApartment: any;
  let testResident: any;

  beforeEach(async () => {
    building = await prisma.building.findFirst();
    assert.ok(building, 'Seed building must exist');

    areaB1 = await prisma.parkingArea.findFirst({
      where: { buildingId: building.id, code: 'B1' },
      include: { zones: true },
    });
    assert.ok(areaB1, 'Area B1 must exist');

    testApartment = await prisma.apartment.findFirst({
      where: { code: 'A-1001' },
    });
    assert.ok(testApartment, 'Apartment A-1001 must exist');

    testResident = await prisma.resident.findFirst({
      where: { apartmentId: testApartment.id },
    });
    assert.ok(testResident, 'Resident must exist');

    testVehicle = await prisma.vehicle.findFirst({
      where: { apartmentId: testApartment.id, status: 'ACTIVE' },
    });
    assert.ok(testVehicle, 'Active vehicle must exist');

    residentUser = {
      id: testResident.userId || 'test-resident-user',
      email: testResident.email,
      role: 'RESIDENT',
      apartmentId: testApartment.id,
      residentId: testResident.id,
    };

    const realManager = await prisma.user.findFirst({ where: { role: 'MANAGER' } });
    const realAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    managerUser = {
      id: realManager?.id || 'manager-user-id',
      email: realManager?.email || 'manager@building.com',
      role: 'MANAGER',
      assignedBuildingIds: [building.id],
    };

    unauthorizedManagerUser = {
      id: 'other-manager-user-id',
      email: 'other@building.com',
      role: 'MANAGER',
      assignedBuildingIds: ['other-building-id-999'],
    };

    adminUser = {
      id: realAdmin?.id || 'admin-user-id',
      email: realAdmin?.email || 'admin@system.com',
      role: 'ADMIN',
    };
  });

  // ==========================================================================
  // 1. BACKEND OCCUPANCY CALCULATIONS (SOURCE OF TRUTH)
  // ==========================================================================
  describe('1. Occupancy Calculation Logic', () => {
    it('MUST correctly compute capacity, available, occupied, and occupancy rate', async () => {
      const metrics = await parkingRepository.calculateAreaOccupancy(areaB1.id);

      assert.ok(metrics.total > 0, 'Total slots must be greater than 0');
      assert.equal(
        metrics.total,
        metrics.available + metrics.occupied + metrics.reserved + metrics.maintenance + metrics.blocked,
        'Total must equal sum of all individual slot statuses'
      );
      assert.ok(metrics.occupancyRate >= 0 && metrics.occupancyRate <= 100, 'Occupancy rate must be 0-100%');
    });

    it('MUST return comprehensive global overview with area breakdown', async () => {
      const overview = await parkingService.getOverview(building.id, managerUser);

      assert.ok(overview.summary, 'Summary metrics must exist');
      assert.ok(overview.areas.length > 0, 'Area breakdown must exist');
      assert.ok(overview.byVehicleType, 'Vehicle distribution must exist');
      assert.equal(typeof overview.activePassesCount, 'number');
    });
  });

  // ==========================================================================
  // 2. PRIVACY & RBAC ENFORCEMENT
  // ==========================================================================
  describe('2. RBAC & Resident Privacy Protection', () => {
    it('Resident CANNOT see other residents personal details on occupied slots', async () => {
      // Find an occupied slot in areaB1
      const occupiedSlot = await prisma.parkingSlot.findFirst({
        where: { areaId: areaB1.id, status: ParkingSlotStatus.OCCUPIED },
      });

      if (occupiedSlot) {
        // Manager inspects slot -> sees assignment details
        const managerView = await parkingService.getSlotById(occupiedSlot.id, managerUser);
        assert.ok(managerView.assignments.length > 0, 'Manager can see assignment');

        // Other resident inspects slot -> assignments masked
        const otherResidentUser: SessionUser = {
          id: 'random-stranger-id',
          role: 'RESIDENT',
        };
        const residentView = await parkingService.getSlotById(occupiedSlot.id, otherResidentUser);
        assert.equal(
          residentView.assignments.length,
          0,
          'Other resident MUST NOT see assignment details (Privacy Guard)'
        );
      }
    });

    it('Resident CANNOT modify slot status or release slots', async () => {
      const slot = await prisma.parkingSlot.findFirst({ where: { areaId: areaB1.id } });
      assert.ok(slot);

      await assert.rejects(
        async () => {
          await parkingService.updateSlotStatus(slot.id, ParkingSlotStatus.MAINTENANCE, residentUser);
        },
        (err: any) => err.statusCode === 403
      );

      await assert.rejects(
        async () => {
          await parkingService.releaseSlot(slot.id, residentUser);
        },
        (err: any) => err.statusCode === 403
      );
    });
  });

  // ==========================================================================
  // 3. BUILDING SCOPE ENFORCEMENT
  // ==========================================================================
  describe('3. Building Scope Enforcement', () => {
    it('Manager of Building B CANNOT manage parking in Building A', async () => {
      await assert.rejects(
        async () => {
          await parkingService.createSlot(
            {
              areaId: areaB1.id,
              zoneId: areaB1.zones[0].id,
              code: 'TEST-FORBIDDEN',
            },
            unauthorizedManagerUser
          );
        },
        (err: any) => err.statusCode === 403 && err.message.includes('không có quyền')
      );
    });

    it('ADMIN has global access across all buildings', async () => {
      const area = await parkingService.getAreaById(areaB1.id, adminUser);
      assert.ok(area, 'Admin must be able to view area');
    });
  });

  // ==========================================================================
  // 4. CONCURRENCY & BUSINESS RULES (ANTI DOUBLE-ASSIGNMENT)
  // ==========================================================================
  describe('4. Business Rules & Anti Double-Assignment', () => {
    it('MUST PREVENT 1 Vehicle from having multiple active parking slots (Rule 18)', async () => {
      // Find a vehicle that already has an active assignment
      const existingAssignment = await prisma.parkingAssignment.findFirst({
        where: { status: ParkingAssignmentStatus.ACTIVE },
        include: { vehicle: true },
      });

      if (existingAssignment) {
        // Attempt to assign another slot to this same vehicle
        const availableSlot = await prisma.parkingSlot.findFirst({
          where: { areaId: areaB1.id, status: ParkingSlotStatus.AVAILABLE },
        });

        if (availableSlot) {
          await assert.rejects(
            async () => {
              await parkingService.assignSlot(
                {
                  slotId: availableSlot.id,
                  vehicleId: existingAssignment.vehicleId,
                },
                managerUser
              );
            },
            (err: any) => err.code === 'VEHICLE_ALREADY_ASSIGNED'
          );
        }
      }
    });

    it('MUST PREVENT assigning an already occupied slot to another vehicle', async () => {
      const occupiedSlot = await prisma.parkingSlot.findFirst({
        where: { areaId: areaB1.id, status: ParkingSlotStatus.OCCUPIED },
      });

      if (occupiedSlot) {
        await assert.rejects(
          async () => {
            await parkingService.assignSlot(
              {
                slotId: occupiedSlot.id,
                vehicleId: 'some-dummy-vehicle',
              },
              managerUser
            );
          },
          (err: any) => err.code === 'SLOT_UNAVAILABLE' || err.statusCode === 400
        );
      }
    });
  });

  // ==========================================================================
  // 5. REGISTRATION REQUEST WORKFLOW & NOTIFICATIONS
  // ==========================================================================
  describe('5. Registration Workflow & Notifications', () => {
    it('Resident submits request -> Manager reviews and approves -> slot occupied + QR token generated', async () => {
      // 1. Create a fresh vehicle for this test to avoid conflicting with existing assignments
      const plate = `30F-${Math.floor(10000 + Math.random() * 90000)}`;
      const newVehicle = await prisma.vehicle.create({
        data: {
          licensePlate: plate,
          type: VehicleType.CAR,
          brand: 'Hyundai',
          model: 'Tucson',
          apartmentId: testApartment.id,
          residentId: testResident.id,
          status: 'ACTIVE',
        },
      });

      // 2. Find an available slot
      const availableSlot = await prisma.parkingSlot.findFirst({
        where: { areaId: areaB1.id, status: ParkingSlotStatus.AVAILABLE },
      });
      assert.ok(availableSlot, 'An available slot must exist for testing');

      // 3. Resident submits request
      const request = await parkingService.createRequest(
        {
          vehicleId: newVehicle.id,
          slotId: availableSlot.id,
          notes: 'Test parking request submission',
        },
        residentUser
      );
      assert.equal(request.status, ParkingRequestStatus.PENDING);

      // 4. Manager approves request
      const approved = await parkingService.reviewRequest(
        request.id,
        {
          action: 'APPROVE',
          slotId: availableSlot.id,
          monthlyFee: 1200000,
        },
        managerUser
      );

      assert.equal(approved.status, ParkingRequestStatus.APPROVED);

      // 5. Verify slot status changed to OCCUPIED
      const updatedSlot = await prisma.parkingSlot.findUnique({ where: { id: availableSlot.id } });
      assert.equal(updatedSlot?.status, ParkingSlotStatus.OCCUPIED);

      // 6. Verify assignment exists with QR token
      const assignment = await prisma.parkingAssignment.findFirst({
        where: { vehicleId: newVehicle.id, status: ParkingAssignmentStatus.ACTIVE },
      });
      assert.ok(assignment, 'Active assignment must be created');
      assert.ok(assignment.qrToken.startsWith('KHOME-PARK-'), 'Secure QR token must be generated');

      // 7. Verify Notification dispatched to apartment
      const notif = await prisma.notification.findFirst({
        where: {
          apartments: { some: { apartmentId: testApartment.id } },
          title: { contains: 'phê duyệt' },
        },
        orderBy: { createdAt: 'desc' },
      });
      assert.ok(notif, 'Resident must receive approval notification');

      // Cleanup
      await prisma.parkingAssignment.deleteMany({ where: { vehicleId: newVehicle.id } });
      await prisma.parkingRegistrationRequest.deleteMany({ where: { vehicleId: newVehicle.id } });
      await prisma.vehicle.delete({ where: { id: newVehicle.id } });
      await prisma.parkingSlot.update({
        where: { id: availableSlot.id },
        data: { status: ParkingSlotStatus.AVAILABLE },
      });
    });
  });

  // ==========================================================================
  // 6. GATE OPERATIONS (CHECK-IN & CHECK-OUT)
  // ==========================================================================
  describe('6. Security Gate Operations', () => {
    it('Gate check-in with registered vehicle logs SUCCESS and identifies vehicle', async () => {
      const res = await parkingService.checkIn(
        {
          licensePlate: testVehicle.licensePlate,
          gateName: 'Cổng VÀO 01 (Hầm B1)',
        },
        managerUser
      );

      assert.equal(res.authorized, true);
      assert.equal(res.log.status, 'SUCCESS');
      assert.equal(res.log.direction, 'ENTRY');
    });

    it('Gate check-in with unregistered unknown plate flags ALERT', async () => {
      const res = await parkingService.checkIn(
        {
          licensePlate: '99X-UNKNOWN-999',
          gateName: 'Cổng VÀO 02 (Hầm B2)',
        },
        managerUser
      );

      assert.equal(res.authorized, false);
      assert.equal(res.log.status, 'ALERT');
    });

    it('Gate check-out logs EXIT event', async () => {
      const res = await parkingService.checkOut(
        {
          licensePlate: testVehicle.licensePlate,
          gateName: 'Cổng RA 01 (Hầm B1)',
        },
        managerUser
      );

      assert.equal(res.success, true);
      assert.equal(res.log.direction, 'EXIT');
    });
  });
});
