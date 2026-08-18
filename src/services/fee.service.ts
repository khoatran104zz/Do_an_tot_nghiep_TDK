import { apiClient } from '@/lib/api-client';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from '@/modules/fee/fee.types';

export const feeCategoryClientService = {
  async getFeeCategories() {
    return apiClient('/fees');
  },

  async createFeeCategory(data: CreateFeeCategoryDto) {
    return apiClient('/fees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFeeCategory(id: string, data: UpdateFeeCategoryDto) {
    return apiClient(`/fees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteFeeCategory(id: string) {
    return apiClient(`/fees/${id}`, {
      method: 'DELETE',
    });
  },
};
