import { ResidentStatus } from '@prisma/client';

export interface ResidentFilter {
  search?: string;
  apartmentId?: string;
  buildingId?: string;
  buildingIds?: string[];
  roleInHousehold?: string;
  relationshipToOwner?: string;
  status?: ResidentStatus;
  page?: number;
  limit?: number;
}

export interface CreateResidentDto {
  fullName: string;
  identityCard: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  roleInHousehold?: string;
  relationshipToOwner?: string;
  isOwner?: boolean;
  status?: ResidentStatus;
  apartmentId?: string;
}

export interface UpdateResidentDto extends Partial<CreateResidentDto> {}
