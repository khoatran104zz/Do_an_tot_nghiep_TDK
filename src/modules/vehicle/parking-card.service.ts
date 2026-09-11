import { parkingCardRepository } from './parking-card.repository';
import { vehicleRepository } from './vehicle.repository';
import {
  ParkingCardFilter,
  CreateParkingCardDto,
  UpdateParkingCardDto,
  LockParkingCardDto,
  VehicleError,
} from './vehicle.types';
import { ParkingCardStatus, VehicleStatus } from '@prisma/client';
import { SessionUser, getVerifiedResidentInfo } from '@/lib/authorization';
import { auditLogService } from '@/modules/audit/audit-log.service';

export class ParkingCardService {
  async getCards(filter: ParkingCardFilter, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(user.id);
      if (!residentInfo?.apartmentId) {
        return { items: [], total: 0, page: 1, limit: filter.limit || 10, totalPages: 0 };
      }
      filter.apartmentId = residentInfo.apartmentId;
    }

    return parkingCardRepository.findAll(filter);
  }

  async getCardById(id: string, user: SessionUser) {
    const card = await parkingCardRepository.findById(id);
    if (!card) {
      throw new VehicleError('Không tìm thấy thẻ gửi xe', 'NOT_FOUND', 404);
    }

    if (user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(user.id);
      if (!residentInfo?.apartmentId || residentInfo.apartmentId !== card.vehicle.apartment.id) {
        throw new VehicleError('Bạn không có quyền truy cập thẻ xe này', 'FORBIDDEN', 403);
      }
    }

    return card;
  }

  async issueCard(vehicleId: string, dto: CreateParkingCardDto, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      throw new VehicleError('Cư dân không có quyền cấp phát thẻ xe', 'FORBIDDEN', 403);
    }

    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new VehicleError('Không tìm thấy phương tiện cần cấp thẻ', 'NOT_FOUND', 404);
    }

    if (vehicle.status !== VehicleStatus.ACTIVE) {
      throw new VehicleError(
        'Chỉ có thể cấp thẻ cho phương tiện đã được duyệt (ACTIVE)',
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    const existingCode = await parkingCardRepository.findByCardCode(dto.cardCode);
    if (existingCode) {
      throw new VehicleError(
        `Mã thẻ "${dto.cardCode.toUpperCase()}" đã được sử dụng trên hệ thống`,
        'VALIDATION_ERROR',
        400
      );
    }

    const existingActive = await parkingCardRepository.findActiveCardByVehicleId(vehicleId);
    if (existingActive) {
      throw new VehicleError(
        `Phương tiện "${vehicle.licensePlate}" đã có thẻ (${existingActive.cardCode}) đang hoạt động. Vui lòng khóa thẻ cũ trước khi cấp thẻ mới.`,
        'DUPLICATE_ACTIVE_CARD',
        400
      );
    }

    const card = await parkingCardRepository.create({
      cardCode: dto.cardCode,
      vehicleId,
      status: dto.status || ParkingCardStatus.ACTIVE,
      issuedAt: new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ISSUE_PARKING_CARD',
      entity: 'PARKING_CARD',
      entityId: card.id,
      metadata: {
        vehicleId,
        licensePlate: vehicle.licensePlate,
        cardCode: card.cardCode,
      },
    });

    return card;
  }

  async updateCard(id: string, dto: UpdateParkingCardDto, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      throw new VehicleError('Cư dân không có quyền chỉnh sửa thẻ xe', 'FORBIDDEN', 403);
    }

    await this.getCardById(id, user);

    const updated = await parkingCardRepository.update(id, {
      expiresAt: dto.expiresAt !== undefined ? (dto.expiresAt ? new Date(dto.expiresAt) : null) : undefined,
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_PARKING_CARD',
      entity: 'PARKING_CARD',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async lockCard(id: string, dto: LockParkingCardDto, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      throw new VehicleError('Cư dân không có quyền khóa thẻ gửi xe', 'FORBIDDEN', 403);
    }

    const card = await this.getCardById(id, user);
    if (card.status === ParkingCardStatus.LOCKED) {
      throw new VehicleError('Thẻ này đã ở trạng thái bị khóa từ trước', 'INVALID_STATUS_TRANSITION', 400);
    }

    const locked = await parkingCardRepository.update(id, {
      status: ParkingCardStatus.LOCKED,
      lockedAt: new Date(),
      lockReason: dto.lockReason.trim(),
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOCK_PARKING_CARD',
      entity: 'PARKING_CARD',
      entityId: id,
      metadata: {
        cardCode: card.cardCode,
        lockReason: dto.lockReason,
      },
    });

    return locked;
  }

  async unlockCard(id: string, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      throw new VehicleError('Cư dân không có quyền mở khóa thẻ gửi xe', 'FORBIDDEN', 403);
    }

    const card = await this.getCardById(id, user);
    if (card.status !== ParkingCardStatus.LOCKED) {
      throw new VehicleError('Thẻ này hiện không bị khóa', 'INVALID_STATUS_TRANSITION', 400);
    }

    const otherActive = await parkingCardRepository.findActiveCardByVehicleId(card.vehicleId, id);
    if (otherActive) {
      throw new VehicleError(
        `Phương tiện đã có thẻ khác (${otherActive.cardCode}) đang hoạt động. Không thể mở khóa thẻ này.`,
        'DUPLICATE_ACTIVE_CARD',
        400
      );
    }

    const unlocked = await parkingCardRepository.update(id, {
      status: ParkingCardStatus.ACTIVE,
      lockedAt: null,
      lockReason: null,
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UNLOCK_PARKING_CARD',
      entity: 'PARKING_CARD',
      entityId: id,
      metadata: {
        cardCode: card.cardCode,
      },
    });

    return unlocked;
  }

  async deleteCard(id: string, user: SessionUser) {
    if (user.role === 'RESIDENT') {
      throw new VehicleError('Cư dân không có quyền xóa thẻ gửi xe', 'FORBIDDEN', 403);
    }

    const card = await this.getCardById(id, user);
    await parkingCardRepository.delete(id);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DELETE_PARKING_CARD',
      entity: 'PARKING_CARD',
      entityId: id,
      metadata: {
        cardCode: card.cardCode,
      },
    });

    return { success: true };
  }
}

export const parkingCardService = new ParkingCardService();
