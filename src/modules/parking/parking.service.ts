import { prisma } from '@/lib/prisma';
import { parkingRepository } from './parking.repository';
import {
  ParkingAreaFilter,
  ParkingSlotFilter,
  ParkingRequestFilter,
  ParkingAccessLogFilter,
  CreateParkingAreaDto,
  UpdateParkingAreaDto,
  CreateParkingZoneDto,
  UpdateParkingZoneDto,
  CreateParkingSlotDto,
  UpdateParkingSlotDto,
  CreateParkingRequestDto,
  ReviewParkingRequestDto,
  AssignSlotDto,
  GateCheckInDto,
  GateCheckOutDto,
  ParkingError,
  GlobalParkingOverview,
} from './parking.types';
import {
  ParkingSlotStatus,
  ParkingRequestStatus,
  ParkingAssignmentStatus,
  ParkingLogDirection,
  ParkingLogStatus,
  Role,
  VehicleStatus,
} from '@prisma/client';
import {
  SessionUser,
  getVerifiedResidentInfo,
  getManagerAssignedBuildingIds,
} from '@/lib/authorization';
import { auditLogService } from '@/modules/audit/audit-log.service';
import crypto from 'crypto';

export class ParkingService {
  // ==========================================================================
  // SCOPE ENFORCEMENT HELPERS
  // ==========================================================================
  private async getManagerScope(user: SessionUser): Promise<string[] | undefined> {
    if (user.role === Role.ADMIN || user.role === 'ADMIN') {
      return undefined; // Global access
    }
    if (user.role === Role.MANAGER || user.role === 'MANAGER') {
      const assigned = user.assignedBuildingIds?.length
        ? user.assignedBuildingIds
        : await getManagerAssignedBuildingIds(user.id);
      return assigned;
    }
    return undefined;
  }

  private async verifyBuildingAccess(user: SessionUser, buildingId: string): Promise<void> {
    if (user.role === Role.ADMIN || user.role === 'ADMIN') return;
    if (user.role === Role.MANAGER || user.role === 'MANAGER') {
      const assigned = await this.getManagerScope(user);
      if (!assigned || !assigned.includes(buildingId)) {
        throw new ParkingError(
          'Bạn không có quyền quản lý bãi đỗ xe của tòa nhà này',
          'FORBIDDEN',
          403
        );
      }
    }
  }

  // ==========================================================================
  // PARKING AREAS & ZONES
  // ==========================================================================
  async getAreas(filter: ParkingAreaFilter, user: SessionUser) {
    if (user.role === Role.MANAGER || user.role === 'MANAGER') {
      const assigned = await this.getManagerScope(user);
      if (assigned && assigned.length > 0) {
        if (filter.buildingId && !assigned.includes(filter.buildingId)) {
          throw new ParkingError('Bạn không có quyền truy cập tòa nhà này', 'FORBIDDEN', 403);
        }
        if (!filter.buildingId) {
          filter.buildingId = assigned[0]; // Default to first assigned
        }
      }
    }

    const areas = await parkingRepository.findAreas(filter);

    // Attach real-time computed occupancy to each area
    const areasWithMetrics = await Promise.all(
      areas.map(async (area) => {
        const metrics = await parkingRepository.calculateAreaOccupancy(area.id);
        return {
          ...area,
          metrics,
        };
      })
    );

    return areasWithMetrics;
  }

  async getAreaById(id: string, user: SessionUser) {
    const area = await parkingRepository.findAreaById(id);
    if (!area) {
      throw new ParkingError('Không tìm thấy khu vực bãi đỗ xe', 'NOT_FOUND', 404);
    }

    if (user.role === Role.MANAGER || user.role === 'MANAGER') {
      await this.verifyBuildingAccess(user, area.buildingId);
    }

    const metrics = await parkingRepository.calculateAreaOccupancy(id);

    // If resident: mask private owner info from slots
    const isResident = user.role === Role.RESIDENT || user.role === 'RESIDENT';
    const sanitizedZones = area.zones.map((zone) => ({
      ...zone,
      slots: zone.slots.map((slot) => {
        if (isResident) {
          return {
            ...slot,
            assignments: [], // residents do not see other people's assignment details
          };
        }
        return slot;
      }),
    }));

    return {
      ...area,
      zones: sanitizedZones,
      metrics,
    };
  }

  async createArea(dto: CreateParkingAreaDto, user: SessionUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ParkingError('Chỉ BQL và Quản trị viên mới được tạo khu vực bãi đỗ', 'FORBIDDEN', 403);
    }

