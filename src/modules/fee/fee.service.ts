import { feeCategoryRepository } from './fee.repository';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from './fee.types';

export class FeeCategoryService {
  async getFeeCategories() {
    return feeCategoryRepository.findAll();
  }

  async getFeeCategoryById(id: string) {
    const item = await feeCategoryRepository.findById(id);
    if (!item) {
      throw new Error('Không tìm thấy danh mục phí');
    }
    return item;
  }

  async createFeeCategory(data: CreateFeeCategoryDto) {
    const existing = await feeCategoryRepository.findByCode(data.code);
    if (existing) {
      throw new Error(`Mã danh mục phí "${data.code}" đã tồn tại`);
    }
    return feeCategoryRepository.create(data);
  }

  async updateFeeCategory(id: string, data: UpdateFeeCategoryDto) {
    await this.getFeeCategoryById(id);

    if (data.code) {
      const existing = await feeCategoryRepository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new Error(`Mã danh mục phí "${data.code}" đã trùng với danh mục khác`);
      }
    }

    return feeCategoryRepository.update(id, data);
  }

  async deleteFeeCategory(id: string) {
    const fee = await this.getFeeCategoryById(id);
    if (fee.isSystem) {
      throw new Error('Không thể xóa danh mục phí hệ thống mặc định');
    }
    return feeCategoryRepository.delete(id);
  }
}

export const feeCategoryService = new FeeCategoryService();
