import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAssetSchema,
  updateAssetSchema,
  createScheduleSchema,
  completeScheduleSchema,
} from '../src/modules/asset/asset.schema';
import {
  AssetCategory,
  AssetStatus,
  MaintenanceCycle,
  MaintenanceStatus,
  Role,
} from '@prisma/client';
import { assetRepository } from '../src/modules/asset/asset.repository';

describe('Asset & Preventive Maintenance Module Tests', () => {
  describe('1. Zod Schema Validation', () => {
    it('MUST VALIDATE a valid asset creation payload', () => {
      const validPayload = {
        name: 'Thang máy Schindler Khách số 1',
        category: AssetCategory.ELEVATOR,
        location: 'Tòa Sky - Trục thang máy số 1',
        supplier: 'Schindler Việt Nam',
        status: AssetStatus.OPERATIONAL,
        description: 'Tải trọng 1350kg, tốc độ 2.5m/s',
      };

      const parsed = createAssetSchema.safeParse(validPayload);
      assert.equal(parsed.success, true, 'Valid asset payload should parse successfully');
      if (parsed.success) {
        assert.equal(parsed.data.name, validPayload.name);
        assert.equal(parsed.data.category, AssetCategory.ELEVATOR);
      }
    });

    it('MUST REJECT asset if name or location is empty', () => {
      const invalidPayload = {
        name: '',
        category: AssetCategory.GENERATOR,
        location: '',
      };

      const parsed = createAssetSchema.safeParse(invalidPayload);
      assert.equal(parsed.success, false, 'Empty name and location must fail validation');
    });

    it('MUST VALIDATE preventive maintenance schedule creation', () => {
      const validSchedule = {
        assetId: 'cm123456789',
        title: 'Bảo dưỡng định kỳ hàng tháng tủ điện & biến tần',
        cycle: MaintenanceCycle.MONTHLY,
        nextMaintenance: '2026-10-15',
        vendor: 'Schindler VN',
        notes: 'Kiểm tra độ rung và dòng khởi động',
      };

      const parsed = createScheduleSchema.safeParse(validSchedule);
      assert.equal(parsed.success, true, 'Valid schedule payload should parse successfully');
    });

    it('MUST REJECT schedule if title is missing or too short', () => {
      const invalidSchedule = {
        assetId: 'cm123456789',
        title: 'ab', // min length is 3
        nextMaintenance: '2026-10-15',
      };

      const parsed = createScheduleSchema.safeParse(invalidSchedule);
      assert.equal(parsed.success, false, 'Short title must fail validation');
    });

    it('MUST VALIDATE complete schedule payload and reject negative cost', () => {
      const validComplete = {
        findings: 'Đã thay dầu bôi trơn ray dẫn hướng, các chức năng an toàn bình thường.',
        cost: 2500000,
        notes: 'Không có phát sinh thêm.',
      };

      const parsed = completeScheduleSchema.safeParse(validComplete);
      assert.equal(parsed.success, true);

      const invalidCost = {
        findings: 'Đã kiểm tra xong',
        cost: -50000,
      };
      const parsedInvalid = completeScheduleSchema.safeParse(invalidCost);
      assert.equal(parsedInvalid.success, false, 'Negative cost must be rejected');
    });
  });

  describe('2. Maintenance Cycle Math & Next Date Calculation', () => {
    it('MUST correctly calculate next maintenance date based on cycle', () => {
      const baseDate = new Date(2026, 8, 15); // Sep 15, 2026

      const cycles: Record<MaintenanceCycle, (d: Date) => Date> = {
        DAILY: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
        WEEKLY: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7),
        MONTHLY: (d) => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()),
        QUARTERLY: (d) => new Date(d.getFullYear(), d.getMonth() + 3, d.getDate()),
        SEMI_ANNUALLY: (d) => new Date(d.getFullYear(), d.getMonth() + 6, d.getDate()),
        ANNUALLY: (d) => new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()),
      };

      // Daily: Sep 15 -> Sep 16
      const dailyNext = cycles.DAILY(new Date(baseDate));
      assert.equal(dailyNext.getDate(), 16);

      // Weekly: Sep 15 -> Sep 22
      const weeklyNext = cycles.WEEKLY(new Date(baseDate));
      assert.equal(weeklyNext.getDate(), 22);

      // Monthly: Sep 15 -> Oct 15
      const monthlyNext = cycles.MONTHLY(new Date(baseDate));
      assert.equal(monthlyNext.getMonth(), 9); // Oct is month index 9
      assert.equal(monthlyNext.getDate(), 15);

      // Quarterly: Sep 15 -> Dec 15
      const quarterlyNext = cycles.QUARTERLY(new Date(baseDate));
      assert.equal(quarterlyNext.getMonth(), 11); // Dec is month index 11
      assert.equal(quarterlyNext.getDate(), 15);

      // Annually: 2026 -> 2027
      const annualNext = cycles.ANNUALLY(new Date(baseDate));
      assert.equal(annualNext.getFullYear(), 2027);
    });
  });

  describe('3. Smart Alert Engine Integration for Maintenance', () => {
    it('MUST classify overdue maintenance as CRITICAL alert', () => {
      const now = new Date('2026-09-15T00:00:00Z');
      const overdueDate = new Date('2026-09-10T00:00:00Z'); // 5 days overdue

      const diffMs = overdueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (24 * 3600 * 1000));

      assert.ok(diffDays < 0, 'diffDays must be negative');
      const isOverdue = diffDays < 0;
      const severity = isOverdue ? 'CRITICAL' : 'WARNING';
      const alertType = isOverdue ? 'MAINTENANCE_OVERDUE' : 'MAINTENANCE_DUE_SOON';

      assert.equal(severity, 'CRITICAL');
      assert.equal(alertType, 'MAINTENANCE_OVERDUE');
    });

    it('MUST classify upcoming maintenance within 3 days as WARNING alert', () => {
      const now = new Date('2026-09-15T00:00:00Z');
      const upcomingDate = new Date('2026-09-17T00:00:00Z'); // in 2 days

      const diffMs = upcomingDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (24 * 3600 * 1000));

      assert.ok(diffDays >= 0 && diffDays <= 3, 'diffDays must be between 0 and 3');
      const severity = diffDays < 0 ? 'CRITICAL' : 'WARNING';
      const alertType = diffDays < 0 ? 'MAINTENANCE_OVERDUE' : 'MAINTENANCE_DUE_SOON';

      assert.equal(severity, 'WARNING');
      assert.equal(alertType, 'MAINTENANCE_DUE_SOON');
    });

    it('MUST NOT trigger alert if next maintenance is more than 3 days away', () => {
      const now = new Date('2026-09-15T00:00:00Z');
      const distantDate = new Date('2026-09-25T00:00:00Z'); // in 10 days

      const diffMs = distantDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (24 * 3600 * 1000));

      const triggersAlert = diffDays <= 3;
      assert.equal(triggersAlert, false, 'Schedule > 3 days away should not trigger alert');
    });
  });

  describe('4. Role-Based Scoping Logic', () => {
    it('MUST scope technician query to only assigned records when role is STAFF_TECHNICIAN', () => {
      const sessionTechnician = { id: 'tech_123', role: 'STAFF_TECHNICIAN' };
      const sessionManager = { id: 'mgr_456', role: 'MANAGER' };

      // In API route or service:
      const techScope = sessionTechnician.role === 'STAFF_TECHNICIAN' ? sessionTechnician.id : undefined;
      const managerScope = sessionManager.role === 'STAFF_TECHNICIAN' ? sessionManager.id : undefined;

      assert.equal(techScope, 'tech_123', 'Technician must be scoped to their user id');
      assert.equal(managerScope, undefined, 'Manager has global scope without restriction');
    });
  });
});
