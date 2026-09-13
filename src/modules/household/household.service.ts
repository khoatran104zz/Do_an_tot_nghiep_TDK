import { prisma } from '@/lib/prisma';
import {
  CreateResidenceRequestDto,
  ResidenceRequestFilter,
  ReviewResidenceRequestDto,
} from './household.types';
import { householdRepository } from './household.repository';
import { auditLogService } from '@/modules/audit/audit-log.service';
import {
  ApartmentHistoryEvent,
  ApartmentStatus,
  ResidenceRequestStatus,
  ResidenceRequestType,
  ResidentRelationship,
  ResidentStatus,
} from '@prisma/client';

export interface ReviewerContext {
  id: string;
  email?: string | null;
  role?: string | null;
  fullName?: string | null;
}

export class HouseholdService {
  /**
   * Submit a new residence request (e.g. temporary residence, member, move in/out)
   */
  async submitRequest(requesterId: string, dto: CreateResidenceRequestDto) {
    const apartment = await prisma.apartment.findUnique({
      where: { id: dto.apartmentId },
    });

    if (!apartment) {
      throw new Error('Căn hộ không tồn tại trong hệ thống');
    }

    const request = await householdRepository.create(requesterId, dto);

    // Record audit log
    await auditLogService.record({
      actorId: requesterId,
      action: 'SUBMIT_RESIDENCE_REQUEST',
      entity: 'RESIDENCE_REQUEST',
      entityId: request.id,
      metadata: {
        code: request.code,
        type: request.type,
        apartmentId: dto.apartmentId,
        apartmentCode: apartment.code,
        fullName: dto.fullName,
        identityCard: dto.identityCard,
      },
    });

    return request;
  }

  async getRequests(filter: ResidenceRequestFilter) {
    return householdRepository.findMany(filter);
  }

  async getRequestById(id: string) {
    return householdRepository.findById(id);
  }

  async getHouseholdByApartmentId(apartmentId: string) {
    return householdRepository.getHouseholdByApartmentId(apartmentId);
  }

  async countPending(apartmentId?: string) {
    return householdRepository.countPending(apartmentId);
  }

  /**
   * Review a residence request: Approve or Reject
   * On approval, execute the required workflow side effects on Resident & ApartmentHistory
   */
  async reviewRequest(
    requestId: string,
    reviewer: ReviewerContext,
    dto: ReviewResidenceRequestDto
  ) {
    const request = await householdRepository.findById(requestId);
    if (!request) {
      throw new Error('Yêu cầu cư trú không tồn tại');
    }

    if (request.status !== ResidenceRequestStatus.PENDING) {
      throw new Error(`Yêu cầu này đã được xử lý (trạng thái: ${request.status})`);
    }

    const performerName = reviewer.fullName || reviewer.email || 'Ban Quản Lý';

    // 1. If REJECTED
    if (dto.action === 'REJECT') {
      const updated = await householdRepository.updateReviewStatus(requestId, {
        status: ResidenceRequestStatus.REJECTED,
        reviewerId: reviewer.id,
        reviewedAt: new Date(),
        rejectReason: dto.rejectReason || 'Từ chối bởi Ban Quản Lý',
      });

      await auditLogService.record({
        actorId: reviewer.id,
        actorEmail: reviewer.email,
        actorRole: reviewer.role,
        action: 'REJECT_RESIDENCE_REQUEST',
        entity: 'RESIDENCE_REQUEST',
        entityId: request.id,
        metadata: {
          code: request.code,
          type: request.type,
          apartmentId: request.apartmentId,
          rejectReason: dto.rejectReason,
        },
      });

      return updated;
    }

    // 2. If APPROVED
    // Update request record first
    const updated = await householdRepository.updateReviewStatus(requestId, {
      status: ResidenceRequestStatus.APPROVED,
      reviewerId: reviewer.id,
      reviewedAt: new Date(),
    });

    // Execute side effects based on request type
    await this.applyApprovalSideEffects(request, performerName);

    // Record audit log
    await auditLogService.record({
      actorId: reviewer.id,
      actorEmail: reviewer.email,
      actorRole: reviewer.role,
      action: 'APPROVE_RESIDENCE_REQUEST',
      entity: 'RESIDENCE_REQUEST',
      entityId: request.id,
      metadata: {
        code: request.code,
        type: request.type,
        apartmentId: request.apartmentId,
        fullName: request.fullName,
      },
    });

    return updated;
  }

