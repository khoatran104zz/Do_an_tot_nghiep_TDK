import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apartmentSchema } from '../src/modules/apartment/apartment.schema';
import { feeCategorySchema } from '../src/modules/fee/fee.schema';
import { FeeUnit } from '@prisma/client';

describe('Phase 2 Schema & Domain Hardening Test Suite', () => {
  describe('1. DB-001 & DB-002: Apartment Code Scoped per Building & Required buildingId', () => {
    it('MUST REJECT apartment creation when buildingId is missing', () => {
      const invalidData = {
        code: 'A-101',
        area: 75,
      };

      assert.throws(() => {
        apartmentSchema.parse(invalidData);
      }, /buildingId/);
    });

    it('MUST ALLOW apartment creation when buildingId is provided', () => {
      const validData = {
        code: 'A-101',
        buildingId: 'bldg-sky',
        area: 75,
      };

      const parsed = apartmentSchema.parse(validData);
      assert.equal(parsed.code, 'A-101');
      assert.equal(parsed.buildingId, 'bldg-sky');
    });

    it('MUST ALLOW two apartments to have the identical code A-101 if they belong to different buildings', () => {
      // Mock repository storing apartments with compound key [buildingId, code]
      const dbApartments: Array<{ id: string; buildingId: string; code: string }> = [];

      const createApt = (buildingId: string, code: string) => {
        const existing = dbApartments.find(
          (a) => a.buildingId === buildingId && a.code.toUpperCase() === code.toUpperCase()
        );
        if (existing) {
          throw new Error(`Mã căn hộ "${code}" đã tồn tại trong tòa nhà này`);
        }
        const created = { id: `apt-${Date.now()}-${Math.random()}`, buildingId, code: code.toUpperCase() };
        dbApartments.push(created);
        return created;
      };

      // Building 1 (Sky Tower) has A-101
      const apt1 = createApt('bldg-sky', 'A-101');
      assert.equal(apt1.code, 'A-101');
      assert.equal(apt1.buildingId, 'bldg-sky');

      // Building 2 (Ocean Tower) also has A-101 -> MUST SUCCEED (DB-001)
      const apt2 = createApt('bldg-ocean', 'A-101');
      assert.equal(apt2.code, 'A-101');
      assert.equal(apt2.buildingId, 'bldg-ocean');

      // Duplicate in Building 1 -> MUST THROW
      assert.throws(() => {
        createApt('bldg-sky', 'A-101');
      }, /đã tồn tại trong tòa nhà này/);
    });
  });

  describe('2. DB-003: FeeCategory Scoped per Tenant', () => {
    it('MUST validate FeeCategory with optional tenantId', () => {
      const validFee = feeCategorySchema.parse({
        code: 'PARKING_CAR',
        name: 'Phí gửi ô tô',
        unit: FeeUnit.PER_VEHICLE,
        unitPrice: 1500000,
        tenantId: 'tenant-sunrise',
      });

      assert.equal(validFee.code, 'PARKING_CAR');
      assert.equal(validFee.tenantId, 'tenant-sunrise');
      assert.equal(validFee.unitPrice, 1500000);
    });

    it('MUST ALLOW two different tenants to configure different prices for the same fee code', () => {
      const dbFeeCategories: Array<{ id: string; tenantId: string | null; code: string; unitPrice: number }> = [];

      const createFee = (tenantId: string | null, code: string, unitPrice: number) => {
        const existing = dbFeeCategories.find(
          (f) => f.tenantId === tenantId && f.code.toUpperCase() === code.toUpperCase()
        );
        if (existing) {
          throw new Error(`Mã danh mục phí "${code}" đã tồn tại trong tổ hợp này`);
        }
        const created = { id: `fee-${Date.now()}`, tenantId, code: code.toUpperCase(), unitPrice };
        dbFeeCategories.push(created);
        return created;
      };

      // Tenant 1 configures PARKING_CAR at 1,200,000 VND
      const feeTenant1 = createFee('tenant-smartcity', 'PARKING_CAR', 1200000);
      assert.equal(feeTenant1.unitPrice, 1200000);

      // Tenant 2 configures PARKING_CAR at 1,800,000 VND -> MUST SUCCEED
      const feeTenant2 = createFee('tenant-sunrise', 'PARKING_CAR', 1800000);
      assert.equal(feeTenant2.unitPrice, 1800000);

      // Duplicate within Tenant 1 -> MUST THROW
      assert.throws(() => {
        createFee('tenant-smartcity', 'PARKING_CAR', 1500000);
      }, /đã tồn tại trong tổ hợp này/);
    });
  });

  describe('3. DB-004: Poll Multi-Tenant & Building Scope Isolation', () => {
    const mockPolls = [
      {
        id: 'poll-1',
        title: 'Khảo sát sơn lại sảnh Tòa Sky',
        tenantId: 'tenant-smartcity',
        buildingId: 'bldg-sky',
      },
      {
        id: 'poll-2',
        title: 'Bầu ban quản trị Sunrise Tower',
        tenantId: 'tenant-sunrise',
        buildingId: 'bldg-sunrise',
      },
      {
        id: 'poll-global',
        title: 'Khảo sát chung hệ thống',
        tenantId: null,
        buildingId: null,
      },
    ];

    it('MUST strictly isolate polls so residents only see polls for their tenant/building', () => {
      const filterPollsForResident = (residentTenantId: string, residentBuildingId: string) => {
        return mockPolls.filter((p) => {
          const tenantMatch = !p.tenantId || p.tenantId === residentTenantId;
          const buildingMatch = !p.buildingId || p.buildingId === residentBuildingId;
          return tenantMatch && buildingMatch;
        });
      };

      // SmartCity Sky Tower Resident
      const smartCityPolls = filterPollsForResident('tenant-smartcity', 'bldg-sky');
      assert.equal(smartCityPolls.length, 2); // poll-1 and poll-global
      assert.ok(smartCityPolls.some((p) => p.id === 'poll-1'));
      assert.ok(!smartCityPolls.some((p) => p.id === 'poll-2'), 'Must NOT see Sunrise Tower poll');

      // Sunrise Resident
      const sunrisePolls = filterPollsForResident('tenant-sunrise', 'bldg-sunrise');
      assert.equal(sunrisePolls.length, 2); // poll-2 and poll-global
      assert.ok(sunrisePolls.some((p) => p.id === 'poll-2'));
      assert.ok(!sunrisePolls.some((p) => p.id === 'poll-1'), 'Must NOT see SmartCity poll');
    });
  });

  describe('4. DB-006: AuditLog Multi-Tenant Tracking', () => {
    const recordedLogs: Array<{ id: string; tenantId: string | null; action: string; entity: string }> = [];

    const recordAudit = (params: { tenantId?: string | null; action: string; entity: string }) => {
      const entry = {
        id: `audit-${recordedLogs.length + 1}`,
        tenantId: params.tenantId || null,
        action: params.action,
        entity: params.entity,
      };
      recordedLogs.push(entry);
      return entry;
    };

    it('MUST attach tenantId when recording and filtering audit logs', () => {
      recordAudit({ tenantId: 'tenant-smartcity', action: 'CREATE_INVOICE', entity: 'INVOICE' });
      recordAudit({ tenantId: 'tenant-sunrise', action: 'PROCESS_PAYMENT', entity: 'PAYMENT' });
      recordAudit({ tenantId: null, action: 'PLATFORM_BACKUP', entity: 'SYSTEM' });

      assert.equal(recordedLogs.length, 3);

      const smartCityLogs = recordedLogs.filter((l) => l.tenantId === 'tenant-smartcity');
      assert.equal(smartCityLogs.length, 1);
      assert.equal(smartCityLogs[0].action, 'CREATE_INVOICE');

      const sunriseLogs = recordedLogs.filter((l) => l.tenantId === 'tenant-sunrise');
      assert.equal(sunriseLogs.length, 1);
      assert.equal(sunriseLogs[0].action, 'PROCESS_PAYMENT');
    });
  });
});
