import { apiClient } from '@/lib/api-client';
import {
  AssetFilter,
  CreateAssetDto,
  UpdateAssetDto,
  ScheduleFilter,
  CreateScheduleDto,
  CompleteScheduleDto,
} from '@/modules/asset/asset.types';

export const assetClientService = {
  // Assets
  async getAssets(filter: AssetFilter = {}) {
    return apiClient('/assets', { params: filter as any });
  },

  async getAssetStats(buildingId?: string) {
    return apiClient('/assets/stats', {
      params: buildingId ? { buildingId } : undefined,
    });
  },

  async getAssetById(id: string) {
    return apiClient(`/assets/${id}`);
  },

  async createAsset(data: CreateAssetDto) {
    return apiClient('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAsset(id: string, data: UpdateAssetDto) {
    return apiClient(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Maintenance Schedules
  async getMaintenanceSchedules(filter: ScheduleFilter = {}) {
    return apiClient('/maintenance-schedules', { params: filter as any });
  },

  async createSchedule(data: CreateScheduleDto) {
    return apiClient('/maintenance-schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async completeSchedule(id: string, data: CompleteScheduleDto) {
    return apiClient(`/maintenance-schedules/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
