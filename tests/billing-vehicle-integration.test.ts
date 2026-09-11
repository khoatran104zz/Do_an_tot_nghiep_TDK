import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceService } from '../src/modules/invoice/invoice.service';
import { prisma } from '../src/lib/prisma';
import { VehicleType, VehicleStatus, FeeUnit, ResidentStatus } from '@prisma/client';

describe('Billing - Vehicle Integration Test Suite', () => {
  let testApartment0: any; // 0 vehicles
  let testApartment2M: any; // 2 motorbikes
  let testApartmentMixed: any; // 2 motorbikes + 1 car
  let testApartmentLifecycle: any; // pending, inactive, rejected, moved_out
  let motoFeeCategory: any;
  let carFeeCategory: any;

  const testBillingMonth = '2026-11';
  const nextBillingMonth = '2026-12';
  const dueDate = '2026-11-25T00:00:00.000Z';

  before(async () => {
    // Ensure test fee categories exist
    motoFeeCategory = await prisma.feeCategory.upsert({
      where: { code: 'PARKING_MOTO' },
      update: { unitPrice: 100000, unit: FeeUnit.PER_VEHICLE },
      create: {
        code: 'PARKING_MOTO',
        name: 'Phí trông giữ xe máy',
        unit: FeeUnit.PER_VEHICLE,
        unitPrice: 100000,
        isSystem: true,
      },
    });

    carFeeCategory = await prisma.feeCategory.upsert({
      where: { code: 'PARKING_CAR' },
      update: { unitPrice: 1200000, unit: FeeUnit.PER_VEHICLE },
      create: {
        code: 'PARKING_CAR',
        name: 'Phí trông giữ ô tô',
        unit: FeeUnit.PER_VEHICLE,
        unitPrice: 1200000,
        isSystem: true,
      },
    });

    // Create unique test apartments to isolate tests
    const timestamp = Date.now();

    testApartment0 = await prisma.apartment.create({
      data: {
        code: `T-0-${timestamp}`,
        building: 'T-BLOCK',
        floor: 1,
        area: 60,
      },
    });

    testApartment2M = await prisma.apartment.create({
      data: {
        code: `T-2M-${timestamp}`,
        building: 'T-BLOCK',
        floor: 2,
        area: 70,
      },
    });

    testApartmentMixed = await prisma.apartment.create({
      data: {
        code: `T-MIX-${timestamp}`,
        building: 'T-BLOCK',
        floor: 3,
        area: 85,
      },
    });

    testApartmentLifecycle = await prisma.apartment.create({
      data: {
        code: `T-LIFE-${timestamp}`,
        building: 'T-BLOCK',
        floor: 4,
        area: 90,
      },
    });

    // Setup vehicles for testApartment2M: 2 ACTIVE motorbikes
    await prisma.vehicle.createMany({
      data: [
        {
          licensePlate: `29M1-T1-${timestamp}`,
          type: VehicleType.MOTORBIKE,
          brand: 'Honda',
          apartmentId: testApartment2M.id,
          status: VehicleStatus.ACTIVE,
          createdAt: new Date('2026-10-01T00:00:00Z'),
        },
        {
          licensePlate: `29M2-T2-${timestamp}`,
          type: VehicleType.MOTORBIKE,
          brand: 'Yamaha',
          apartmentId: testApartment2M.id,
          status: VehicleStatus.ACTIVE,
          createdAt: new Date('2026-10-15T00:00:00Z'),
        },
      ],
    });

    // Setup vehicles for testApartmentMixed: 2 ACTIVE motorbikes + 1 ACTIVE car
    await prisma.vehicle.createMany({
      data: [
        {
          licensePlate: `29MX1-${timestamp}`,
          type: VehicleType.MOTORBIKE,
          brand: 'Honda',
          apartmentId: testApartmentMixed.id,
          status: VehicleStatus.ACTIVE,
          createdAt: new Date('2026-10-01T00:00:00Z'),
        },
        {
          licensePlate: `29MX2-${timestamp}`,
          type: VehicleType.MOTORBIKE,
          brand: 'Piaggio',
          apartmentId: testApartmentMixed.id,
          status: VehicleStatus.ACTIVE,
          createdAt: new Date('2026-10-05T00:00:00Z'),
        },
        {
          licensePlate: `30MX3-${timestamp}`,
          type: VehicleType.CAR,
          brand: 'Mazda',
          apartmentId: testApartmentMixed.id,
          status: VehicleStatus.ACTIVE,
          createdAt: new Date('2026-10-10T00:00:00Z'),
        },
      ],
    });

    // Setup vehicles for testApartmentLifecycle:
    // - 1 PENDING_APPROVAL
    // - 1 INACTIVE
    // - 1 REJECTED
    // - 1 created after billing period (in Dec 2026)
    // - 1 ACTIVE belonging to a MOVED_OUT resident
    const movedOutResident = await prisma.resident.create({
      data: {
        fullName: `Moved Out Resident ${timestamp}`,
        identityCard: `ID-${timestamp}`,
        phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        apartmentId: testApartmentLifecycle.id,
        status: ResidentStatus.MOVED_OUT,
      },
    });

    await prisma.vehicle.createMany({
      data: [
        {
          licensePlate: `29PEND-${timestamp}`,
          type: VehicleType.MOTORBIKE,
          brand: 'Honda',
          apartmentId: testApartmentLifecycle.id,
          status: VehicleStatus.PENDING_APPROVAL,
          createdAt: new Date('2026-10-01T00:00:00Z'),
        },
        {
          licensePlate: `29INACT-${timestamp}`,
          type: VehicleType.MOTORBIKE,
          brand: 'Yamaha',
          apartmentId: testApartmentLifecycle.id,
          status: VehicleStatus.INACTIVE,
          createdAt: new Date('2026-10-01T00:00:00Z'),
        },
        {
          licensePlate: `30REJ-${timestamp}`,
          type: VehicleType.CAR,
          brand: 'Toyota',
          apartmentId: testApartmentLifecycle.id,
          status: VehicleStatus.REJECTED,
          createdAt: new Date('2026-10-01T00:00:00Z'),
        },
        {
          licensePlate: `30FUTURE-${timestamp}`,
          type: VehicleType.CAR,
          brand: 'Mercedes',
          apartmentId: testApartmentLifecycle.id,
          status: VehicleStatus.ACTIVE,
          createdAt: new Date('2026-12-05T00:00:00Z'), // Created in Dec 2026, after Nov billing month
        },
        {
          licensePlate: `30MOVED-${timestamp}`,
          type: VehicleType.CAR,
          brand: 'VinFast',
          apartmentId: testApartmentLifecycle.id,
          residentId: movedOutResident.id,
          status: VehicleStatus.ACTIVE,
          createdAt: new Date('2026-10-01T00:00:00Z'),
        },
      ],
    });
  });

  after(async () => {
    // Cleanup created test data
    const aptIds = [
      testApartment0?.id,
      testApartment2M?.id,
      testApartmentMixed?.id,
      testApartmentLifecycle?.id,
    ].filter(Boolean);

    if (aptIds.length > 0) {
      await prisma.invoiceItem.deleteMany({
        where: { invoice: { apartmentId: { in: aptIds } } },
      });
      await prisma.invoice.deleteMany({
        where: { apartmentId: { in: aptIds } },
      });
      await prisma.parkingCard.deleteMany({
        where: { vehicle: { apartmentId: { in: aptIds } } },
      });
      await prisma.vehicle.deleteMany({
        where: { apartmentId: { in: aptIds } },
      });
      await prisma.resident.deleteMany({
        where: { apartmentId: { in: aptIds } },
      });
      await prisma.apartment.deleteMany({
        where: { id: { in: aptIds } },
      });
    }
  });

  describe('1. Dynamic Parking Fee Calculation', () => {
    it('MUST generate 0 parking fee items when apartment has 0 active vehicles', async () => {
      // Run generation for testApartment0
      await invoiceService.generateMonthlyInvoices({
        billingMonth: testBillingMonth,
        dueDate,
      });

      const inv0 = await prisma.invoice.findFirst({
        where: { apartmentId: testApartment0.id, billingMonth: testBillingMonth },
        include: { items: { include: { feeCategory: true } } },
      });

      assert.ok(inv0, 'Invoice for testApartment0 must exist');
      const parkingItems = inv0.items.filter((it) => it.feeCategory?.unit === FeeUnit.PER_VEHICLE);
      assert.equal(parkingItems.length, 0, 'Apartment with 0 vehicles must have 0 parking items');
    });

    it('MUST calculate quantity = 2 for apartment with 2 active motorbikes (PARKING_MOTO)', async () => {
      const inv2M = await prisma.invoice.findFirst({
        where: { apartmentId: testApartment2M.id, billingMonth: testBillingMonth },
        include: { items: { include: { feeCategory: true } } },
      });

      assert.ok(inv2M, 'Invoice for testApartment2M must exist');
      const parkingItems = inv2M.items.filter((it) => it.feeCategory?.unit === FeeUnit.PER_VEHICLE);

      // Exactly 1 parking item (for motorbike, none for car)
      assert.equal(parkingItems.length, 1, 'Should have exactly 1 parking fee category item');
      const motoItem = parkingItems[0];
      assert.equal(motoItem.feeCategory?.code, 'PARKING_MOTO');
      assert.equal(motoItem.quantity, 2, 'Quantity must be dynamically calculated as 2');
      assert.equal(motoItem.unitPrice, 100000, 'UnitPrice must be 100,000');
      assert.equal(motoItem.amount, 200000, 'Total amount must be 200,000');
      assert.ok(motoItem.note?.includes('2 phương tiện'), 'Note must indicate 2 vehicles');
    });

    it('MUST generate 2 distinct parking items for apartment with 2 motorbikes + 1 car', async () => {
      const invMixed = await prisma.invoice.findFirst({
        where: { apartmentId: testApartmentMixed.id, billingMonth: testBillingMonth },
        include: { items: { include: { feeCategory: true } } },
      });

      assert.ok(invMixed, 'Invoice for testApartmentMixed must exist');
      const parkingItems = invMixed.items.filter((it) => it.feeCategory?.unit === FeeUnit.PER_VEHICLE);

      assert.equal(parkingItems.length, 2, 'Should have 2 parking items (moto & car)');

      const motoItem = parkingItems.find((it) => it.feeCategory?.code === 'PARKING_MOTO');
      assert.ok(motoItem, 'Must have PARKING_MOTO item');
      assert.equal(motoItem.quantity, 2, 'Motorbike quantity must be 2');
      assert.equal(motoItem.amount, 200000, 'Motorbike amount must be 200,000');

      const carItem = parkingItems.find((it) => it.feeCategory?.code === 'PARKING_CAR');
      assert.ok(carItem, 'Must have PARKING_CAR item');
      assert.equal(carItem.quantity, 1, 'Car quantity must be 1');
      assert.equal(carItem.unitPrice, 1200000, 'Car unitPrice must be 1,200,000');
      assert.equal(carItem.amount, 1200000, 'Car amount must be 1,200,000');
    });
  });

  describe('2. Lifecycle and Status Exclusion Rules', () => {
    it('MUST NOT bill PENDING_APPROVAL, INACTIVE, REJECTED, future, or MOVED_OUT resident vehicles', async () => {
      const invLife = await prisma.invoice.findFirst({
        where: { apartmentId: testApartmentLifecycle.id, billingMonth: testBillingMonth },
        include: { items: { include: { feeCategory: true } } },
      });

      assert.ok(invLife, 'Invoice for testApartmentLifecycle must exist');
      const parkingItems = invLife.items.filter((it) => it.feeCategory?.unit === FeeUnit.PER_VEHICLE);

      // In testApartmentLifecycle, all 5 vehicles are invalid for Nov 2026 billing:
      // - 1 PENDING_APPROVAL
      // - 1 INACTIVE
      // - 1 REJECTED
      // - 1 FUTURE (created in Dec 2026)
      // - 1 Belonging to MOVED_OUT resident
      assert.equal(
        parkingItems.length,
        0,
        'None of the invalid/pending/inactive/future/moved-out vehicles should be billed'
      );
    });
  });

  describe('3. Idempotency & Concurrency Safety', () => {
    it('MUST skip already-generated invoices and avoid duplicates when run a second time', async () => {
      // Count invoices before
      const countBefore = await prisma.invoice.count({
        where: { billingMonth: testBillingMonth },
      });

      // Run generator again for the same month
      const result2 = await invoiceService.generateMonthlyInvoices({
        billingMonth: testBillingMonth,
        dueDate,
      });

      const countAfter = await prisma.invoice.count({
        where: { billingMonth: testBillingMonth },
      });

      assert.equal(countAfter, countBefore, 'No duplicate invoices should be created');
      assert.equal(result2.generatedCount, 0, 'Generated count on second run must be 0');
      assert.ok(result2.skippedCount > 0, 'Skipped count should reflect existing invoices');
    });
  });

  describe('4. Backend Calculation and Security Protection', () => {
    it('MUST ignore forged client quantity/amount in manual createInvoice and enforce server-side active vehicle count', async () => {
      const forgedInvoice = await invoiceService.createInvoice({
        apartmentId: testApartment2M.id,
        billingMonth: nextBillingMonth, // Use nextBillingMonth to avoid duplicate
        dueDate,
        items: [
          {
            feeCategoryId: motoFeeCategory.id,
            title: motoFeeCategory.name,
            quantity: 999, // FORGED QUANTITY from malicious client
            unitPrice: 1, // FORGED UNIT PRICE from malicious client
          },
        ],
      });

      const savedInvoice = await prisma.invoice.findUnique({
        where: { id: forgedInvoice.id },
        include: { items: true },
      });

      assert.ok(savedInvoice, 'Saved invoice must exist');
      const item = savedInvoice.items[0];

      // Backend must have overridden quantity with the actual 2 active motorbikes
      assert.equal(item.quantity, 2, 'Backend must enforce server-side active vehicle count (2), not client (999)');
      assert.equal(item.unitPrice, 100000, 'Backend must enforce FeeCategory unit price (100,000), not client (1)');
      assert.equal(item.amount, 200000, 'Backend must compute item amount (200,000)');
      assert.equal(savedInvoice.totalAmount, 200000, 'Backend must compute invoice totalAmount (200,000)');
    });

    it('MUST reject manual invoice creation if invoice for that apartment and month already exists', async () => {
      await assert.rejects(
        async () => {
          await invoiceService.createInvoice({
            apartmentId: testApartment2M.id,
            billingMonth: nextBillingMonth, // Already created in the test above
            dueDate,
            items: [
              {
                title: 'Dịch vụ phụ',
                quantity: 1,
                unitPrice: 50000,
              },
            ],
          });
        },
        /Căn hộ này đã có hóa đơn kỳ/,
        'Must reject duplicate invoice for same apartment and billing month'
      );
    });
  });

  describe('5. Audit Log Recording', () => {
    it('MUST record GENERATE_PARKING_FEE audit logs with apartment details and item breakdown', async () => {
      const parkingLogs = await prisma.auditLog.findMany({
        where: {
          action: 'GENERATE_PARKING_FEE',
          metadata: {
            path: ['billingMonth'],
            equals: testBillingMonth,
          },
        },
      });

      assert.ok(parkingLogs.length > 0, 'Audit logs for GENERATE_PARKING_FEE must be recorded');
      const mixedLog = parkingLogs.find(
        (l: any) => l.metadata && (l.metadata as any).apartmentId === testApartmentMixed.id
      );

      assert.ok(mixedLog, 'Audit log for testApartmentMixed must exist');
      const metadata = mixedLog.metadata as any;
      assert.equal(metadata.totalParkingAmount, 1400000, 'Total parking amount in log must be 200,000 + 1,200,000 = 1,400,000');
    });
  });
});
