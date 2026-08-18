import { ContractStatus, ContractType } from '@prisma/client';

export interface ContractFilter {
  search?: string;
  apartmentId?: string;
  type?: ContractType;
  status?: ContractStatus;
  expiringSoon?: boolean; // contracts expiring in 30 days
  page?: number;
  limit?: number;
}

export interface CreateContractDto {
  contractCode: string;
  apartmentId: string;
  residentId: string;
  type: ContractType;
  startDate: string;
  endDate: string;
  monthlyRent?: number;
  deposit?: number;
  fileUrl?: string;
  status?: ContractStatus;
  note?: string;
}

export interface UpdateContractDto extends Partial<CreateContractDto> {}
