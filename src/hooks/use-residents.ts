import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { residentClientService } from '@/services/resident.service';
import { ResidentFilter, CreateResidentDto, UpdateResidentDto } from '@/modules/resident/resident.types';
import { toast } from 'sonner';

export function useResidents(filter: ResidentFilter = {}) {
  return useQuery({
    queryKey: ['residents', filter],
    queryFn: () => residentClientService.getResidents(filter),
  });
}

export function useResident(id: string) {
  return useQuery({
    queryKey: ['resident', id],
    queryFn: () => residentClientService.getResidentById(id),
    enabled: !!id,
  });
}

export function useCreateResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateResidentDto) => residentClientService.createResident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      toast.success('Thêm hồ sơ cư dân thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm cư dân thất bại!');
    },
  });
}

export function useUpdateResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResidentDto }) =>
      residentClientService.updateResident(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['resident', variables.id] });
      toast.success('Cập nhật hồ sơ cư dân thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật thất bại!');
    },
  });
}

export function useDeleteResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => residentClientService.deleteResident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      toast.success('Xóa cư dân thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa cư dân thất bại!');
    },
  });
}

export function useResidentDashboard() {
  return useQuery({
    queryKey: ['resident-dashboard'],
    queryFn: () => residentClientService.getResidentDashboard(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

