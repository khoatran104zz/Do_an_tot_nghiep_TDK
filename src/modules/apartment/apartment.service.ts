import { apartmentRepository } from './apartment.repository';
import {
  ApartmentFilter,
  CreateApartmentDto,
  UpdateApartmentDto,
  CreateApartmentHistoryDto,
} from './apartment.types';
import { ApartmentHistoryEvent } from '@prisma/client';

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

  async createApartment(data: CreateApartmentDto, performedBy?: string) {
    const existing = await apartmentRepository.findByCode(data.code);
    if (existing) {
      throw new Error(`Mã căn hộ "${data.code}" đã tồn tại trong hệ thống`);
    }
    const created = await apartmentRepository.create(data);

    // Initial history event
    await apartmentRepository.createHistory(created.id, {
      event: ApartmentHistoryEvent.STATUS_CHANGE,
      title: `Khởi tạo căn hộ ${created.code}`,
      description: `Đăng ký mới căn hộ vào hệ thống tòa nhà (${created.building} - Tầng ${created.floor})`,
      toStatus: created.status,
      performedBy: performedBy || 'Ban Quản Trị Hệ Thống',
    });

    return created;
  }

  async updateApartment(id: string, data: UpdateApartmentDto, performedBy?: string) {
    const current = await this.getApartmentById(id);

    if (data.code) {
      const existing = await apartmentRepository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new Error(`Mã căn hộ "${data.code}" đã trùng với căn hộ khác`);
      }
    }

    const updated = await apartmentRepository.update(id, data);

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
        performedBy: performedBy || 'Quản lý vận hành',
      });
    }

    return updated;
  }

  async deleteApartment(id: string) {
    const apartment = await this.getApartmentById(id);
    if (apartment.residents.length > 0) {
      throw new Error('Không thể xóa căn hộ đang có cư dân ở. Vui lòng chuyển cư dân trước!');
    }
    return apartmentRepository.delete(id);
  }

  async getBuildings() {
    return apartmentRepository.getBuildings();
  }

  async getHierarchy() {
    return apartmentRepository.getHierarchy();
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
