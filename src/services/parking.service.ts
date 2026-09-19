import { apiClient } from '@/lib/api-client';
import {
  ParkingAreaFilter,
  ParkingSlotFilter,
  ParkingRequestFilter,
  ParkingAccessLogFilter,
  CreateParkingAreaDto,
  UpdateParkingAreaDto,
  CreateParkingZoneDto,
  CreateParkingSlotDto,
  UpdateParkingSlotDto,
  CreateParkingRequestDto,
  ReviewParkingRequestDto,
  AssignSlotDto,
  GateCheckInDto,
  GateCheckOutDto,
} from '@/modules/parking/parking.types';
import { ParkingSlotStatus } from '@prisma/client';

export const parkingClientService = {
  // Areas & Zones
  async getAreas(filter: ParkingAreaFilter = {}) {
    return apiClient('/parking/areas', { params: filter as any });
  },

  async getAreaById(id: string) {
    return apiClient(`/parking/areas/${id}`);
  },

  async createArea(data: CreateParkingAreaDto) {
    return apiClient('/parking/areas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateArea(id: string, data: UpdateParkingAreaDto) {
    return apiClient(`/parking/areas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async createZone(areaId: string, data: Omit<CreateParkingZoneDto, 'areaId'>) {
    return apiClient(`/parking/areas/${areaId}/zones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Slots
  async getSlots(filter: ParkingSlotFilter = {}) {
    return apiClient('/parking/slots', { params: filter as any });
  },

  async getSlotById(id: string) {
    return apiClient(`/parking/slots/${id}`);
  },

  async createSlot(data: CreateParkingSlotDto) {
    return apiClient('/parking/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSlot(id: string, data: UpdateParkingSlotDto) {
    return apiClient(`/parking/slots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateSlotStatus(id: string, status: ParkingSlotStatus) {
    return apiClient(`/parking/slots/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async assignSlot(id: string, data: Omit<AssignSlotDto, 'slotId'>) {
    return apiClient(`/parking/slots/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async releaseSlot(id: string) {
    return apiClient(`/parking/slots/${id}/release`, {
      method: 'POST',
    });
  },

  // Registration Requests
  async getRequests(filter: ParkingRequestFilter = {}) {
    return apiClient('/parking/requests', { params: filter as any });
  },

  async createRequest(data: CreateParkingRequestDto) {
    return apiClient('/parking/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewRequest(id: string, data: ReviewParkingRequestDto) {
    return apiClient(`/parking/requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Resident Passes
  async getMyAssignments() {
    return apiClient('/parking/my-assignments');
  },

  // Occupancy & Analytics
  async getOccupancy(buildingId?: string) {
    return apiClient('/parking/occupancy', { params: { buildingId } });
  },

  // Gate Operations
  async checkIn(data: GateCheckInDto) {
    return apiClient('/parking/gate/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkOut(data: GateCheckOutDto) {
    return apiClient('/parking/gate/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAccessLogs(filter: ParkingAccessLogFilter = {}) {
    return apiClient('/parking/gate/logs', { params: filter as any });
  },
};
