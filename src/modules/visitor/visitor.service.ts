import { visitorRepository } from './visitor.repository';
import {
  VisitorPassFilter,
  CreateVisitorPassDto,
  UserContext,
} from './visitor.types';
import { prisma } from '@/lib/prisma';
import { auditLogService } from '@/modules/audit/audit-log.service';

export class VisitorService {
  async getVisitorPasses(filter: VisitorPassFilter, user: UserContext) {
    let scopedApartmentId: string | undefined;

    // IDOR Enforcement: If user is RESIDENT, scope strictly to their apartment!
    if (user.role === 'RESIDENT') {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
      });
      if (!resident || !resident.apartmentId) {
        return { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };
      }
      scopedApartmentId = resident.apartmentId;
    }

    return visitorRepository.findPasses(filter, scopedApartmentId);
  }

  async getPassById(id: string, user: UserContext) {
    const pass = await visitorRepository.findPassById(id);
    if (!pass) {
      throw new Error('Không tìm thấy thẻ khách');
    }

    // Resident can only view their own apartment passes
    if (user.role === 'RESIDENT') {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
      });
      if (pass.apartmentId !== resident?.apartmentId) {
        throw new Error('Bạn không có quyền xem thẻ khách của căn hộ khác');
      }
    }

    return pass;
  }

  async createVisitorPass(data: CreateVisitorPassDto, user: UserContext) {
    let targetApartmentId = data.apartmentId;
    let residentId: string | undefined;

    if (user.role === 'RESIDENT') {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
      });
      if (!resident || !resident.apartmentId) {
        throw new Error('Cư dân chưa được gắn với căn hộ hợp lệ');
      }
      targetApartmentId = resident.apartmentId;
      residentId = resident.id;
    } else {
      // Management creating on behalf of an apartment
      if (!targetApartmentId) {
        throw new Error('Vui lòng chọn căn hộ đón khách');
      }
    }

    const pass = await visitorRepository.createPass(
      data,
      user.id,
      targetApartmentId,
      residentId
    );

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_VISITOR_PASS',
      entity: 'VISITOR_PASS',
      entityId: pass.id,
      metadata: {
        passCode: pass.passCode,
        visitorName: pass.visitorName,
        visitorPhone: pass.visitorPhone,
        apartmentCode: pass.apartment.code,
        visitDate: pass.visitDate,
        expectedTime: pass.expectedTime,
      },
    });

    return pass;
  }

  async scanAndValidate(passCodeOrQr: string) {
    return visitorRepository.scanAndValidate(passCodeOrQr);
  }

  async checkInVisitor(id: string, securityUser: UserContext) {
    const pass = await visitorRepository.checkIn(id, securityUser.id);

    await auditLogService.record({
      actorId: securityUser.id,
      actorEmail: securityUser.email,
      actorRole: securityUser.role,
      action: 'CHECK_IN_VISITOR',
      entity: 'VISITOR_PASS',
      entityId: pass.id,
      metadata: {
        passCode: pass.passCode,
        visitorName: pass.visitorName,
        apartmentCode: pass.apartment.code,
        checkInAt: pass.checkInAt,
        securityOfficer: securityUser.fullName || securityUser.email,
      },
    });

    return pass;
  }

  async checkOutVisitor(id: string, securityUser: UserContext) {
    const pass = await visitorRepository.checkOut(id, securityUser.id);

    await auditLogService.record({
      actorId: securityUser.id,
      actorEmail: securityUser.email,
      actorRole: securityUser.role,
      action: 'CHECK_OUT_VISITOR',
      entity: 'VISITOR_PASS',
      entityId: pass.id,
      metadata: {
        passCode: pass.passCode,
        visitorName: pass.visitorName,
        apartmentCode: pass.apartment.code,
        checkOutAt: pass.checkOutAt,
        securityOfficer: securityUser.fullName || securityUser.email,
      },
    });

    return pass;
  }

  async cancelVisitorPass(id: string, reason: string | undefined, user: UserContext) {
    const pass = await this.getPassById(id, user);

    const cancelled = await visitorRepository.cancelPass(id, reason);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CANCEL_VISITOR_PASS',
      entity: 'VISITOR_PASS',
      entityId: pass.id,
      metadata: {
        passCode: pass.passCode,
        reason: reason || 'Người dùng hủy',
      },
    });

    return cancelled;
  }

  async getStats(buildingIds?: string[]) {
    return visitorRepository.getStats(buildingIds);
  }
}

export const visitorService = new VisitorService();
