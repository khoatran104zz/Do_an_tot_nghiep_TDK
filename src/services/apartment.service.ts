import { apiClient } from '@/lib/api-client';
import {
  ApartmentFilter,
  CreateApartmentDto,
  UpdateApartmentDto,
  CreateApartmentHistoryDto,
  CreateBuildingDto,
  UpdateBuildingDto,
  CreateBlockDto,
  UpdateBlockDto,
  CreateFloorDto,
  UpdateFloorDto,
} from '@/modules/apartment/apartment.types';

export const apartmentClientService = {
  // --- Apartment APIs ---
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

  async getHierarchy(buildingId?: string) {
    return apiClient('/apartments/hierarchy', {
      params: buildingId ? { buildingId } : undefined,
    });
  },

  async bootstrapHierarchy() {
    return apiClient('/apartments/bootstrap', {
      method: 'POST',
    });
  },

  async getHistory(apartmentId: string) {
    return apiClient(`/apartments/${apartmentId}/history`);
  },

  async createHistory(apartmentId: string, data: CreateApartmentHistoryDto) {
    return apiClient(`/apartments/${apartmentId}/history`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- Building APIs ---
  async getBuildings(namesOnly = false) {
    return apiClient('/buildings', {
      params: namesOnly ? { namesOnly: 'true' } : undefined,
    });
  },

  async getBuildingById(id: string) {
    return apiClient(`/buildings/${id}`);
  },

  async createBuilding(data: CreateBuildingDto) {
    return apiClient('/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBuilding(id: string, data: UpdateBuildingDto) {
    return apiClient(`/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBuilding(id: string) {
    return apiClient(`/buildings/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Block APIs ---
  async getBlocks(buildingId?: string) {
    return apiClient('/blocks', {
      params: buildingId ? { buildingId } : undefined,
    });
  },

  async getBlockById(id: string) {
    return apiClient(`/blocks/${id}`);
  },

  async createBlock(data: CreateBlockDto) {
    return apiClient('/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBlock(id: string, data: UpdateBlockDto) {
    return apiClient(`/blocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBlock(id: string) {
    return apiClient(`/blocks/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Floor APIs ---
  async getFloors(blockId?: string) {
    return apiClient('/floors', {
      params: blockId ? { blockId } : undefined,
    });
  },

  async getFloorById(id: string) {
    return apiClient(`/floors/${id}`);
  },

  async createFloor(data: CreateFloorDto) {
    return apiClient('/floors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFloor(id: string, data: UpdateFloorDto) {
    return apiClient(`/floors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteFloor(id: string) {
    return apiClient(`/floors/${id}`, {
      method: 'DELETE',
    });
  },
};

