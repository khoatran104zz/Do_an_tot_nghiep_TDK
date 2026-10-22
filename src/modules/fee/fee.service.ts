import { feeCategoryRepository } from './fee.repository';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from './fee.types';

export class FeeCategoryService {
  async getFeeCategories(tenantId?: string | null) {
    return feeCategoryRepository.findAll(tenantId);
  }

  async getFeeCategoryById(id: string) {
    const item = await feeCategoryRepository.findById(id);
    if (!item) {
      throw new Error('Không tìm thấy danh mục phí');
    }
    return item;
  }

  async createFeeCategory(data: CreateFeeCategoryDto) {
    const existing = await feeCategoryRepository.findByCode(data.code, data.tenantId);
    if (existing) {
      throw new Error(`Mã danh mục phí "${data.code}" đã tồn tại trong tổ hợp này`);
    }
    return feeCategoryRepository.create(data);
  }

  async updateFeeCategory(id: string, data: UpdateFeeCategoryDto) {
    const current = await this.getFeeCategoryById(id);

    if (data.code || data.tenantId) {
      const targetTenantId = data.tenantId !== undefined ? data.tenantId : current.tenantId;
      const targetCode = data.code || current.code;
      const existing = await feeCategoryRepository.findByCode(targetCode, targetTenantId);
      if (existing && existing.id !== id) {
        throw new Error(`Mã danh mục phí "${targetCode}" đã trùng với danh mục khác trong cùng tổ hợp`);
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
