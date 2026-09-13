import { ApartmentStatus, ApartmentHistoryEvent } from '@prisma/client';

export interface ApartmentFilter {
  search?: string;
  building?: string;
  block?: string;
  blockId?: string;
  floor?: number;
  floorNumber?: number;
  status?: ApartmentStatus;
  page?: number;
  limit?: number;
}

export interface CreateApartmentDto {
  code: string;
  building: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status?: ApartmentStatus;
  note?: string;
  buildingId?: string;
  blockId?: string;
  floorId?: string;
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
