import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { staffRepository } from './staff.repository';
import {
  CreateStaffDto,
  UpdateStaffDto,
  AssignShiftDto,
  UpdateStaffStatusDto,
  StaffFilter,
} from './staff.types';
import { auditLogService } from '@/modules/audit/audit-log.service';
import { Role, StaffStatus } from '@prisma/client';

export interface OperatorContext {
  id: string;
  email?: string | null;
  role?: string | null;
  fullName?: string | null;
}

export class StaffService {
  async getStaffList(filter: StaffFilter) {
    return staffRepository.findMany(filter);
  }

  async getStaffById(userId: string) {
    const staff = await staffRepository.findById(userId);
    if (!staff) {
      throw new Error('Không tìm thấy thông tin nhân sự trong hệ thống');
    }
    return staff;
  }

  async getStaffStats() {
    return staffRepository.getStaffStats();
  }

  async createStaff(dto: CreateStaffDto, operator: OperatorContext) {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new Error(`Email ${dto.email} đã được đăng ký tài khoản trong hệ thống`);
    }

    const plainPassword = dto.password || 'Staff@123';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const staff = await staffRepository.create(dto, passwordHash);

    // Record Audit Log
    await auditLogService.record({
      actorId: operator.id,
      actorEmail: operator.email,
      actorRole: operator.role,
      action: 'CREATE_STAFF',
      entity: 'STAFF',
      entityId: staff.id,
      metadata: {
        email: staff.email,
        fullName: staff.fullName,
        role: staff.role,
        employeeCode: staff.staffProfile?.employeeCode,
        position: staff.staffProfile?.position,
        currentShift: staff.staffProfile?.currentShift,
        assignedZone: staff.staffProfile?.assignedZone,
      },
    });

    return staff;
  }

  async updateStaff(userId: string, dto: UpdateStaffDto, operator: OperatorContext) {
    const currentStaff = await staffRepository.findById(userId);
    if (!currentStaff) {
      throw new Error('Không tìm thấy nhân viên');
    }

    const updated = await staffRepository.update(userId, dto);

    // If role changed, record audit
    if (dto.role && dto.role !== currentStaff.role) {
      await auditLogService.record({
        actorId: operator.id,
        actorEmail: operator.email,
        actorRole: operator.role,
        action: 'CHANGE_STAFF_ROLE',
        entity: 'STAFF',
        entityId: userId,
        metadata: {
          previousRole: currentStaff.role,
          newRole: dto.role,
          employeeCode: updated.staffProfile?.employeeCode,
        },
      });
    }

    // If shift or zone changed, record audit
    if (
      dto.currentShift &&
      currentStaff.staffProfile &&
      dto.currentShift !== currentStaff.staffProfile.currentShift
    ) {
      await auditLogService.record({
        actorId: operator.id,
        actorEmail: operator.email,
        actorRole: operator.role,
        action: 'CHANGE_STAFF_SHIFT',
        entity: 'STAFF',
        entityId: userId,
        metadata: {
          previousShift: currentStaff.staffProfile.currentShift,
          newShift: dto.currentShift,
          assignedZone: dto.assignedZone || updated.staffProfile?.assignedZone,
        },
      });
    }

    return updated;
  }

  async assignShift(userId: string, dto: AssignShiftDto, operator: OperatorContext) {
    const currentStaff = await staffRepository.findById(userId);
    if (!currentStaff) {
      throw new Error('Không tìm thấy nhân viên');
    }

    const updated = await staffRepository.updateShift(userId, dto);

    // Record audit log
    await auditLogService.record({
      actorId: operator.id,
      actorEmail: operator.email,
      actorRole: operator.role,
      action: 'CHANGE_STAFF_SHIFT',
      entity: 'STAFF',
      entityId: userId,
      metadata: {
        employeeCode: currentStaff.staffProfile?.employeeCode,
        fullName: currentStaff.fullName,
        previousShift: currentStaff.staffProfile?.currentShift,
        newShift: dto.currentShift,
        assignedZone: dto.assignedZone,
        notes: dto.notes,
      },
    });

    return updated;
  }

  async updateStatus(userId: string, dto: UpdateStaffStatusDto, operator: OperatorContext) {
    const currentStaff = await staffRepository.findById(userId);
    if (!currentStaff) {
      throw new Error('Không tìm thấy nhân viên');
    }

    // Prevent deactivating own account
    if (userId === operator.id) {
      throw new Error('Bạn không thể tự khóa tài khoản của chính mình');
    }

    const [, updatedProfile] = await staffRepository.updateStatus(userId, dto.status);

    const isDeactivating =
      dto.status === StaffStatus.SUSPENDED || dto.status === StaffStatus.TERMINATED;

    await auditLogService.record({
      actorId: operator.id,
      actorEmail: operator.email,
      actorRole: operator.role,
      action: isDeactivating ? 'DISABLE_STAFF' : 'ACTIVATE_STAFF',
      entity: 'STAFF',
      entityId: userId,
      metadata: {
        employeeCode: currentStaff.staffProfile?.employeeCode,
        fullName: currentStaff.fullName,
        previousStatus: currentStaff.staffProfile?.status,
        newStatus: dto.status,
        reason: dto.reason,
      },
    });

    return updatedProfile;
  }
}

export const staffService = new StaffService();
