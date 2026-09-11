import { apiClient } from '@/lib/api-client';
import {
  VehicleFilter,
  CreateVehicleDto,
  UpdateVehicleDto,
  ApproveVehicleDto,
  RejectVehicleDto,
  CreateParkingCardDto,
} from '@/modules/vehicle/vehicle.types';

export const vehicleClientService = {
  async getVehicles(filter: VehicleFilter = {}) {
    return apiClient('/vehicles', { params: filter as any });
  },

  async getVehicleById(id: string) {
    return apiClient(`/vehicles/${id}`);
  },

  async createVehicle(data: CreateVehicleDto) {
    return apiClient('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateVehicle(id: string, data: UpdateVehicleDto) {
    return apiClient(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteVehicle(id: string) {
    return apiClient(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },

  async approveVehicle(id: string, data?: ApproveVehicleDto) {
    return apiClient(`/vehicles/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  async rejectVehicle(id: string, data: RejectVehicleDto) {
    return apiClient(`/vehicles/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deactivateVehicle(id: string) {
    return apiClient(`/vehicles/${id}/deactivate`, {
      method: 'POST',
    });
  },

  async issueParkingCard(vehicleId: string, data: CreateParkingCardDto) {
    return apiClient(`/vehicles/${vehicleId}/parking-card`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
