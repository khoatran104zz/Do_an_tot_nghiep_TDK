import { apiClient } from '@/lib/api-client';
import {
  ParkingCardFilter,
  UpdateParkingCardDto,
  LockParkingCardDto,
} from '@/modules/vehicle/vehicle.types';

export const parkingCardClientService = {
  async getParkingCards(filter: ParkingCardFilter = {}) {
    return apiClient('/parking-cards', { params: filter as any });
  },

  async getParkingCardById(id: string) {
    return apiClient(`/parking-cards/${id}`);
  },

  async updateParkingCard(id: string, data: UpdateParkingCardDto) {
    return apiClient(`/parking-cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async lockParkingCard(id: string, data: LockParkingCardDto) {
    return apiClient(`/parking-cards/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async unlockParkingCard(id: string) {
    return apiClient(`/parking-cards/${id}/unlock`, {
      method: 'POST',
    });
  },

  async deleteParkingCard(id: string) {
    return apiClient(`/parking-cards/${id}`, {
      method: 'DELETE',
    });
  },
};
