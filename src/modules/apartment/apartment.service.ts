import { apartmentRepository } from './apartment.repository';
import {
  ApartmentFilter,
  CreateApartmentDto,
  UpdateApartmentDto,
  CreateApartmentHistoryDto,
  CreateBuildingDto,
  UpdateBuildingDto,
  CreateBlockDto,
  UpdateBlockDto,
  CreateFloorDto,
  UpdateFloorDto,
} from './apartment.types';
import { ApartmentHistoryEvent } from '@prisma/client';
import { auditLogService } from '@/modules/audit/audit-log.service';

export type ActorContext =
  | string
  | {
      id?: string | null;
      email?: string | null;
      role?: string | null;
      name?: string | null;
    };

export class ApartmentService {
  async getApartments(filter: ApartmentFilter) {
    return apartmentRepository.findAll(filter);
  }

  async getApartmentById(id: string) {
    const item = await apartmentRepository.findById(id);
    if (!item) {
      throw new Error('Không tìm thấy căn hộ yêu cầu');
    }
    return item;
  }

  async createApartment(
    data: CreateApartmentDto,
    actor?: ActorContext
  ) {
    const existing = await apartmentRepository.findByCode(data.code);
    if (existing) {
      throw new Error(`Mã căn hộ "${data.code}" đã tồn tại trong hệ thống`);
    }

    const created = await apartmentRepository.create(data);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    const performedBy = typeof actor === 'string' ? actor : (actor?.name || actor?.email || 'Ban Quản Trị Hệ Thống');

    // Initial history event
    await apartmentRepository.createHistory(created.id, {
      event: ApartmentHistoryEvent.STATUS_CHANGE,
      title: `Khởi tạo căn hộ ${created.code}`,
      description: `Đăng ký mới căn hộ vào hệ thống tòa nhà (${created.building} - Tầng ${created.floor})`,
      toStatus: created.status,
      performedBy,
    });

    // Audit log
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'APARTMENT_CREATED',
      entity: 'APARTMENT',
      entityId: created.id,
      metadata: { code: created.code, area: created.area, building: created.building, floor: created.floor },
    });

    return created;
  }

  async updateApartment(
    id: string,
    data: UpdateApartmentDto,
    actor?: ActorContext
  ) {
    const current = await this.getApartmentById(id);

    if (data.code) {
      const existing = await apartmentRepository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new Error(`Mã căn hộ "${data.code}" đã trùng với căn hộ khác`);
      }
    }

    const updated = await apartmentRepository.update(id, data);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    const performedBy = typeof actor === 'string' ? actor : (actor?.name || actor?.email || 'Quản lý vận hành');

    // If status changed, record a STATUS_CHANGE event
    if (data.status && data.status !== current.status) {
      const statusLabels: Record<string, string> = {
        VACANT: 'Đang trống',
        OCCUPIED: 'Đang ở',
        UNDER_MAINTENANCE: 'Đang sửa chữa / bảo dưỡng',
      };
      await apartmentRepository.createHistory(id, {
        event: ApartmentHistoryEvent.STATUS_CHANGE,
        title: `Chuyển trạng thái sang ${statusLabels[data.status] || data.status}`,
        description: `Trạng thái căn hộ thay đổi từ [${statusLabels[current.status] || current.status}] thành [${statusLabels[data.status] || data.status}]`,
        fromStatus: current.status,
        toStatus: data.status,
        performedBy,
      });

      await auditLogService.record({
        actorId: actorObj?.id || null,
        actorEmail: actorObj?.email || null,
        actorRole: actorObj?.role || null,
        action: 'APARTMENT_STATUS_CHANGED',
        entity: 'APARTMENT',
        entityId: id,
        metadata: { code: current.code, fromStatus: current.status, toStatus: data.status },
      });
    } else {
      await auditLogService.record({
        actorId: actorObj?.id || null,
        actorEmail: actorObj?.email || null,
        actorRole: actorObj?.role || null,
        action: 'APARTMENT_UPDATED',
        entity: 'APARTMENT',
        entityId: id,
        metadata: { code: updated.code, changedFields: Object.keys(data) },
      });
    }

    return updated;
  }

  async deleteApartment(
    id: string,
    actor?: ActorContext
  ) {
    const apartment = await this.getApartmentById(id);
    if (apartment.residents.length > 0) {
      throw new Error('Không thể xóa căn hộ đang có cư dân ở. Vui lòng chuyển cư dân trước!');
    }
    if (apartment.contracts.length > 0) {
      throw new Error('Không thể xóa căn hộ đang có hợp đồng liên kết!');
    }
    const result = await apartmentRepository.delete(id);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;

    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'APARTMENT_DELETED',
      entity: 'APARTMENT',
      entityId: id,
      metadata: { code: apartment.code },
    });

    return result;
  }

  // --- Building Methods ---
  async getBuildingsList() {
    return apartmentRepository.findBuildings();
  }

  async getBuildingById(id: string) {
    const building = await apartmentRepository.findBuildingById(id);
    if (!building) {
      throw new Error('Không tìm thấy thông tin tòa nhà yêu cầu');
    }
    return building;
  }

  async createBuilding(
    data: CreateBuildingDto,
    actor?: ActorContext
  ) {
    const created = await apartmentRepository.createBuilding(data);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'BUILDING_CREATED',
      entity: 'BUILDING',
      entityId: created.id,
      metadata: { code: created.code, name: created.name },
    });
    return created;
  }

  async updateBuilding(
    id: string,
    data: UpdateBuildingDto,
    actor?: ActorContext
  ) {
    await this.getBuildingById(id);
    const updated = await apartmentRepository.updateBuilding(id, data);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'BUILDING_UPDATED',
      entity: 'BUILDING',
      entityId: id,
      metadata: { code: updated.code, name: updated.name },
    });
    return updated;
  }

  async deleteBuilding(
    id: string,
    actor?: ActorContext
  ) {
    await this.getBuildingById(id);
    const deleted = await apartmentRepository.deleteBuilding(id);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'BUILDING_DELETED',
      entity: 'BUILDING',
      entityId: id,
      metadata: { code: deleted.code },
    });
    return deleted;
  }

  // --- Block Methods ---
  async getBlocks(buildingId?: string) {
    return apartmentRepository.findBlocks(buildingId);
  }

  async getBlockById(id: string) {
    const block = await apartmentRepository.findBlockById(id);
    if (!block) {
      throw new Error('Không tìm thấy khối tháp yêu cầu');
    }
    return block;
  }

  async createBlock(
    data: CreateBlockDto,
    actor?: ActorContext
  ) {
    // Check building exists
    await this.getBuildingById(data.buildingId);
    const created = await apartmentRepository.createBlock(data);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'BLOCK_CREATED',
      entity: 'BLOCK',
      entityId: created.id,
      metadata: { code: created.code, name: created.name, buildingId: created.buildingId },
    });
    return created;
  }

  async updateBlock(
    id: string,
    data: UpdateBlockDto,
    actor?: ActorContext
  ) {
    await this.getBlockById(id);
    const updated = await apartmentRepository.updateBlock(id, data);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'BLOCK_UPDATED',
      entity: 'BLOCK',
      entityId: id,
      metadata: { code: updated.code, name: updated.name },
    });
    return updated;
  }

  async deleteBlock(
    id: string,
    actor?: ActorContext
  ) {
    await this.getBlockById(id);
    const deleted = await apartmentRepository.deleteBlock(id);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'BLOCK_DELETED',
      entity: 'BLOCK',
      entityId: id,
      metadata: { code: deleted.code },
    });
    return deleted;
  }

  // --- Floor Methods ---
  async getFloors(blockId?: string) {
    return apartmentRepository.findFloors(blockId);
  }

  async getFloorById(id: string) {
    const floor = await apartmentRepository.findFloorById(id);
    if (!floor) {
      throw new Error('Không tìm thấy tầng lầu yêu cầu');
    }
    return floor;
  }

  async createFloor(
    data: CreateFloorDto,
    actor?: ActorContext
  ) {
    // Check block exists
    await this.getBlockById(data.blockId);
    const created = await apartmentRepository.createFloor(data);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'FLOOR_CREATED',
      entity: 'FLOOR',
      entityId: created.id,
      metadata: { floorNumber: created.floorNumber, name: created.name, blockId: created.blockId },
    });
    return created;
  }

  async updateFloor(
    id: string,
    data: UpdateFloorDto,
    actor?: ActorContext
  ) {
    await this.getFloorById(id);
    const updated = await apartmentRepository.updateFloor(id, data);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'FLOOR_UPDATED',
      entity: 'FLOOR',
      entityId: id,
      metadata: { floorNumber: updated.floorNumber, name: updated.name },
    });
    return updated;
  }

  async deleteFloor(
    id: string,
    actor?: ActorContext
  ) {
    await this.getFloorById(id);
    const deleted = await apartmentRepository.deleteFloor(id);
    const actorObj = typeof actor === 'string' ? { name: actor } : actor;
    await auditLogService.record({
      actorId: actorObj?.id || null,
      actorEmail: actorObj?.email || null,
      actorRole: actorObj?.role || null,
      action: 'FLOOR_DELETED',
      entity: 'FLOOR',
      entityId: id,
      metadata: { floorNumber: deleted.floorNumber, name: deleted.name },
    });
    return deleted;
  }


  // Legacy string list of building names
  async getBuildings() {
    return apartmentRepository.getBuildings();
  }

  async getHierarchy(buildingIds?: string[]) {
    return apartmentRepository.getHierarchy(buildingIds);
  }

  async bootstrapHierarchy() {
    return apartmentRepository.bootstrapHierarchy();
  }

  async getHistory(apartmentId: string) {
    await this.getApartmentById(apartmentId);
    return apartmentRepository.getHistory(apartmentId);
  }

  async createHistory(apartmentId: string, data: CreateApartmentHistoryDto) {
    await this.getApartmentById(apartmentId);
    return apartmentRepository.createHistory(apartmentId, data);
  }
}

export const apartmentService = new ApartmentService();

