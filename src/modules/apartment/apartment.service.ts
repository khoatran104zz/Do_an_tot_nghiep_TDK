import { apartmentRepository } from './apartment.repository';
import { ApartmentFilter, CreateApartmentDto, UpdateApartmentDto } from './apartment.types';

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

  async createApartment(data: CreateApartmentDto) {
    const existing = await apartmentRepository.findByCode(data.code);
    if (existing) {
      throw new Error(`Mã căn hộ "${data.code}" đã tồn tại trong hệ thống`);
    }
    return apartmentRepository.create(data);
  }

  async updateApartment(id: string, data: UpdateApartmentDto) {
    await this.getApartmentById(id);

    if (data.code) {
      const existing = await apartmentRepository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new Error(`Mã căn hộ "${data.code}" đã trùng với căn hộ khác`);
      }
    }

    return apartmentRepository.update(id, data);
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
}

export const apartmentService = new ApartmentService();
