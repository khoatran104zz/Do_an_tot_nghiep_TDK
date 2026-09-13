import { apiClient } from '@/lib/api-client';
import {
  CreateResidenceRequestDto,
  ResidenceRequestFilter,
  ReviewResidenceRequestDto,
} from '@/modules/household/household.types';

export const householdClientService = {
  async getResidenceRequests(filter: ResidenceRequestFilter = {}) {
    return apiClient('/residence-requests', { params: filter as any });
  },

  async createResidenceRequest(data: CreateResidenceRequestDto) {
    return apiClient('/residence-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewResidenceRequest(id: string, data: ReviewResidenceRequestDto) {
    return apiClient(`/residence-requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