    await this.verifyBuildingAccess(user, dto.buildingId);

    const existing = await parkingRepository.findAreaByCode(dto.buildingId, dto.code);
    if (existing) {
      throw new ParkingError(
        `Khu vực với mã "${dto.code}" đã tồn tại trong tòa nhà này`,
        'DUPLICATE_CODE',
        400
      );
    }

    const area = await parkingRepository.createArea({
      building: { connect: { id: dto.buildingId } },
      code: dto.code.toUpperCase(),
      name: dto.name,
      floor: dto.floor ?? -1,
      totalCapacity: dto.totalCapacity ?? 0,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'CREATE_PARKING_AREA',
      entity: 'PARKING_AREA',
      entityId: area.id,
      metadata: { code: area.code, name: area.name, buildingId: dto.buildingId },
    });

    return area;
  }

  async updateArea(id: string, dto: UpdateParkingAreaDto, user: SessionUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ParkingError('Bạn không có quyền chỉnh sửa khu vực bãi đỗ', 'FORBIDDEN', 403);
    }

    const area = await parkingRepository.findAreaById(id);
    if (!area) throw new ParkingError('Không tìm thấy khu vực bãi đỗ', 'NOT_FOUND', 404);

    await this.verifyBuildingAccess(user, area.buildingId);

    const updated = await parkingRepository.updateArea(id, dto);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'UPDATE_PARKING_AREA',
      entity: 'PARKING_AREA',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  // --------------------------------------------------------------------------
  // ZONES
  // --------------------------------------------------------------------------
  async createZone(dto: CreateParkingZoneDto, user: SessionUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ParkingError('Bạn không có quyền tạo phân khu bãi đỗ', 'FORBIDDEN', 403);
    }

    const area = await parkingRepository.findAreaById(dto.areaId);
    if (!area) throw new ParkingError('Không tìm thấy khu vực bãi đỗ', 'NOT_FOUND', 404);

    await this.verifyBuildingAccess(user, area.buildingId);

    const zone = await parkingRepository.createZone({
      area: { connect: { id: dto.areaId } },
      code: dto.code.toUpperCase(),
      name: dto.name,
      vehicleType: dto.vehicleType,
      colorHex: dto.colorHex || '#0F6B4F',
      totalSlots: dto.totalSlots || 0,
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'CREATE_PARKING_ZONE',
      entity: 'PARKING_ZONE',
      entityId: zone.id,
      metadata: { code: zone.code, name: zone.name, areaId: dto.areaId },
    });

    return zone;
  }

  // --------------------------------------------------------------------------
  // SLOTS & INTERACTIVE MAP
  // --------------------------------------------------------------------------
  async getSlots(filter: ParkingSlotFilter, user: SessionUser) {
    if (user.role === Role.MANAGER || user.role === 'MANAGER') {
      const assigned = await this.getManagerScope(user);
      if (assigned && assigned.length > 0 && !filter.buildingId) {
        filter.buildingId = assigned[0];
      }
    }

    const result = await parkingRepository.findSlots(filter);

    // If resident: mask other residents' private data
    if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
      result.items = result.items.map((slot) => ({
        ...slot,
        assignments: [],
      }));
    }

    return result;
  }

  async getSlotById(id: string, user: SessionUser) {
    const slot = await parkingRepository.findSlotById(id);
    if (!slot) throw new ParkingError('Không tìm thấy vị trí đỗ xe', 'NOT_FOUND', 404);

    if (user.role === Role.MANAGER || user.role === 'MANAGER') {
      await this.verifyBuildingAccess(user, slot.area.buildingId);
    }

    // Resident privacy guard
    if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(user.id);
      const isOwnAssignment = slot.assignments?.some(
        (a) => a.residentId === residentInfo?.id
      );

      return {
        ...slot,
        assignments: isOwnAssignment ? slot.assignments : [],
      };
    }

    return slot;
  }

  async createSlot(dto: CreateParkingSlotDto, user: SessionUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ParkingError('Bạn không có quyền tạo chỗ đỗ xe', 'FORBIDDEN', 403);
    }

    const area = await parkingRepository.findAreaById(dto.areaId);
    if (!area) throw new ParkingError('Không tìm thấy khu vực đỗ xe', 'NOT_FOUND', 404);

    await this.verifyBuildingAccess(user, area.buildingId);

    const existing = await parkingRepository.findSlotByCode(dto.areaId, dto.code);
    if (existing) {
      throw new ParkingError(
        `Vị trí đỗ "${dto.code}" đã tồn tại trong khu vực này`,
        'DUPLICATE_CODE',
        400
      );
    }

    const slot = await parkingRepository.createSlot({
      area: { connect: { id: dto.areaId } },
      zone: { connect: { id: dto.zoneId } },
      code: dto.code.toUpperCase(),
      type: dto.type,
      status: dto.status || ParkingSlotStatus.AVAILABLE,
      floor: dto.floor ?? area.floor,
      positionX: dto.positionX ?? 0,
      positionY: dto.positionY ?? 0,
      width: dto.width ?? 1,
      height: dto.height ?? 1,
      isReservable: dto.isReservable ?? true,
      isActive: dto.isActive ?? true,
      note: dto.note,
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'CREATE_PARKING_SLOT',
      entity: 'PARKING_SLOT',
      entityId: slot.id,
      metadata: { code: slot.code, areaId: dto.areaId, zoneId: dto.zoneId },
    });

    return slot;
  }

  async updateSlot(id: string, dto: UpdateParkingSlotDto, user: SessionUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ParkingError('Bạn không có quyền chỉnh sửa chỗ đỗ xe', 'FORBIDDEN', 403);
    }

    const slot = await parkingRepository.findSlotById(id);
    if (!slot) throw new ParkingError('Không tìm thấy vị trí đỗ xe', 'NOT_FOUND', 404);

    await this.verifyBuildingAccess(user, slot.area.buildingId);

    const updated = await parkingRepository.updateSlot(id, dto);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'UPDATE_PARKING_SLOT',
      entity: 'PARKING_SLOT',
      entityId: id,
      metadata: dto,
    });

    return updated;
  }

  async updateSlotStatus(id: string, status: ParkingSlotStatus, user: SessionUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER && user.role !== Role.STAFF_SECURITY) {
      throw new ParkingError('Bạn không có quyền thay đổi trạng thái chỗ đỗ', 'FORBIDDEN', 403);
    }

    const slot = await parkingRepository.findSlotById(id);
    if (!slot) throw new ParkingError('Không tìm thấy vị trí đỗ xe', 'NOT_FOUND', 404);

    if (user.role === Role.MANAGER) {
      await this.verifyBuildingAccess(user, slot.area.buildingId);
    }

    const updated = await parkingRepository.updateSlotStatus(id, status);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'PARKING_STATUS_CHANGED',
      entity: 'PARKING_SLOT',
      entityId: id,
      metadata: { code: slot.code, fromStatus: slot.status, toStatus: status },
    });

    return updated;
  }

  // ==========================================================================
  // REGISTRATION REQUEST WORKFLOW
  // ==========================================================================
  async getRequests(filter: ParkingRequestFilter, user: SessionUser) {
    if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(user.id);
      if (!residentInfo) {
        return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      }
      filter.residentId = residentInfo.id;
    } else if (user.role === Role.MANAGER || user.role === 'MANAGER') {
      const assigned = await this.getManagerScope(user);
      if (assigned && assigned.length > 0 && !filter.buildingId) {
        filter.buildingId = assigned[0];
      }
    }

    return parkingRepository.findRequests(filter);
  }

  async createRequest(dto: CreateParkingRequestDto, user: SessionUser) {
    const residentInfo = await getVerifiedResidentInfo(user.id);
    if (!residentInfo || !residentInfo.apartmentId) {
      throw new ParkingError(
        'Tài khoản của bạn chưa được liên kết với căn hộ hợp lệ',
        'UNLINKED_RESIDENT',
        403
      );
    }

    // Verify vehicle belongs to resident/apartment and is ACTIVE
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      include: { apartment: true },
    });

    if (!vehicle || vehicle.apartmentId !== residentInfo.apartmentId) {
      throw new ParkingError(
        'Phương tiện không thuộc căn hộ của bạn',
        'INVALID_VEHICLE',
        403
      );
    }

    if (vehicle.status !== VehicleStatus.ACTIVE) {
      throw new ParkingError(
        'Chỉ có thể đăng ký chỗ đỗ cho xe đã được ban quản lý phê duyệt (ACTIVE)',
        'VEHICLE_NOT_ACTIVE',
        400
      );
    }

    // Check Rule 18: 1 Vehicle -> 1 Active Parking Slot
    const activeAssignment = await parkingRepository.findActiveAssignmentByVehicle(dto.vehicleId);
    if (activeAssignment) {
      throw new ParkingError(
        `Phương tiện "${vehicle.licensePlate}" hiện đã có chỗ đỗ đang hoạt động (${activeAssignment.slot.code})`,
        'ACTIVE_ASSIGNMENT_EXISTS',
        400
      );
    }

    // Check for pending request for the same vehicle
    const existingPending = await parkingRepository.findActiveRequestByVehicle(dto.vehicleId);
    if (existingPending) {
      throw new ParkingError(
        `Phương tiện "${vehicle.licensePlate}" đã có một yêu cầu đăng ký đang chờ duyệt (${existingPending.requestCode})`,
        'DUPLICATE_PENDING_REQUEST',
        400
      );
    }

    // If specific slot requested, check slot availability
    if (dto.slotId) {
      const targetSlot = await parkingRepository.findSlotById(dto.slotId);
      if (!targetSlot) throw new ParkingError('Chỗ đỗ được chọn không tồn tại', 'NOT_FOUND', 404);
      if (targetSlot.status !== ParkingSlotStatus.AVAILABLE) {
        throw new ParkingError(
          `Vị trí đỗ "${targetSlot.code}" hiện không khả dụng (${targetSlot.status})`,
          'SLOT_NOT_AVAILABLE',
          400
        );
      }
    }

    // Generate request code
    const count = await prisma.parkingRegistrationRequest.count();
    const requestCode = `REQ-PARK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const request = await parkingRepository.createRequest({
      requestCode,
      resident: { connect: { id: residentInfo.id } },
      apartment: { connect: { id: residentInfo.apartmentId } },
      vehicle: { connect: { id: dto.vehicleId } },
      preferredArea: dto.preferredAreaId ? { connect: { id: dto.preferredAreaId } } : undefined,
      preferredZone: dto.preferredZoneId ? { connect: { id: dto.preferredZoneId } } : undefined,
      slot: dto.slotId ? { connect: { id: dto.slotId } } : undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      notes: dto.notes,
      status: ParkingRequestStatus.PENDING,
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'PARKING_REQUEST_CREATED',
      entity: 'PARKING_REGISTRATION_REQUEST',
      entityId: request.id,
      metadata: { requestCode, vehicleId: dto.vehicleId, licensePlate: vehicle.licensePlate },
    });

    return request;
  }

  async reviewRequest(id: string, dto: ReviewParkingRequestDto, user: SessionUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ParkingError('Chỉ BQL mới có quyền phê duyệt yêu cầu đăng ký chỗ đỗ', 'FORBIDDEN', 403);
    }

    const request = await parkingRepository.findRequestById(id);
    if (!request) {
      throw new ParkingError('Không tìm thấy yêu cầu đăng ký chỗ đỗ', 'NOT_FOUND', 404);
    }

    if (request.status !== ParkingRequestStatus.PENDING) {
      throw new ParkingError(
        'Yêu cầu này đã được xử lý trước đó',
        'REQUEST_ALREADY_PROCESSED',
        400
      );
    }

    if (user.role === Role.MANAGER) {
      if (request.apartment.buildingRef?.id) {
        await this.verifyBuildingAccess(user, request.apartment.buildingRef.id);
      }
    }

    // ------------------ REJECT FLOW ------------------
    if (dto.action === 'REJECT') {
      const userRecord = user?.id ? await prisma.user.findUnique({ where: { id: user.id } }) : null;

      const updated = await parkingRepository.updateRequest(id, {
        status: ParkingRequestStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
        reviewer: userRecord ? { connect: { id: user.id } } : undefined,
        reviewedAt: new Date(),
      });

      // Notify resident
      try {
        if (userRecord) {
          await prisma.notification.create({
            data: {
              title: 'Yêu cầu đăng ký chỗ đỗ xe bị từ chối',
              content: `Yêu cầu (${request.requestCode}) cho xe ${request.vehicle.licensePlate} đã bị từ chối. Lý do: ${dto.rejectionReason || 'Không có lý do'}`,
              sender: { connect: { id: user.id } },
              isGlobal: false,
              targetRole: Role.RESIDENT,
              apartments: {
                create: [{ apartmentId: request.apartmentId }],
              },
            },
          });
        }
      } catch (err) {
        console.error('Failed to dispatch notification:', err);
      }

      await auditLogService.record({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role as string,
        action: 'PARKING_REQUEST_REJECTED',
        entity: 'PARKING_REGISTRATION_REQUEST',
        entityId: id,
        metadata: { requestCode: request.requestCode, reason: dto.rejectionReason },
      });

      return updated;
    }

    // ------------------ APPROVE FLOW ------------------
    // Determine target slot (either from reviewer payload or from request)
    const slotId = dto.slotId || request.slotId;
    if (!slotId) {
      throw new ParkingError(
        'Vui lòng chọn vị trí đỗ xe để cấp phát cho cư dân',
        'SLOT_REQUIRED',
        400
      );
    }

    // Run in Prisma transaction to ensure strict concurrency and anti-double assignment
    return await prisma.$transaction(async (tx) => {
      // 1. Lock and verify slot
      const slot = await tx.parkingSlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) throw new ParkingError('Vị trí đỗ xe không tồn tại', 'NOT_FOUND', 404);
      if (slot.status !== ParkingSlotStatus.AVAILABLE) {
        throw new ParkingError(
          `Vị trí đỗ "${slot.code}" hiện không còn trống (${slot.status}). Vui lòng chọn vị trí khác.`,
          'SLOT_UNAVAILABLE',
          400
        );
      }

      // 2. Check Rule 18: Slot does not have active assignment
      const existingSlotAssignment = await tx.parkingAssignment.findFirst({
        where: {
          slotId,
          status: { in: [ParkingAssignmentStatus.ACTIVE, ParkingAssignmentStatus.EXPIRING_SOON] },
        },
      });
      if (existingSlotAssignment) {
        throw new ParkingError(
          `Vị trí đỗ "${slot.code}" đã được cấp cho phương tiện khác`,
          'CONCURRENT_CONFLICT',
          409
        );
      }

      // 3. Check Rule 18: Vehicle does not have active assignment
      const existingVehicleAssignment = await tx.parkingAssignment.findFirst({
        where: {
          vehicleId: request.vehicleId,
          status: { in: [ParkingAssignmentStatus.ACTIVE, ParkingAssignmentStatus.EXPIRING_SOON] },
        },
      });
      if (existingVehicleAssignment) {
        throw new ParkingError(
          `Phương tiện "${request.vehicle.licensePlate}" hiện đã có chỗ đỗ khác đang hoạt động`,
          'VEHICLE_ALREADY_ASSIGNED',
          400
        );
      }

      // 4. Generate unique secure QR token & assignment code
      const assignmentCount = await tx.parkingAssignment.count();
      const assignmentCode = `PASS-${new Date().getFullYear()}-${String(assignmentCount + 1).padStart(4, '0')}`;
      const qrToken = `KHOME-PARK-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;

      const userRecord = user?.id ? await tx.user.findUnique({ where: { id: user.id } }) : null;

      // 5. Create ParkingAssignment
      const assignment = await tx.parkingAssignment.create({
        data: {
          assignmentCode,
          slot: { connect: { id: slotId } },
          vehicle: { connect: { id: request.vehicleId } },
          resident: { connect: { id: request.residentId } },
          apartment: { connect: { id: request.apartmentId } },
          request: { connect: { id: request.id } },
          startDate: dto.startDate ? new Date(dto.startDate) : request.startDate,
          endDate: dto.endDate ? new Date(dto.endDate) : request.endDate,
          monthlyFee: dto.monthlyFee ?? 0,
          qrToken,
          status: ParkingAssignmentStatus.ACTIVE,
          assignedBy: userRecord ? { connect: { id: user.id } } : undefined,
        },
      });

      // 6. Update Slot to OCCUPIED
      await tx.parkingSlot.update({
        where: { id: slotId },
        data: { status: ParkingSlotStatus.OCCUPIED },
      });

      // 7. Update Request to APPROVED
      const approvedRequest = await tx.parkingRegistrationRequest.update({
        where: { id },
        data: {
          status: ParkingRequestStatus.APPROVED,
          slot: { connect: { id: slotId } },
          reviewer: userRecord ? { connect: { id: user.id } } : undefined,
          reviewedAt: new Date(),
        },
        include: {
          resident: true,
          apartment: true,
          vehicle: true,
          slot: true,
          assignment: true,
        },
      });

      // 8. Create Resident Notification
      try {
        if (userRecord) {
          await tx.notification.create({
            data: {
              title: 'Đăng ký chỗ đỗ xe đã được phê duyệt 🎉',
              content: `Yêu cầu (${request.requestCode}) cho xe ${request.vehicle.licensePlate} đã được cấp chỗ đỗ ${slot.code}. Bạn có thể xem thẻ gửi xe QR trong ứng dụng.`,
              sender: { connect: { id: user.id } },
              isGlobal: false,
              targetRole: Role.RESIDENT,
              apartments: {
                create: [{ apartmentId: request.apartmentId }],
              },
            },
          });
        }
      } catch (err) {
        console.error('Failed to dispatch notification:', err);
      }

      // 9. Record Audit Log
      await auditLogService.record({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role as string,
        action: 'PARKING_REQUEST_APPROVED',
        entity: 'PARKING_REGISTRATION_REQUEST',
        entityId: id,
        metadata: {
          requestCode: request.requestCode,
          slotCode: slot.code,
          assignmentCode,
          vehiclePlate: request.vehicle.licensePlate,
        },
      });

      return approvedRequest;
    });
  }

  // ==========================================================================
  // DIRECT ASSIGNMENT & RELEASE
  // ==========================================================================
  async assignSlot(dto: AssignSlotDto, user: SessionUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ParkingError('Bạn không có quyền trực tiếp cấp chỗ đỗ', 'FORBIDDEN', 403);
    }

    const slot = await parkingRepository.findSlotById(dto.slotId);
    if (!slot) throw new ParkingError('Vị trí đỗ không tồn tại', 'NOT_FOUND', 404);

    await this.verifyBuildingAccess(user, slot.area.buildingId);

    if (slot.status !== ParkingSlotStatus.AVAILABLE) {
      throw new ParkingError(`Vị trí đỗ ${slot.code} hiện không còn trống (${slot.status})`, 'SLOT_UNAVAILABLE', 400);
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      include: { apartment: true, resident: true },
    });
    if (!vehicle) throw new ParkingError('Phương tiện không tồn tại', 'NOT_FOUND', 404);

    return await prisma.$transaction(async (tx) => {
      // Check Rule 18
      const activeVehicle = await tx.parkingAssignment.findFirst({
        where: {
          vehicleId: dto.vehicleId,
          status: { in: [ParkingAssignmentStatus.ACTIVE, ParkingAssignmentStatus.EXPIRING_SOON] },
        },
      });
      if (activeVehicle) {
        throw new ParkingError(
          `Phương tiện "${vehicle.licensePlate}" hiện đã có chỗ đỗ đang hoạt động`,
          'VEHICLE_ALREADY_ASSIGNED',
          400
        );
      }

      const count = await tx.parkingAssignment.count();
      const assignmentCode = `PASS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      const qrToken = `KHOME-PARK-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
      const userRecord = user?.id ? await tx.user.findUnique({ where: { id: user.id } }) : null;

      const assignment = await tx.parkingAssignment.create({
        data: {
          assignmentCode,
          slot: { connect: { id: dto.slotId } },
          vehicle: { connect: { id: dto.vehicleId } },
          resident: vehicle.residentId ? { connect: { id: vehicle.residentId } } : undefined,
          apartment: { connect: { id: vehicle.apartmentId } },
          startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          monthlyFee: dto.monthlyFee ?? 0,
          qrToken,
          status: ParkingAssignmentStatus.ACTIVE,
          assignedBy: userRecord ? { connect: { id: user.id } } : undefined,
          notes: dto.notes,
        },
        include: {
          slot: true,
          vehicle: true,
          resident: true,
          apartment: true,
        },
      });

      await tx.parkingSlot.update({
        where: { id: dto.slotId },
        data: { status: ParkingSlotStatus.OCCUPIED },
      });

      await auditLogService.record({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role as string,
        action: 'PARKING_ASSIGNED',
        entity: 'PARKING_ASSIGNMENT',
        entityId: assignment.id,
        metadata: { slotCode: slot.code, licensePlate: vehicle.licensePlate },
      });

      return assignment;
    });
  }

  async releaseSlot(slotId: string, user: SessionUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      throw new ParkingError('Bạn không có quyền thu hồi chỗ đỗ', 'FORBIDDEN', 403);
    }

    const slot = await parkingRepository.findSlotById(slotId);
    if (!slot) throw new ParkingError('Vị trí đỗ không tồn tại', 'NOT_FOUND', 404);

    await this.verifyBuildingAccess(user, slot.area.buildingId);

    return await prisma.$transaction(async (tx) => {
      // Find active assignment
      const activeAssignment = await tx.parkingAssignment.findFirst({
        where: {
          slotId,
          status: { in: [ParkingAssignmentStatus.ACTIVE, ParkingAssignmentStatus.EXPIRING_SOON] },
        },
      });

      if (activeAssignment) {
        await tx.parkingAssignment.update({
          where: { id: activeAssignment.id },
          data: { status: ParkingAssignmentStatus.TERMINATED },
        });
      }

      await tx.parkingSlot.update({
        where: { id: slotId },
        data: { status: ParkingSlotStatus.AVAILABLE },
      });

      await auditLogService.record({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role as string,
        action: 'PARKING_RELEASED',
        entity: 'PARKING_SLOT',
        entityId: slotId,
        metadata: { slotCode: slot.code },
      });

      return { success: true };
    });
  }

  // ==========================================================================
  // RESIDENT DIGITAL PARKING PASSES
  // ==========================================================================
  async getMyAssignments(user: SessionUser) {
    const residentInfo = await getVerifiedResidentInfo(user.id);
    if (!residentInfo) return [];

    return parkingRepository.findAssignments({
      OR: [
        { residentId: residentInfo.id },
        { apartmentId: residentInfo.apartmentId || undefined },
      ],
      status: { in: [ParkingAssignmentStatus.ACTIVE, ParkingAssignmentStatus.EXPIRING_SOON] },
    });
  }

  // ==========================================================================
  // SECURITY & GATE ACCESS OPERATIONS (CHECK-IN / CHECK-OUT)
  // ==========================================================================
  async getAccessLogs(filter: ParkingAccessLogFilter, user: SessionUser) {
    if (user.role === Role.MANAGER || user.role === 'MANAGER') {
      const assigned = await this.getManagerScope(user);
      if (assigned && assigned.length > 0 && !filter.buildingId) {
        filter.buildingId = assigned[0];
      }
    }

    return parkingRepository.findAccessLogs(filter);
  }

  async checkIn(dto: GateCheckInDto, user: SessionUser) {
    // 1. Lookup vehicle / assignment
    let assignment = null;

    if (dto.qrToken) {
      assignment = await parkingRepository.findByQrToken(dto.qrToken);
    } else if (dto.licensePlate) {
      assignment = await parkingRepository.findByLicensePlate(dto.licensePlate);
    }

    // Check if plate exists in vehicle registry even without slot assignment
    const vehicle = await prisma.vehicle.findFirst({
      where: { licensePlate: { equals: dto.licensePlate.trim(), mode: 'insensitive' } },
      include: { apartment: true, resident: true },
    });

    const isAuthorized = !!assignment || (!!vehicle && vehicle.status === VehicleStatus.ACTIVE);
    const logStatus = isAuthorized ? ParkingLogStatus.SUCCESS : ParkingLogStatus.ALERT;
    const operatorRecord = user?.id ? await prisma.user.findUnique({ where: { id: user.id } }) : null;

    const log = await parkingRepository.createAccessLog({
      licensePlate: dto.licensePlate.toUpperCase(),
      cardCode: dto.cardCode,
      gateName: dto.gateName || 'Cổng VÀO 01 (Hầm B1)',
      direction: ParkingLogDirection.ENTRY,
      status: logStatus,
      operator: operatorRecord ? { connect: { id: user.id } } : undefined,
      vehicle: vehicle ? { connect: { id: vehicle.id } } : undefined,
      slot: assignment ? { connect: { id: assignment.slotId } } : undefined,
      imageSnapshotUrl: dto.imageSnapshotUrl,
      notes: dto.notes || (isAuthorized ? 'Xe hợp lệ - Mở barie tự động' : 'Cảnh báo: Xe chưa đăng ký bãi đỗ'),
    });

    // If slot exists, ensure marked occupied
    if (assignment?.slotId) {
      await parkingRepository.updateSlotStatus(assignment.slotId, ParkingSlotStatus.OCCUPIED);
    }

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'VEHICLE_CHECK_IN',
      entity: 'PARKING_ACCESS_LOG',
      entityId: log.id,
      metadata: { licensePlate: dto.licensePlate, status: logStatus, gate: dto.gateName },
    });

    return {
      log,
      authorized: isAuthorized,
      assignment,
      vehicle,
      message: isAuthorized ? 'Xe hợp lệ - Barie mở' : 'Cảnh báo: Xe chưa có thẻ/chỗ đỗ hợp lệ',
    };
  }

  async checkOut(dto: GateCheckOutDto, user: SessionUser) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { licensePlate: { equals: dto.licensePlate.trim(), mode: 'insensitive' } },
      include: { apartment: true },
    });

    const assignment = await parkingRepository.findByLicensePlate(dto.licensePlate);
    const operatorRecord = user?.id ? await prisma.user.findUnique({ where: { id: user.id } }) : null;

    const log = await parkingRepository.createAccessLog({
      licensePlate: dto.licensePlate.toUpperCase(),
      cardCode: dto.cardCode,
      gateName: dto.gateName || 'Cổng RA 01 (Hầm B1)',
      direction: ParkingLogDirection.EXIT,
      status: ParkingLogStatus.SUCCESS,
      operator: operatorRecord ? { connect: { id: user.id } } : undefined,
      vehicle: vehicle ? { connect: { id: vehicle.id } } : undefined,
      slot: assignment ? { connect: { id: assignment.slotId } } : undefined,
      imageSnapshotUrl: dto.imageSnapshotUrl,
      notes: dto.notes || 'Xe ra bãi hợp lệ - Barie mở',
    });

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'VEHICLE_CHECK_OUT',
      entity: 'PARKING_ACCESS_LOG',
      entityId: log.id,
      metadata: { licensePlate: dto.licensePlate, gate: dto.gateName },
    });

    return {
      log,
      success: true,
      message: 'Xe rời bãi thành công',
    };
  }

  // ==========================================================================
  // GLOBAL OCCUPANCY OVERVIEW & ANALYTICS
  // ==========================================================================
  async getOverview(buildingId?: string, user?: SessionUser): Promise<GlobalParkingOverview> {
    let finalBuildingId = buildingId;

    if (user && (user.role === Role.MANAGER || user.role === 'MANAGER')) {
      const assigned = await this.getManagerScope(user);
      if (assigned && assigned.length > 0) {
        if (!finalBuildingId || !assigned.includes(finalBuildingId)) {
          finalBuildingId = assigned[0];
        }
      }
    }

    const summary = await parkingRepository.calculateBuildingOccupancy(finalBuildingId);
    const areas = await parkingRepository.findAreas({ buildingId: finalBuildingId, isActive: true });

    const areaSummaries = await Promise.all(
      areas.map(async (area) => {
        const areaMetrics = await parkingRepository.calculateAreaOccupancy(area.id);
        const zonesWithMetrics = await Promise.all(
          area.zones.map(async (zone) => {
            const slots = await prisma.parkingSlot.findMany({
              where: { zoneId: zone.id, isActive: true },
              select: { status: true },
            });
            const total = slots.length;
            const occupied = slots.filter((s) => s.status === ParkingSlotStatus.OCCUPIED).length;
            const reserved = slots.filter((s) => s.status === ParkingSlotStatus.RESERVED).length;
            const maintenance = slots.filter((s) => s.status === ParkingSlotStatus.MAINTENANCE).length;
            const blocked = slots.filter((s) => s.status === ParkingSlotStatus.BLOCKED).length;
            const available = Math.max(0, total - occupied - reserved - maintenance - blocked);
            const occupancyRate = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;

            return {
              zoneId: zone.id,
              zoneCode: zone.code,
              zoneName: zone.name,
              vehicleType: zone.vehicleType,
              metrics: {
                total,
                available,
                occupied,
                reserved,
                maintenance,
                blocked,
                occupancyRate,
              },
            };
          })
        );

        return {
          areaId: area.id,
          areaCode: area.code,
          areaName: area.name,
          floor: area.floor,
          metrics: areaMetrics,
          zones: zonesWithMetrics,
        };
      })
    );

    // Distribution by vehicle type
    const slots = await prisma.parkingSlot.findMany({
      where: finalBuildingId ? { area: { buildingId: finalBuildingId } } : {},
      select: { type: true },
    });

    const byVehicleType = slots.reduce<Record<string, number>>((acc, slot) => {
      acc[slot.type] = (acc[slot.type] || 0) + 1;
      return acc;
    }, {});

    // Active passes & pending requests count
    const [activePassesCount, pendingRequestsCount] = await Promise.all([
      prisma.parkingAssignment.count({
        where: {
          status: ParkingAssignmentStatus.ACTIVE,
          slot: finalBuildingId ? { area: { buildingId: finalBuildingId } } : undefined,
        },
      }),
      prisma.parkingRegistrationRequest.count({
        where: {
          status: ParkingRequestStatus.PENDING,
          apartment: finalBuildingId ? { buildingId: finalBuildingId } : undefined,
        },
      }),
    ]);

    // Today's entry/exit stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayEntries, todayExits] = await Promise.all([
      prisma.parkingAccessLog.count({
        where: {
          direction: ParkingLogDirection.ENTRY,
          timestamp: { gte: today },
          slot: finalBuildingId ? { area: { buildingId: finalBuildingId } } : undefined,
        },
      }),
      prisma.parkingAccessLog.count({
        where: {
          direction: ParkingLogDirection.EXIT,
          timestamp: { gte: today },
          slot: finalBuildingId ? { area: { buildingId: finalBuildingId } } : undefined,
        },
      }),
    ]);

    return {
      summary,
      areas: areaSummaries,
      byVehicleType,
      activePassesCount,
      pendingRequestsCount,
      todayEntries,
      todayExits,
    };
  }
}

export const parkingService = new ParkingService();
