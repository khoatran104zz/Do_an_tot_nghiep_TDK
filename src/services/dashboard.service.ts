import { apiClient } from '@/lib/api-client';

export const dashboardClientService = {
  async getDashboardStats() {
    return apiClient('/dashboard/stats');
  },
};
