import { ResidentRelationship, ResidentStatus } from '@prisma/client';

export interface ResidentFilter {
  search?: string;
  apartmentId?: string;
  relationshipToOwner?: ResidentRelationship;
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
  relationshipToOwner?: ResidentRelationship;
  status?: ResidentStatus;
  apartmentId?: string;
}

export interface UpdateResidentDto extends Partial<CreateResidentDto> {}
