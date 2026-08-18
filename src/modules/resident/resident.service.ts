import { residentRepository } from './resident.repository';
import { ResidentFilter, CreateResidentDto, UpdateResidentDto } from './resident.types';

export class ResidentService {
  async getResidents(filter: ResidentFilter) {
    return residentRepository.findAll(filter);
  }

  async getResidentById(id: string) {
    const item = await residentRepository.findById(id);
    if (!item) {
      throw new Error('Không tìm thấy thông tin cư dân');
    }
    return item;
  }

  async createResident(data: CreateResidentDto) {
    const existing = await residentRepository.findByIdentityCard(data.identityCard);
    if (existing) {
      throw new Error(`Số CCCD/CMND "${data.identityCard}" đã được đăng ký cho cư dân khác`);
    }
    return residentRepository.create(data);
  }

  async updateResident(id: string, data: UpdateResidentDto) {
    await this.getResidentById(id);

    if (data.identityCard) {
      const existing = await residentRepository.findByIdentityCard(data.identityCard);
      if (existing && existing.id !== id) {
        throw new Error(`Số CCCD/CMND "${data.identityCard}" đã trùng với cư dân khác`);
      }
    }

    return residentRepository.update(id, data);
  }

  async deleteResident(id: string) {
    await this.getResidentById(id);
    return residentRepository.delete(id);
  }
}

export const residentService = new ResidentService();
