import { apiClient } from '@/lib/api-client';
import { ContractFilter, CreateContractDto, UpdateContractDto } from '@/modules/contract/contract.types';

export const contractClientService = {
  async getContracts(filter: ContractFilter = {}) {
    return apiClient('/contracts', { params: filter as any });
  },

  async getContractById(id: string) {
    return apiClient(`/contracts/${id}`);
  },

  async createContract(data: CreateContractDto) {
    return apiClient('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateContract(id: string, data: UpdateContractDto) {
    return apiClient(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteContract(id: string) {
    return apiClient(`/contracts/${id}`, {
      method: 'DELETE',
    });
  },
};