  private async applyApprovalSideEffects(request: any, performerName: string) {
    const aptId = request.apartmentId;

    switch (request.type) {
      case ResidenceRequestType.ADD_MEMBER: {
        // Upsert resident with FAMILY relationship and RESIDING status
        const resident = await prisma.resident.upsert({
          where: { identityCard: request.identityCard },
          update: {
            apartmentId: aptId,
            fullName: request.fullName,
            phone: request.phone,
            relationshipToOwner: ResidentRelationship.FAMILY,
            status: ResidentStatus.RESIDING,
          },
          create: {
            apartmentId: aptId,
            fullName: request.fullName,
            identityCard: request.identityCard,
            phone: request.phone,
            relationshipToOwner: ResidentRelationship.FAMILY,
            status: ResidentStatus.RESIDING,
          },
        });

        // Record ApartmentHistory
        await prisma.apartmentHistory.create({
          data: {
            apartmentId: aptId,
            event: ApartmentHistoryEvent.RESIDENT_MOVE_IN,
            title: `Thêm thành viên hộ gia đình: ${request.fullName}`,
            description: `Yêu cầu ${request.code} đã được duyệt. Thêm thành viên mới vào căn hộ.`,
            residentId: resident.id,
            residentName: resident.fullName,
            performedBy: performerName,
          },
        });
        break;
      }

      case ResidenceRequestType.MOVE_IN: {
        const isTenant = request.relationship === ResidentRelationship.TENANT;
        const rel = isTenant ? ResidentRelationship.TENANT : (request.relationship || ResidentRelationship.FAMILY);

        const resident = await prisma.resident.upsert({
          where: { identityCard: request.identityCard },
          update: {
            apartmentId: aptId,
            fullName: request.fullName,
            phone: request.phone,
            relationshipToOwner: rel,
            status: ResidentStatus.RESIDING,
          },
          create: {
            apartmentId: aptId,
            fullName: request.fullName,
            identityCard: request.identityCard,
            phone: request.phone,
            relationshipToOwner: rel,
            status: ResidentStatus.RESIDING,
          },
        });

        // If apartment is VACANT, switch to OCCUPIED
        const currentApt = await prisma.apartment.findUnique({ where: { id: aptId } });
        if (currentApt && currentApt.status === ApartmentStatus.VACANT) {
          await prisma.apartment.update({
            where: { id: aptId },
            data: { status: ApartmentStatus.OCCUPIED },
          });
          await prisma.apartmentHistory.create({
            data: {
              apartmentId: aptId,
              event: ApartmentHistoryEvent.STATUS_CHANGE,
              title: 'Căn hộ chuyển sang trạng thái Đang ở (OCCUPIED)',
              description: `Cư dân ${request.fullName} chuyển vào sinh sống theo yêu cầu ${request.code}`,
              fromStatus: ApartmentStatus.VACANT,
              toStatus: ApartmentStatus.OCCUPIED,
              performedBy: performerName,
            },
          });
        }

        await prisma.apartmentHistory.create({
          data: {
            apartmentId: aptId,
            event: isTenant ? ApartmentHistoryEvent.TENANT_MOVE_IN : ApartmentHistoryEvent.RESIDENT_MOVE_IN,
            title: `${isTenant ? 'Khách thuê' : 'Cư dân'} chuyển vào: ${request.fullName}`,
            description: `Duyệt yêu cầu dọn vào ${request.code}. Ghi nhận cư trú hợp lệ.`,
            residentId: resident.id,
            residentName: resident.fullName,
            performedBy: performerName,
          },
        });
        break;
      }

      case ResidenceRequestType.MOVE_OUT: {
        // Find existing resident
        const resident = await prisma.resident.findFirst({
          where: {
            apartmentId: aptId,
            OR: [
              { identityCard: request.identityCard },
              { phone: request.phone },
            ],
          },
        });

        if (resident) {
          await prisma.resident.update({
            where: { id: resident.id },
            data: { status: ResidentStatus.MOVED_OUT },
          });
        }

        const isTenant = resident?.relationshipToOwner === ResidentRelationship.TENANT;

        await prisma.apartmentHistory.create({
          data: {
            apartmentId: aptId,
            event: isTenant ? ApartmentHistoryEvent.TENANT_MOVE_OUT : ApartmentHistoryEvent.RESIDENT_MOVE_OUT,
            title: `Cư dân hoàn tất chuyển đi: ${request.fullName}`,
            description: `Duyệt yêu cầu chuyển đi ${request.code}. Cập nhật trạng thái MOVED_OUT.`,
            residentId: resident?.id || null,
            residentName: request.fullName,
            performedBy: performerName,
          },
        });
        break;
      }

      case ResidenceRequestType.TEMPORARY_RESIDENCE: {
        // Register temporary residence
        const resident = await prisma.resident.upsert({
          where: { identityCard: request.identityCard },
          update: {
            apartmentId: aptId,
            fullName: request.fullName,
            phone: request.phone,
            relationshipToOwner: ResidentRelationship.TEMPORARY_RESIDENT,
            status: ResidentStatus.RESIDING,
          },
          create: {
            apartmentId: aptId,
            fullName: request.fullName,
            identityCard: request.identityCard,
            phone: request.phone,
            relationshipToOwner: ResidentRelationship.TEMPORARY_RESIDENT,
            status: ResidentStatus.RESIDING,
          },
        });

        const startStr = request.startDate ? new Date(request.startDate).toLocaleDateString('vi-VN') : 'Hiện tại';
        const endStr = request.endDate ? new Date(request.endDate).toLocaleDateString('vi-VN') : 'Không xác định';

        await prisma.apartmentHistory.create({
          data: {
            apartmentId: aptId,
            event: ApartmentHistoryEvent.RESIDENT_MOVE_IN,
            title: `Đăng ký tạm trú: ${request.fullName}`,
            description: `Duyệt tạm trú từ ${startStr} đến ${endStr}. Yêu cầu: ${request.code}. Ghi chú: ${request.note || 'Không'}`,
            residentId: resident.id,
            residentName: resident.fullName,
            performedBy: performerName,
          },
        });
        break;
      }

      case ResidenceRequestType.TEMPORARY_ABSENCE: {
        // Register temporary absence
        const resident = await prisma.resident.findFirst({
          where: {
            apartmentId: aptId,
            OR: [
              { identityCard: request.identityCard },
              { phone: request.phone },
            ],
          },
        });

        if (resident) {
          await prisma.resident.update({
            where: { id: resident.id },
            data: { status: ResidentStatus.TEMPORARY_ABSENT },
          });
        }

        const startStr = request.startDate ? new Date(request.startDate).toLocaleDateString('vi-VN') : 'Hiện tại';
        const endStr = request.endDate ? new Date(request.endDate).toLocaleDateString('vi-VN') : 'Không xác định';

        await prisma.apartmentHistory.create({
          data: {
            apartmentId: aptId,
            event: ApartmentHistoryEvent.STATUS_CHANGE,
            title: `Đăng ký tạm vắng: ${request.fullName}`,
            description: `Duyệt tạm vắng từ ${startStr} đến ${endStr}. Yêu cầu: ${request.code}. Ghi chú: ${request.note || 'Không'}`,
            residentId: resident?.id || null,
            residentName: request.fullName,
            performedBy: performerName,
          },
        });
        break;
      }
    }
  }
}

export const householdService = new HouseholdService();
