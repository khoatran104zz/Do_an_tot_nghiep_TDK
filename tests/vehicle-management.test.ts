import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { vehicleService } from '../src/modules/vehicle/vehicle.service';
import { parkingCardService } from '../src/modules/vehicle/parking-card.service';
import { normalizeLicensePlate } from '../src/modules/vehicle/vehicle.schema';
import { VehicleError } from '../src/modules/vehicle/vehicle.types';
import { SessionUser } from '../src/lib/authorization';
import { prisma } from '../src/lib/prisma';
import { VehicleType, VehicleStatus, ParkingCardStatus } from '@prisma/client';

describe('Vehicle & Parking Management Test Suite', () => {
  const managerUser: SessionUser = {
    id: 'test-manager-id',
    email: 'manager@building.com',
    role: 'MANAGER',
  };

  // We will resolve test apartments and residents from the seeded database
  let aptA1001: any;
  let aptB2001: any;
  let residentAn: any;
  let residentUserAn: SessionUser;

  beforeEach(async () => {
    aptA1001 = await prisma.apartment.findFirst({ where: { code: 'A-1001' } });
    aptB2001 = await prisma.apartment.findFirst({ where: { code: 'B-2001' } });
    residentAn = await prisma.resident.findFirst({ where: { identityCard: '012345678901' } });

    assert.ok(aptA1001, 'Apartment A-1001 must exist');
    assert.ok(aptB2001, 'Apartment B-2001 must exist');
    assert.ok(residentAn, 'Resident Nguyen Van An must exist');

    residentUserAn = {
      id: residentAn.userId!,
      email: residentAn.email,
      role: 'RESIDENT',
      apartmentId: aptA1001.id,
      residentId: residentAn.id,
    };
  });

  describe('1. License Plate Normalization', () => {
    it('MUST normalize plate by removing spaces, hyphens, and dots into uppercase', () => {
      assert.equal(normalizeLicensePlate('30A-999.88'), '30A99988');
      assert.equal(normalizeLicensePlate('29-G1  888.66'), '29G188866');
      assert.equal(normalizeLicensePlate('51h.555-22'), '51H55522');
      assert.equal(normalizeLicensePlate('29a12345'), '29A12345');
    });

    it('MUST detect duplicate plates with different punctuation styles', async () => {
      // 30A-999.88 is already seeded in the database
      await assert.rejects(
        async () => {
          await vehicleService.createVehicle(
            {
              licensePlate: '30A 99988', // variation without hyphen/dot
              type: VehicleType.CAR,
              brand: 'Test Brand',
              apartmentId: aptA1001.id,
            },
            managerUser
          );
        },
        (err: any) => {
          assert.equal(err instanceof VehicleError, true);
          assert.equal(err.code, 'DUPLICATE_LICENSE_PLATE');
          return true;
        }
      );
    });
  });

  describe('2. Vehicle Creation by Manager & Resident', () => {
    const testPlateManager = `99-TEST-${Date.now().toString().slice(-4)}`;
    const testPlateResident = `98-TEST-${Date.now().toString().slice(-4)}`;

    it('MUST allow MANAGER to create vehicle with ACTIVE status', async () => {
      const vehicle = await vehicleService.createVehicle(
        {
          licensePlate: testPlateManager,
          type: VehicleType.CAR,
          brand: 'Audi',
          model: 'A6',
          apartmentId: aptA1001.id,
          residentId: residentAn.id,
          status: VehicleStatus.ACTIVE,
        },
        managerUser
      );

      assert.ok(vehicle.id);
      assert.equal(vehicle.licensePlate, testPlateManager);
      assert.equal(vehicle.status, VehicleStatus.ACTIVE);
      assert.equal(vehicle.apartmentId, aptA1001.id);

      // Clean up
      await prisma.vehicle.delete({ where: { id: vehicle.id } });
    });

    it('MUST force RESIDENT vehicle creation to PENDING_APPROVAL and their own apartment', async () => {
      const vehicle = await vehicleService.createVehicle(
        {
          licensePlate: testPlateResident,
          type: VehicleType.MOTORBIKE,
          brand: 'Honda',
          model: 'Future',
          // Even if client tries to request ACTIVE status, backend must force PENDING_APPROVAL
          status: VehicleStatus.ACTIVE,
        },
        residentUserAn
      );

      assert.ok(vehicle.id);
      assert.equal(vehicle.status, VehicleStatus.PENDING_APPROVAL);
      assert.equal(vehicle.apartmentId, aptA1001.id);
      assert.equal(vehicle.residentId, residentAn.id);

      // Clean up
      await prisma.vehicle.delete({ where: { id: vehicle.id } });
    });

    it('MUST REJECT when RESIDENT tries to register vehicle for another apartment', async () => {
      await assert.rejects(
        async () => {
          await vehicleService.createVehicle(
            {
              licensePlate: `97-TEST-${Date.now().toString().slice(-4)}`,
              type: VehicleType.CAR,
              brand: 'BMW',
              apartmentId: aptB2001.id, // Resident An does not live in B-2001
            },
            residentUserAn
          );
        },
        (err: any) => {
          assert.equal(err instanceof VehicleError, true);
          assert.equal(err.code, 'INVALID_APARTMENT');
          assert.equal(err.statusCode, 403);
          return true;
        }
      );
    });
  });

  describe('3. Resident IDOR & Access Control', () => {
    it('MUST DENY resident accessing vehicle details of another apartment', async () => {
      // Find a vehicle in B-2001
      const vehicleB2001 = await prisma.vehicle.findFirst({
        where: { apartmentId: aptB2001.id },
      });
      assert.ok(vehicleB2001, 'Vehicle in B-2001 must exist');

      await assert.rejects(
        async () => {
          // Resident An tries to access vehicle in B-2001
          await vehicleService.getVehicleById(vehicleB2001.id, residentUserAn);
        },
        (err: any) => {
          assert.equal(err instanceof VehicleError, true);
          assert.equal(err.code, 'FORBIDDEN');
          assert.equal(err.statusCode, 403);
          return true;
        }
      );
    });

    it('MUST ALLOW resident to view vehicles belonging to their own apartment', async () => {
      const vehicleA1001 = await prisma.vehicle.findFirst({
        where: { apartmentId: aptA1001.id },
      });
      assert.ok(vehicleA1001, 'Vehicle in A-1001 must exist');

      const vehicle = await vehicleService.getVehicleById(vehicleA1001.id, residentUserAn);
      assert.equal(vehicle.id, vehicleA1001.id);
    });

    it('MUST ALLOW manager or admin to access any vehicle', async () => {
      const vehicleB2001 = await prisma.vehicle.findFirst({
        where: { apartmentId: aptB2001.id },
      });
      const vehicle = await vehicleService.getVehicleById(vehicleB2001!.id, managerUser);
      assert.equal(vehicle.id, vehicleB2001!.id);
    });
  });

  describe('4. Approval & Rejection Workflow', () => {
    let pendingVehicle: any;

    beforeEach(async () => {
      pendingVehicle = await prisma.vehicle.create({
        data: {
          licensePlate: `96-WF-${Date.now().toString().slice(-4)}`,
          type: VehicleType.MOTORBIKE,
          brand: 'Yamaha',
          model: 'NVX',
          apartmentId: aptA1001.id,
          status: VehicleStatus.PENDING_APPROVAL,
        },
      });
    });

    it('MUST ALLOW manager to APPROVE pending vehicle', async () => {
      const approved = await vehicleService.approveVehicle(
        pendingVehicle.id,
        { cardCode: `TEST-CARD-${Date.now().toString().slice(-4)}` },
        managerUser
      );

      assert.equal(approved?.status, VehicleStatus.ACTIVE);
      assert.equal(approved?.parkingCards.length, 1);
      assert.equal(approved?.parkingCards[0].status, ParkingCardStatus.ACTIVE);

      // Clean up
      await prisma.parkingCard.deleteMany({ where: { vehicleId: pendingVehicle.id } });
      await prisma.vehicle.delete({ where: { id: pendingVehicle.id } });
    });

    it('MUST ALLOW manager to REJECT pending vehicle with reason', async () => {
      const rejected = await vehicleService.rejectVehicle(
        pendingVehicle.id,
        { reason: 'Tầng hầm khu vực này đã hết chỗ đỗ' },
        managerUser
      );

      assert.equal(rejected.status, VehicleStatus.REJECTED);

      // Clean up
      await prisma.vehicle.delete({ where: { id: pendingVehicle.id } });
    });

    it('MUST REJECT approval if vehicle is not in PENDING_APPROVAL status', async () => {
      // Find an already ACTIVE vehicle
      const activeVehicle = await prisma.vehicle.findFirst({
        where: { status: VehicleStatus.ACTIVE },
      });

      await assert.rejects(
        async () => {
          await vehicleService.approveVehicle(activeVehicle!.id, {}, managerUser);
        },
        (err: any) => {
          assert.equal(err instanceof VehicleError, true);
          assert.equal(err.code, 'INVALID_STATUS_TRANSITION');
          return true;
        }
      );

      // Clean up pending vehicle
      await prisma.vehicle.delete({ where: { id: pendingVehicle.id } });
    });

    it('MUST DENY resident trying to approve or reject vehicles', async () => {
      await assert.rejects(
        async () => {
          await vehicleService.approveVehicle(pendingVehicle.id, {}, residentUserAn);
        },
        (err: any) => {
          assert.equal(err.code, 'FORBIDDEN');
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await vehicleService.rejectVehicle(pendingVehicle.id, { reason: 'Unauthorized' }, residentUserAn);
        },
        (err: any) => {
          assert.equal(err.code, 'FORBIDDEN');
          return true;
        }
      );

      // Clean up
      await prisma.vehicle.delete({ where: { id: pendingVehicle.id } });
    });
  });

  describe('5. Parking Card Lifecycle & Deactivation', () => {
    let testVehicle: any;

    beforeEach(async () => {
      testVehicle = await prisma.vehicle.create({
        data: {
          licensePlate: `95-CARD-${Date.now().toString().slice(-4)}`,
          type: VehicleType.CAR,
          brand: 'Kia',
          model: 'Seltos',
          apartmentId: aptA1001.id,
          status: VehicleStatus.ACTIVE,
        },
      });
    });

    it('MUST allow manager to issue card, lock it, and unlock it', async () => {
      const cardCode = `CARD-TEST-${Date.now().toString().slice(-4)}`;

      // 1. Issue Card
      const card = await parkingCardService.issueCard(
        testVehicle.id,
        { cardCode, status: ParkingCardStatus.ACTIVE },
        managerUser
      );
      assert.equal(card.status, ParkingCardStatus.ACTIVE);
      assert.equal(card.cardCode, cardCode);

      // 2. Lock Card
      const locked = await parkingCardService.lockCard(
        card.id,
        { lockReason: 'Khách báo mất thẻ' },
        managerUser
      );
      assert.equal(locked.status, ParkingCardStatus.LOCKED);
      assert.equal(locked.lockReason, 'Khách báo mất thẻ');
      assert.ok(locked.lockedAt);

      // 3. Unlock Card
      const unlocked = await parkingCardService.unlockCard(card.id, managerUser);
      assert.equal(unlocked.status, ParkingCardStatus.ACTIVE);
      assert.equal(unlocked.lockedAt, null);
      assert.equal(unlocked.lockReason, null);

      // Clean up
      await prisma.parkingCard.delete({ where: { id: card.id } });
      await prisma.vehicle.delete({ where: { id: testVehicle.id } });
    });

    it('MUST prevent issuing a second ACTIVE card while previous is still active', async () => {
      const cardCode1 = `CARD-1-${Date.now().toString().slice(-4)}`;
      const cardCode2 = `CARD-2-${Date.now().toString().slice(-4)}`;

      const card1 = await parkingCardService.issueCard(
        testVehicle.id,
        { cardCode: cardCode1 },
        managerUser
      );

      await assert.rejects(
        async () => {
          await parkingCardService.issueCard(
            testVehicle.id,
            { cardCode: cardCode2 },
            managerUser
          );
        },
        (err: any) => {
          assert.equal(err instanceof VehicleError, true);
          assert.equal(err.code, 'DUPLICATE_ACTIVE_CARD');
          return true;
        }
      );

      // Clean up
      await prisma.parkingCard.delete({ where: { id: card1.id } });
      await prisma.vehicle.delete({ where: { id: testVehicle.id } });
    });

    it('MUST automatically LOCK active parking cards when vehicle is DEACTIVATED', async () => {
      const cardCode = `CARD-DEACT-${Date.now().toString().slice(-4)}`;

      const card = await parkingCardService.issueCard(
        testVehicle.id,
        { cardCode },
        managerUser
      );

      // Deactivate vehicle
      const deactivated = await vehicleService.deactivateVehicle(testVehicle.id, managerUser);
      assert.equal(deactivated.status, VehicleStatus.INACTIVE);

      // Check card was locked automatically
      const updatedCard = await prisma.parkingCard.findUnique({ where: { id: card.id } });
      assert.equal(updatedCard?.status, ParkingCardStatus.LOCKED);
      assert.ok(updatedCard?.lockedAt);

      // Clean up
      await prisma.parkingCard.delete({ where: { id: card.id } });
      await prisma.vehicle.delete({ where: { id: testVehicle.id } });
    });

    it('MUST DENY resident from locking or unlocking cards', async () => {
      const cardCode = `CARD-DENY-${Date.now().toString().slice(-4)}`;
      const card = await parkingCardService.issueCard(
        testVehicle.id,
        { cardCode },
        managerUser
      );

      await assert.rejects(
        async () => {
          await parkingCardService.lockCard(card.id, { lockReason: 'Unauthorized' }, residentUserAn);
        },
        (err: any) => {
          assert.equal(err.code, 'FORBIDDEN');
          return true;
        }
      );

      // Clean up
      await prisma.parkingCard.delete({ where: { id: card.id } });
      await prisma.vehicle.delete({ where: { id: testVehicle.id } });
    });
  });

  describe('6. Resident Portal Ownership & Authorization Guard', () => {
    it('MUST scope getVehicles query strictly to resident apartment regardless of query spoofing', async () => {
      // Resident An passes apartmentId of B-2001 in filter
      const result = await vehicleService.getVehicles(
        { apartmentId: aptB2001.id },
        residentUserAn
      );

      // All returned vehicles MUST belong to A-1001, none to B-2001
      assert.ok(result.items.length > 0, 'Should return vehicles of A-1001');
      for (const v of result.items) {
        assert.equal(v.apartmentId, aptA1001.id);
      }
    });

    it('MUST block resident from modifying vehicle details when status is ACTIVE', async () => {
      const activeVehicle = await prisma.vehicle.findFirst({
        where: { apartmentId: aptA1001.id, status: VehicleStatus.ACTIVE },
      });
      assert.ok(activeVehicle, 'Active vehicle in A-1001 must exist');

      await assert.rejects(
        async () => {
          await vehicleService.updateVehicle(
            activeVehicle.id,
            { brand: 'Hacked Brand' },
            residentUserAn
          );
        },
        (err: any) => {
          assert.equal(err.code, 'FORBIDDEN');
          assert.equal(err.statusCode, 403);
          return true;
        }
      );
    });

    it('MUST block resident from altering vehicle status or changing license plate', async () => {
      // Create a pending vehicle for A-1001
      const tempVehicle = await vehicleService.createVehicle(
        {
          licensePlate: `95-TEST-${Date.now().toString().slice(-4)}`,
          type: VehicleType.CAR,
          brand: 'Honda',
          apartmentId: aptA1001.id,
        },
        residentUserAn
      );
      assert.equal(tempVehicle.status, VehicleStatus.PENDING_APPROVAL);

      // Resident attempts to change licensePlate
      await assert.rejects(
        async () => {
          await vehicleService.updateVehicle(
            tempVehicle.id,
            { licensePlate: '99-HACKED-99' },
            residentUserAn
          );
        },
        (err: any) => {
          assert.equal(err.code, 'FORBIDDEN');
          return true;
        }
      );

      // Clean up
      await prisma.vehicle.delete({ where: { id: tempVehicle.id } });
    });
  });
});
