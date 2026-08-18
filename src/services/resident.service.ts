import { apiClient } from '@/lib/api-client';
import { ResidentFilter, CreateResidentDto, UpdateResidentDto } from '@/modules/resident/resident.types';

export const residentClientService = {
  async getResidents(filter: ResidentFilter = {}) {
    return apiClient('/residents', { params: filter as any });
  },

  async getResidentById(id: string) {
    return apiClient(`/residents/${id}`);
  },

  async createResident(data: CreateResidentDto) {
    return apiClient('/residents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateResident(id: string, data: UpdateResidentDto) {
    return apiClient(`/residents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteResident(id: string) {
    return apiClient(`/residents/${id}`, {
      method: 'DELETE',
    });
  },
};
