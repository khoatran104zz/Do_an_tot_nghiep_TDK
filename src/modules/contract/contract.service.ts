import { contractRepository } from './contract.repository';
import { ContractFilter, CreateContractDto, UpdateContractDto } from './contract.types';

export class ContractService {
  async getContracts(filter: ContractFilter) {
    return contractRepository.findAll(filter);
  }

  async getContractById(id: string) {
    const item = await contractRepository.findById(id);
    if (!item) {
      throw new Error('Không tìm thấy hợp đồng yêu cầu');
    }
    return item;
  }

  async createContract(data: CreateContractDto) {
    const existing = await contractRepository.findByCode(data.contractCode);
    if (existing) {
      throw new Error(`Mã hợp đồng "${data.contractCode}" đã tồn tại`);
    }

    if (new Date(data.endDate) <= new Date(data.startDate)) {
      throw new Error('Ngày kết thúc phải lớn hơn ngày bắt đầu hợp đồng');
    }

    return contractRepository.create(data);
  }

  async updateContract(id: string, data: UpdateContractDto) {
    await this.getContractById(id);

    if (data.contractCode) {
      const existing = await contractRepository.findByCode(data.contractCode);
      if (existing && existing.id !== id) {
        throw new Error(`Mã hợp đồng "${data.contractCode}" đã trùng với hợp đồng khác`);
      }
    }

    if (data.startDate && data.endDate) {
      if (new Date(data.endDate) <= new Date(data.startDate)) {
        throw new Error('Ngày kết thúc phải lớn hơn ngày bắt đầu hợp đồng');
      }
    }

    return contractRepository.update(id, data);
  }

  async deleteContract(id: string) {
    await this.getContractById(id);
    return contractRepository.delete(id);
  }
}

export const contractService = new ContractService();
