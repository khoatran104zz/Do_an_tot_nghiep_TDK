import { apiClient } from '@/lib/api-client';
import {
  ParcelFilter,
  ReceiveParcelDto,
  CollectParcelDto,
  UpdateParcelDto,
} from '@/modules/parcel/parcel.types';

export const parcelClientService = {
  async getParcels(filter: ParcelFilter = {}) {
    return apiClient('/parcels', { params: filter as any });
  },

  async getParcelStats() {
    return apiClient('/parcels/stats');
  },

  async getParcelById(id: string) {
    return apiClient(`/parcels/${id}`);
  },

  async receiveParcel(data: ReceiveParcelDto) {
    return apiClient('/parcels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyAndCollect(data: CollectParcelDto) {
    return apiClient('/parcels/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateParcel(id: string, data: UpdateParcelDto) {
    return apiClient(`/parcels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
