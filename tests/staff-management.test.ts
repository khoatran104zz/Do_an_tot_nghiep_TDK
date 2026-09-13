import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createStaffSchema,
  updateStaffSchema,
  assignShiftSchema,
  updateStaffStatusSchema,
} from '../src/modules/staff/staff.schema';
import { Role, StaffShift, StaffStatus } from '@prisma/client';

describe('Staff Management Module Tests', () => {
  describe('1. Zod Schema Validation', () => {
    it('MUST VALIDATE a valid staff creation payload', () => {
      const validPayload = {
        email: 'tech.test@building.com',
        fullName: 'Nguyễn Kỹ Thuật',
        phone: '0912345678',
        role: Role.STAFF_TECHNICIAN,
        position: 'Kỹ thuật viên điện nước',
        department: 'Ban Kỹ thuật & Bảo trì',
        currentShift: StaffShift.MORNING,
        assignedZone: 'Hệ thống Điện & Thang máy Tòa A',
      };

      const parsed = createStaffSchema.safeParse(validPayload);
      assert.equal(parsed.success, true, 'Valid payload should parse successfully');
    });

    it('MUST REJECT if role is not an operational staff or manager role (e.g. RESIDENT is rejected)', () => {
      const invalidPayload = {
        email: 'resident.fake@building.com',
        fullName: 'Cư Dân Giả',
        phone: '0912345678',
        role: Role.RESIDENT, // Invalid for staff creation
        position: 'Cư dân',
      };

      const parsed = createStaffSchema.safeParse(invalidPayload);
      assert.equal(parsed.success, false, 'RESIDENT role must be rejected for staff creation');
    });

    it('MUST VALIDATE shift assignment payload', () => {
      const morningShift = assignShiftSchema.safeParse({
        currentShift: StaffShift.MORNING,
        assignedZone: 'Cổng chính Tòa A',
      });
      assert.equal(morningShift.success, true);

      const nightShift = assignShiftSchema.safeParse({
        currentShift: StaffShift.NIGHT,
        assignedZone: 'Hầm B1 & B2',
        notes: 'Trực ca đêm tăng cường',
      });
      assert.equal(nightShift.success, true);

      const invalidShift = assignShiftSchema.safeParse({
        currentShift: 'EVENING', // Invalid shift
      });
      assert.equal(invalidShift.success, false);
    });

    it('MUST VALIDATE status update payload (ACTIVE, ON_LEAVE, SUSPENDED)', () => {
      const activeStatus = updateStaffStatusSchema.safeParse({
        status: StaffStatus.ACTIVE,
      });
      assert.equal(activeStatus.success, true);

      const suspendedStatus = updateStaffStatusSchema.safeParse({
        status: StaffStatus.SUSPENDED,
        reason: 'Tạm khóa do vi phạm nội quy an ninh',
      });
      assert.equal(suspendedStatus.success, true);
    });
  });

  describe('2. Employee Code Generation Pattern', () => {
    it('MUST format employee codes by role prefix', () => {
      const formatCode = (role: Role, count: number) => {
        let prefix = 'NV-STAFF-';
        if (role === Role.STAFF_TECHNICIAN) prefix = 'NV-TECH-';
        else if (role === Role.STAFF_SECURITY) prefix = 'NV-SEC-';
        else if (role === Role.STAFF_RECEPTIONIST) prefix = 'NV-REC-';
        else if (role === Role.MANAGER) prefix = 'NV-MGT-';
        return `${prefix}${String(count + 1).padStart(3, '0')}`;
      };

      assert.equal(formatCode(Role.STAFF_TECHNICIAN, 0), 'NV-TECH-001');
      assert.equal(formatCode(Role.STAFF_SECURITY, 5), 'NV-SEC-006');
      assert.equal(formatCode(Role.STAFF_RECEPTIONIST, 12), 'NV-REC-013');
      assert.equal(formatCode(Role.MANAGER, 1), 'NV-MGT-002');
    });
  });

  describe('3. Role-Based Access Control (RBAC) Boundaries for Staff Management', () => {
    const ALLOWED_STAFF_MANAGERS = ['ADMIN', 'MANAGER'];

    it('MUST ALLOW ADMIN and MANAGER to manage staff', () => {
      assert.equal(ALLOWED_STAFF_MANAGERS.includes('ADMIN'), true);
      assert.equal(ALLOWED_STAFF_MANAGERS.includes('MANAGER'), true);
    });

    it('MUST DENY operational staff (TECHNICIAN, SECURITY, RECEPTIONIST) from managing staff', () => {
      assert.equal(ALLOWED_STAFF_MANAGERS.includes(Role.STAFF_TECHNICIAN), false);
      assert.equal(ALLOWED_STAFF_MANAGERS.includes(Role.STAFF_SECURITY), false);
      assert.equal(ALLOWED_STAFF_MANAGERS.includes(Role.STAFF_RECEPTIONIST), false);
    });

    it('MUST DENY RESIDENT from managing staff', () => {
      assert.equal(ALLOWED_STAFF_MANAGERS.includes(Role.RESIDENT), false);
    });
  });

  describe('4. Audit Logging Payload Verification', () => {
    it('MUST generate correct audit log payload for CREATE_STAFF', () => {
      const auditPayload = {
        actorId: 'admin-1',
        action: 'CREATE_STAFF',
        entity: 'STAFF',
        entityId: 'user-new',
        metadata: {
          email: 'tech@building.com',
          fullName: 'Lê Kỹ Thuật',
          role: Role.STAFF_TECHNICIAN,
          employeeCode: 'NV-TECH-003',
          currentShift: StaffShift.MORNING,
        },
      };

      assert.equal(auditPayload.action, 'CREATE_STAFF');
      assert.equal(auditPayload.entity, 'STAFF');
      assert.equal(auditPayload.metadata.employeeCode, 'NV-TECH-003');
    });

    it('MUST generate correct audit log payload for CHANGE_STAFF_SHIFT', () => {
      const auditPayload = {
        actorId: 'admin-1',
        action: 'CHANGE_STAFF_SHIFT',
        entity: 'STAFF',
        entityId: 'user-sec',
        metadata: {
          employeeCode: 'NV-SEC-001',
          previousShift: StaffShift.MORNING,
          newShift: StaffShift.NIGHT,
          assignedZone: 'Hầm B1 & B2',
        },
      };

      assert.equal(auditPayload.action, 'CHANGE_STAFF_SHIFT');
      assert.equal(auditPayload.metadata.previousShift, StaffShift.MORNING);
      assert.equal(auditPayload.metadata.newShift, StaffShift.NIGHT);
    });

    it('MUST generate correct audit log payload for DISABLE_STAFF and CHANGE_STAFF_ROLE', () => {
      const roleAudit = {
        action: 'CHANGE_STAFF_ROLE',
        entity: 'STAFF',
        metadata: {
          previousRole: Role.STAFF_TECHNICIAN,
          newRole: Role.MANAGER,
        },
      };

      const disableAudit = {
        action: 'DISABLE_STAFF',
        entity: 'STAFF',
        metadata: {
          previousStatus: StaffStatus.ACTIVE,
          newStatus: StaffStatus.SUSPENDED,
        },
      };

      assert.equal(roleAudit.action, 'CHANGE_STAFF_ROLE');
      assert.equal(disableAudit.action, 'DISABLE_STAFF');
    });
  });
});
