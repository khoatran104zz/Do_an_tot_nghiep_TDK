import { apiClient } from '@/lib/api-client';
import {
  FacilityFilter,
  CreateFacilityDto,
  UpdateFacilityDto,
  BookingFilter,
  CreateBookingDto,
  CancelBookingDto,
} from '@/modules/facility/facility.types';
import { FacilityStatus } from '@prisma/client';

export const facilityClientService = {
  // Facilities
  async getFacilities(filter: FacilityFilter = {}) {
    return apiClient('/facilities', { params: filter as any });
  },

  async getFacilityStats() {
    return apiClient('/facilities/stats');
  },

  async getFacilityById(id: string) {
    return apiClient(`/facilities/${id}`);
  },

  async createFacility(data: CreateFacilityDto) {
    return apiClient('/facilities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFacility(id: string, data: UpdateFacilityDto) {
    return apiClient(`/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async setFacilityStatus(id: string, status: FacilityStatus) {
    return apiClient(`/facilities/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteFacility(id: string) {
    return apiClient(`/facilities/${id}`, {
      method: 'DELETE',
    });
  },

  // Slots
  async getAvailableSlots(facilityId: string, date: string) {
    return apiClient(`/facilities/${facilityId}/slots`, {
      params: { date },
    });
  },

  // Bookings
  async getBookings(filter: BookingFilter = {}) {
    return apiClient('/bookings', { params: filter as any });
  },

  async getMyBookings() {
    return apiClient('/bookings/my-bookings');
  },

  async createBooking(data: CreateBookingDto) {
    return apiClient('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async cancelBooking(id: string, data: CancelBookingDto = {}) {
    return apiClient(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
