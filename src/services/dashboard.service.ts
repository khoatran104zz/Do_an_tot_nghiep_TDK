import { apiClient } from '@/lib/api-client';

export const dashboardClientService = {
  async getDashboardStats() {
    return apiClient('/dashboard/stats');
  },

  async getManagementDashboard(months: number = 6) {
    return apiClient(`/dashboard/management?months=${months}`);
  },

  async getAdminDashboard() {
    return apiClient('/dashboard/admin');
  },

  async getManagerScopedDashboard(buildingId?: string) {
    const url = buildingId
      ? `/dashboard/manager?buildingId=${encodeURIComponent(buildingId)}`
      : '/dashboard/manager';
    return apiClient(url);
  },
};
