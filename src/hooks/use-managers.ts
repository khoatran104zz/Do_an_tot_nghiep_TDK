import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerClientService, CreateManagerDto } from '@/services/manager.service';
import { toast } from 'sonner';

export function useManagers() {
  return useQuery({
    queryKey: ['managers-list'],
    queryFn: () => managerClientService.getManagers(),
    staleTime: 60 * 1000,
  });
}

export function useAccessControlMatrix() {
  return useQuery({
    queryKey: ['access-control-matrix'],
    queryFn: () => managerClientService.getAccessControlMatrix(),
    staleTime: 60 * 1000,
  });
}

export function useCreateManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateManagerDto) => managerClientService.createManager(payload),
    onSuccess: () => {
      toast.success('Tạo tài khoản Quản lý tòa nhà thành công');
      queryClient.invalidateQueries({ queryKey: ['managers-list'] });
      queryClient.invalidateQueries({ queryKey: ['access-control-matrix'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Tạo tài khoản Quản lý thất bại');
    },
  });
}

export function useAssignBuildings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ managerId, buildingIds }: { managerId: string; buildingIds: string[] }) =>
      managerClientService.assignBuildings(managerId, buildingIds),
    onSuccess: () => {
      toast.success('Cập nhật phân công tòa nhà thành công');
      queryClient.invalidateQueries({ queryKey: ['managers-list'] });
      queryClient.invalidateQueries({ queryKey: ['access-control-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['buildings-list'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Phân công tòa nhà thất bại');
    },
  });
}

export function useDeactivateManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => managerClientService.deactivateManager(id),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa tài khoản Quản lý');
      queryClient.invalidateQueries({ queryKey: ['managers-list'] });
      queryClient.invalidateQueries({ queryKey: ['access-control-matrix'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Vô hiệu hóa thất bại');
    },
  });
}
