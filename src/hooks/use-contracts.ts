import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractClientService } from '@/services/contract.service';
import { ContractFilter, CreateContractDto, UpdateContractDto } from '@/modules/contract/contract.types';
import { toast } from 'sonner';

export function useContracts(filter: ContractFilter = {}) {
  return useQuery({
    queryKey: ['contracts', filter],
    queryFn: () => contractClientService.getContracts(filter),
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractClientService.getContractById(id),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContractDto) => contractClientService.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Thêm mới hợp đồng thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm hợp đồng thất bại!');
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractDto }) =>
      contractClientService.updateContract(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', variables.id] });
      toast.success('Cập nhật hợp đồng thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật hợp đồng thất bại!');
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractClientService.deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Xóa hợp đồng thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa hợp đồng thất bại!');
    },
  });
}
