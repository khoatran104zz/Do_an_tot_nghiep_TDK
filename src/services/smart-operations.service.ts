import { apiClient } from '@/lib/api-client';
import { SmartAlertFilter } from '@/modules/smart-operations/smart-operations.types';

export const smartOperationsClientService = {
  async getSensors() {
    return apiClient('/smart-operations/sensors');
  },

  async triggerSimulation(scenario: 'WATER_LEAKAGE' | 'SMOKE' | 'ELEVATOR' | 'HIGH_TEMP' | 'RESET') {
    return apiClient('/smart-operations/simulation', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
  },

  async getAlerts(filter: SmartAlertFilter = {}) {
    return apiClient('/smart-operations/alerts', {
      params: filter as any,
    });
  },

  async acknowledgeAlert(id: string) {
    return apiClient(`/smart-operations/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'ACKNOWLEDGE' }),
    });
  },

  async resolveAlert(id: string) {
    return apiClient(`/smart-operations/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'RESOLVE' }),
    });
  },
};
