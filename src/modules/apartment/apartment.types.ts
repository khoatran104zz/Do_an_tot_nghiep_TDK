import { ApartmentStatus, ApartmentHistoryEvent } from '@prisma/client';

export interface ApartmentFilter {
  search?: string;
  building?: string;
  buildingId?: string;
  block?: string;
  blockId?: string;
  floor?: number;
  floorId?: string;
  floorNumber?: number;
  status?: ApartmentStatus;
  page?: number;
  limit?: number;
}

export interface CreateBuildingDto {
  code: string;
  name: string;
  address?: string | null;
  description?: string | null;
}

export interface UpdateBuildingDto extends Partial<CreateBuildingDto> {}

export interface CreateBlockDto {
  buildingId: string;
  code: string;
  name: string;
  totalFloors?: number;
}

export interface UpdateBlockDto extends Partial<CreateBlockDto> {}

export interface CreateFloorDto {
  blockId: string;
  floorNumber: number;
  name: string;
}

export interface UpdateFloorDto extends Partial<CreateFloorDto> {}

export interface CreateApartmentDto {
  code: string;
  building?: string;
  floor?: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status?: ApartmentStatus;
  note?: string | null;
  buildingId?: string | null;
  blockId?: string | null;
  floorId?: string | null;
}

export interface UpdateApartmentDto extends Partial<CreateApartmentDto> {}

export interface CreateApartmentHistoryDto {
  event: ApartmentHistoryEvent;
  title: string;
  description?: string;
  fromStatus?: ApartmentStatus;
  toStatus?: ApartmentStatus;
  residentId?: string;
  residentName?: string;
  performedBy?: string;
  metadata?: any;
}

