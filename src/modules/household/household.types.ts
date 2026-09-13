import {
  ResidenceRequestType,
  ResidenceRequestStatus,
  ResidentRelationship,
  ResidentStatus,
  Resident,
} from '@prisma/client';

export interface ResidenceRequestFilter {
  search?: string;
  apartmentId?: string;
  requesterId?: string;
  status?: ResidenceRequestStatus;
  type?: ResidenceRequestType;
  page?: number;
  limit?: number;
}

export interface CreateResidenceRequestDto {
  type: ResidenceRequestType;
  apartmentId: string;
  fullName: string;
  identityCard: string;
  phone: string;
  relationship?: ResidentRelationship;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  note?: string | null;
  attachmentUrl?: string | null;
}

export interface ReviewResidenceRequestDto {
  action: 'APPROVE' | 'REJECT';
  rejectReason?: string | null;
}

export interface HouseholdGroup {
  owner: Resident | null;
  familyMembers: Resident[];
  tenants: Resident[];
  temporaryResidents: Resident[];
  allResidents: Resident[];
  totalActiveCount: number;
}
