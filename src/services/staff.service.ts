import { apiClient } from '@/lib/api-client';
import {
  StaffFilter,
  CreateStaffDto,
  UpdateStaffDto,
  AssignShiftDto,
  UpdateStaffStatusDto,
} from '@/modules/staff/staff.types';

export const staffClientService = {
  async getStaffList(filter: StaffFilter = {}) {
    return apiClient('/staff', { params: filter as any });
  },

  async getStaffStats() {
    return apiClient('/staff/stats');
  },

  async getStaffById(id: string) {
    return apiClient(`/staff/${id}`);
  },

  async createStaff(data: CreateStaffDto) {
    return apiClient('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStaff(id: string, data: UpdateStaffDto) {
    return apiClient(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async assignShift(id: string, data: AssignShiftDto) {
    return apiClient(`/staff/${id}/shift`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(id: string, data: UpdateStaffStatusDto) {
    return apiClient(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
