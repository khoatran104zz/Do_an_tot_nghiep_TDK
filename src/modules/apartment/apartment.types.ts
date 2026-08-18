import { ApartmentStatus } from '@prisma/client';

export interface ApartmentFilter {
  search?: string;
  building?: string;
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
}

export interface UpdateApartmentDto extends Partial<CreateApartmentDto> {}
