import { apiClient } from '@/lib/api-client';
import { ApartmentFilter, CreateApartmentDto, UpdateApartmentDto } from '@/modules/apartment/apartment.types';

export const apartmentClientService = {
  async getApartments(filter: ApartmentFilter = {}) {
    return apiClient('/apartments', { params: filter as any });
  },

  async getApartmentById(id: string) {
    return apiClient(`/apartments/${id}`);
  },

  async createApartment(data: CreateApartmentDto) {
    return apiClient('/apartments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApartment(id: string, data: UpdateApartmentDto) {
    return apiClient(`/apartments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteApartment(id: string) {
    return apiClient(`/apartments/${id}`, {
      method: 'DELETE',
    });
  },
};
