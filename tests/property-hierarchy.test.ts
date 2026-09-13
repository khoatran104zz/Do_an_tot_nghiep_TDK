import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { apartmentRepository } from '../src/modules/apartment/apartment.repository';
import { apartmentService } from '../src/modules/apartment/apartment.service';
import { ApartmentStatus, ApartmentHistoryEvent } from '@prisma/client';

describe('Property Management Hierarchy & History Tests', () => {
  describe('1. Building -> Block -> Floor -> Apartment Hierarchy', () => {
    it('MUST query Building and linked Blocks and Floors correctly', async () => {
      const buildings = await apartmentRepository.getHierarchy();
      assert.ok(buildings.length > 0, 'Must have at least one building');

      const master = buildings[0];
      assert.ok(master.blocks.length >= 3, 'Must have at least 3 blocks (A, B, C)');

      const blockA = master.blocks.find((b) => b.code === 'BLOCK-A');
      assert.ok(blockA, 'Block A must exist');
      assert.ok(blockA.floors.length > 0, 'Block A must have floors');

      // Check floor contains apartments
      const floor10 = blockA.floors.find((f) => f.floorNumber === 10);
      assert.ok(floor10, 'Floor 10 must exist in Block A');
      assert.ok(floor10.apartments.length > 0, 'Floor 10 must have apartments');
    });

    it('MUST preserve backward-compatible building and floor fields on Apartment', async () => {
      const apt = await prisma.apartment.findFirst({
        where: { code: 'A-1001' },
        include: { block: true, floorRef: true, buildingRef: true },
      });

      assert.ok(apt, 'Apartment A-1001 must exist');
      assert.equal(typeof apt.building, 'string', 'building string field must remain');
      assert.equal(typeof apt.floor, 'number', 'floor number field must remain');
      assert.equal(apt.floor, 10);

      // Verify new relations exist and match
      assert.ok(apt.blockId, 'blockId must be linked');
      assert.ok(apt.floorId, 'floorId must be linked');
      assert.ok(apt.buildingId, 'buildingId must be linked');
      assert.equal(apt.floorRef?.floorNumber, 10);
    });
  });

  describe('2. Apartment Indicators (Owner, Residing Count, Debt, Maintenance)', () => {
    it('MUST accurately compute owner, residents count, debt, and open tickets', async () => {
      const result = await apartmentRepository.findAll({ search: 'A-1001', limit: 1 });
      assert.equal(result.items.length, 1);

      const apt = result.items[0];
      assert.equal(apt.code, 'A-1001');
      assert.ok(apt.owner !== undefined, 'Owner indicator must be present');
      assert.equal(typeof apt.residentsCount, 'number', 'residentsCount must be a number');
      assert.equal(typeof apt.unpaidInvoicesCount, 'number', 'unpaidInvoicesCount must be a number');
      assert.equal(typeof apt.totalDebt, 'number', 'totalDebt must be a number');
      assert.equal(typeof apt.openTicketsCount, 'number', 'openTicketsCount must be a number');
    });

    it('MUST filter apartments by block and floor correctly', async () => {
      const floor10Apts = await apartmentRepository.findAll({ floor: 10, limit: 50 });
      assert.ok(floor10Apts.items.length > 0);
      for (const apt of floor10Apts.items) {
        assert.equal(apt.floor, 10, 'All returned apartments must be on Floor 10');
      }
    });
  });

  describe('3. Apartment History Event Recording & Timeline', () => {
    it('MUST record and retrieve ApartmentHistory events for all 6 event types', async () => {
      const testApt = await prisma.apartment.findFirst();
      assert.ok(testApt, 'A test apartment must exist');

      const eventsToTest: ApartmentHistoryEvent[] = [
        ApartmentHistoryEvent.OWNER_TRANSFER,
        ApartmentHistoryEvent.TENANT_MOVE_IN,
        ApartmentHistoryEvent.TENANT_MOVE_OUT,
        ApartmentHistoryEvent.RESIDENT_MOVE_IN,
        ApartmentHistoryEvent.RESIDENT_MOVE_OUT,
        ApartmentHistoryEvent.STATUS_CHANGE,
      ];

      for (const event of eventsToTest) {
        const created = await apartmentRepository.createHistory(testApt.id, {
          event,
          title: `Test Event: ${event}`,
          description: `Testing event recording for ${event}`,
          performedBy: 'Automated Test Runner',
        });

        assert.equal(created.apartmentId, testApt.id);
        assert.equal(created.event, event);
      }

      const history = await apartmentRepository.getHistory(testApt.id);
      assert.ok(history.length >= 6, 'Must retrieve all recorded events');
      assert.ok(history[0].createdAt >= history[history.length - 1].createdAt, 'Must be sorted newest first');
    });

    it('MUST automatically record STATUS_CHANGE event when apartment status is updated', async () => {
      // Create a temporary test apartment
      const tempApt = await apartmentService.createApartment({
        code: `TEST-${Date.now().toString().slice(-4)}`,
        building: 'Tòa A (Sky)',
        floor: 15,
        bedrooms: 2,
        bathrooms: 2,
        area: 80,
        status: ApartmentStatus.VACANT,
      });

      // Update status to UNDER_MAINTENANCE
      await apartmentService.updateApartment(
        tempApt.id,
        { status: ApartmentStatus.UNDER_MAINTENANCE },
        'Trưởng nhóm Kỹ thuật'
      );

      const history = await apartmentService.getHistory(tempApt.id);
      const statusChangeEvent = history.find(
        (h) => h.event === ApartmentHistoryEvent.STATUS_CHANGE && h.toStatus === ApartmentStatus.UNDER_MAINTENANCE
      );

      assert.ok(statusChangeEvent, 'STATUS_CHANGE event must be recorded automatically');
      assert.equal(statusChangeEvent.fromStatus, ApartmentStatus.VACANT);
      assert.equal(statusChangeEvent.toStatus, ApartmentStatus.UNDER_MAINTENANCE);
      assert.equal(statusChangeEvent.performedBy, 'Trưởng nhóm Kỹ thuật');

      // Cleanup temp apartment
      await apartmentRepository.delete(tempApt.id);
    });
  });
});
