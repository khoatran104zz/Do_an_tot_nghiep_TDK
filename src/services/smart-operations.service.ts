import { apiClient } from '@/lib/api-client';

export const smartOperationsClientService = {
  async getAlerts(params: { severity?: string; entityType?: string; refresh?: boolean } = {}) {
    return apiClient('/alerts', { params: params as any });
  },

  async getInsights() {
    return apiClient('/alerts/insights');
  },
};
