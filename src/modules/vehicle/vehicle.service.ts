import { vehicleRepository } from './vehicle.repository';
import { parkingCardRepository } from './parking-card.repository';
import { parkingCardService } from './parking-card.service';
import {
  VehicleFilter,
  CreateVehicleDto,
  UpdateVehicleDto,
  ApproveVehicleDto,
  RejectVehicleDto,
  VehicleError,
} from './vehicle.types';
import { VehicleStatus } from '@prisma/client';
import { SessionUser, getVerifiedResidentInfo, authorizeVehicleAccess } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { auditLogService } from '@/modules/audit/audit-log.service';

export class VehicleService {
  async getVehicles(filter: VehicleFilter, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(user.id);
      if (!residentInfo?.apartmentId) {
        return { items: [], total: 0, page: 1, limit: filter.limit || 10, totalPages: 0 };
      }
      filter.apartmentId = residentInfo.apartmentId;
    }

    return vehicleRepository.findAll(filter);
  }

  async getVehicleById(id: string, user: SessionUser) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new VehicleError('Không tìm thấy phương tiện', 'NOT_FOUND', 404);
    }

    if (user.role === 'RESIDENT') {
      const auth = await authorizeVehicleAccess(user, vehicle.apartmentId);
      if (!auth.allowed) {
        throw new VehicleError('Bạn không có quyền truy cập phương tiện của căn hộ khác', 'FORBIDDEN', 403);
      }
    }

    const timeline = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: 'VEHICLE', entityId: id },
          { entityId: id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { ...vehicle, timeline };
  }

  async createVehicle(dto: CreateVehicleDto, user: SessionUser) {
    // 1. Check duplicate normalized license plate across the entire database
    const duplicate = await vehicleRepository.findByNormalizedPlate(dto.licensePlate);
    if (duplicate) {
      throw new VehicleError(
        `Biển số xe "${dto.licensePlate.toUpperCase()}" đã được đăng ký trên hệ thống (${duplicate.licensePlate})`,
        'DUPLICATE_LICENSE_PLATE',
        400
      );
    }

    let finalApartmentId: string;
    let finalResidentId: string | null = null;
    let finalStatus: VehicleStatus = VehicleStatus.PENDING_APPROVAL;

    if (user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(user.id);
      if (!residentInfo || !residentInfo.apartmentId) {
        throw new VehicleError('Tài khoản cư dân chưa được gán vào căn hộ', 'INVALID_APARTMENT', 403);
      }

      // If client attempted to pass another apartment ID, strictly reject
      if (dto.apartmentId && dto.apartmentId !== residentInfo.apartmentId) {
        throw new VehicleError(
          'Bạn không có quyền đăng ký phương tiện cho căn hộ khác',
          'INVALID_APARTMENT',
          403
        );
      }

      finalApartmentId = residentInfo.apartmentId;
      finalResidentId = residentInfo.id;
      finalStatus = VehicleStatus.PENDING_APPROVAL; // Enforce rule: resident creation always starts at PENDING_APPROVAL
    } else {
      // ADMIN or MANAGER
      if (!dto.apartmentId) {
        throw new VehicleError('Vui lòng chọn căn hộ cho phương tiện', 'INVALID_APARTMENT', 400);
      }

      const apartment = await prisma.apartment.findUnique({
        where: { id: dto.apartmentId },
      });
      if (!apartment) {
        throw new VehicleError('Căn hộ được chọn không tồn tại', 'INVALID_APARTMENT', 400);
      }

      finalApartmentId = dto.apartmentId;

      if (dto.residentId) {
        const resident = await prisma.resident.findUnique({
          where: { id: dto.residentId },
        });
        if (!resident || resident.apartmentId !== finalApartmentId) {
          throw new VehicleError('Cư dân được chọn không thuộc căn hộ này', 'INVALID_RESIDENT', 400);
        }
        finalResidentId = dto.residentId;
      }

      finalStatus = dto.status || VehicleStatus.ACTIVE;
    }

    const created = await vehicleRepository.create({
      licensePlate: dto.licensePlate,
      type: dto.type,
      brand: dto.brand,
      model: dto.model,
      color: dto.color,
      apartmentId: finalApartmentId,
      residentId: finalResidentId,
      registrationDocumentUrl: dto.registrationDocumentUrl,
      status: finalStatus,
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_VEHICLE',
      entity: 'VEHICLE',
      entityId: created.id,
      metadata: {
        licensePlate: created.licensePlate,
        type: created.type,
        apartmentId: finalApartmentId,
        status: finalStatus,
      },
    });

    return created;
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto, user: SessionUser) {
    const vehicle = await this.getVehicleById(id, user);

    if (user.role === 'RESIDENT') {
      if (vehicle.status !== VehicleStatus.PENDING_APPROVAL) {
        throw new VehicleError(
          'Chỉ có thể chỉnh sửa thông tin xe khi hồ sơ đang chờ duyệt',
          'FORBIDDEN',
          403
        );
      }
      // Strips manager-only fields from resident payload
      delete dto.apartmentId;
      delete dto.residentId;
    }

    if (dto.licensePlate && dto.licensePlate.trim().toUpperCase() !== vehicle.licensePlate) {
      if (user.role === 'RESIDENT') {
        throw new VehicleError('Cư dân không thể tự đổi biển số xe sau khi gửi', 'FORBIDDEN', 403);
      }

      const duplicate = await vehicleRepository.findByNormalizedPlate(dto.licensePlate, id);
      if (duplicate) {
        throw new VehicleError(
          `Biển số xe "${dto.licensePlate.toUpperCase()}" đã trùng với phương tiện khác`,
          'DUPLICATE_LICENSE_PLATE',
          400
        );
      }
    }

    if (dto.apartmentId && dto.apartmentId !== vehicle.apartmentId) {
      const apartment = await prisma.apartment.findUnique({ where: { id: dto.apartmentId } });
      if (!apartment) {
        throw new VehicleError('Căn hộ mới không tồn tại', 'INVALID_APARTMENT', 400);
      }
    }

    if (dto.residentId) {
      const targetApartmentId = dto.apartmentId || vehicle.apartmentId;
      const resident = await prisma.resident.findUnique({ where: { id: dto.residentId } });
      if (!resident || resident.apartmentId !== targetApartmentId) {
        throw new VehicleError('Cư dân được chọn không thuộc căn hộ này', 'INVALID_RESIDENT', 400);
      }
    }

    const updated = await vehicleRepository.update(id, dto);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_VEHICLE',
      entity: 'VEHICLE',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async deleteVehicle(id: string, user: SessionUser) {
    const vehicle = await this.getVehicleById(id, user);

    if (user.role === 'RESIDENT') {
      if (vehicle.status !== VehicleStatus.PENDING_APPROVAL) {
        throw new VehicleError(
          'Cư dân chỉ có thể hủy đơn đăng ký xe khi xe đang ở trạng thái chờ duyệt',
          'FORBIDDEN',
          403
        );
      }
    }

    await vehicleRepository.delete(id);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DELETE_VEHICLE',
      entity: 'VEHICLE',
      entityId: id,
      metadata: {
        licensePlate: vehicle.licensePlate,
        apartmentId: vehicle.apartmentId,
      },
    });

    return { success: true };
  }

  async approveVehicle(id: string, dto: ApproveVehicleDto, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      throw new VehicleError('Cư dân không có quyền phê duyệt phương tiện', 'FORBIDDEN', 403);
    }

    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new VehicleError('Không tìm thấy phương tiện', 'NOT_FOUND', 404);
    }

    if (vehicle.status !== VehicleStatus.PENDING_APPROVAL) {
      throw new VehicleError(
        'Chỉ có thể duyệt phương tiện đang ở trạng thái chờ duyệt (PENDING_APPROVAL)',
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    await vehicleRepository.update(id, { status: VehicleStatus.ACTIVE });

    // Optional: issue card immediately upon approval if cardCode supplied
    if (dto.cardCode) {
      await parkingCardService.issueCard(
        id,
        {
          cardCode: dto.cardCode,
          expiresAt: dto.expiresAt,
        },
        user
      );
    }

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'APPROVE_VEHICLE',
      entity: 'VEHICLE',
      entityId: id,
      metadata: {
        licensePlate: vehicle.licensePlate,
        cardCode: dto.cardCode || null,
      },
    });

    return vehicleRepository.findById(id);
  }

  async rejectVehicle(id: string, dto: RejectVehicleDto, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      throw new VehicleError('Cư dân không có quyền từ chối phương tiện', 'FORBIDDEN', 403);
    }

    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new VehicleError('Không tìm thấy phương tiện', 'NOT_FOUND', 404);
    }

    if (vehicle.status !== VehicleStatus.PENDING_APPROVAL) {
      throw new VehicleError(
        'Chỉ có thể từ chối phương tiện đang ở trạng thái chờ duyệt (PENDING_APPROVAL)',
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    const updated = await vehicleRepository.update(id, { status: VehicleStatus.REJECTED });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'REJECT_VEHICLE',
      entity: 'VEHICLE',
      entityId: id,
      metadata: {
        licensePlate: vehicle.licensePlate,
        reason: dto.reason,
      },
    });

    return updated;
  }

  async deactivateVehicle(id: string, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      throw new VehicleError('Cư dân không có quyền hủy kích hoạt phương tiện', 'FORBIDDEN', 403);
    }

    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new VehicleError('Không tìm thấy phương tiện', 'NOT_FOUND', 404);
    }

    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new VehicleError('Phương tiện đã ngừng hoạt động từ trước', 'INVALID_STATUS_TRANSITION', 400);
    }

    // Update vehicle to INACTIVE
    const updated = await vehicleRepository.update(id, { status: VehicleStatus.INACTIVE });

    // Business Rule 4: Automatically lock all active parking cards for this vehicle
    await parkingCardRepository.lockAllActiveByVehicleId(
      id,
      'Phương tiện đã chuyển sang trạng thái ngừng hoạt động (INACTIVE)'
    );

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DEACTIVATE_VEHICLE',
      entity: 'VEHICLE',
      entityId: id,
      metadata: {
        licensePlate: vehicle.licensePlate,
      },
    });

    return updated;
  }
}

export const vehicleService = new VehicleService();
