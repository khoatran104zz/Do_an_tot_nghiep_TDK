import { apiClient } from '@/lib/api-client';
import { SmartAlertFilter } from '@/modules/smart-operations/smart-operations.types';

export const smartOperationsClientService = {
  async getAlerts(filter: SmartAlertFilter = {}) {
    return apiClient('/alerts', {
      params: filter as any,
    });
  },

  async acknowledgeAlert(id: string) {
    return apiClient(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'ACKNOWLEDGE' }),
    });
  },

  async resolveAlert(id: string) {
    return apiClient(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'RESOLVE' }),
    });
  },
};
