import { apiClient } from '@/lib/api-client';

export const dashboardClientService = {
  async getDashboardStats() {
    return apiClient('/dashboard/stats');
  },

  async getManagementDashboard(months: number = 6) {
    return apiClient(`/dashboard/management?months=${months}`);
  },
};
