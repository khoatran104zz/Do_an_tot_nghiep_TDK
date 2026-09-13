import { apiClient } from '@/lib/api-client';
import {
  VisitorFilter,
  CreateVisitorPassDto,
  ScanVisitorDto,
} from '@/modules/visitor/visitor.types';

export const visitorClientService = {
  // Visitor Passes
  async getVisitorPasses(filter: VisitorFilter = {}) {
    return apiClient('/visitors', { params: filter as any });
  },

  async getVisitorStats() {
    return apiClient('/visitors/stats');
  },

  async getVisitorPassById(id: string) {
    return apiClient(`/visitors/${id}`);
  },

  async createVisitorPass(data: CreateVisitorPassDto) {
    return apiClient('/visitors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async scanAndValidate(data: ScanVisitorDto) {
    return apiClient('/visitors/scan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkIn(id: string) {
    return apiClient(`/visitors/${id}/check-in`, {
      method: 'POST',
    });
  },

  async checkOut(id: string) {
    return apiClient(`/visitors/${id}/check-out`, {
      method: 'POST',
    });
  },

  async cancelVisitorPass(id: string) {
    return apiClient(`/visitors/${id}/cancel`, {
      method: 'POST',
    });
  },
};
