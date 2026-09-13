import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apartmentClientService } from '@/services/apartment.service';
import {
  ApartmentFilter,
  CreateApartmentDto,
  UpdateApartmentDto,
  CreateApartmentHistoryDto,
} from '@/modules/apartment/apartment.types';
import { toast } from 'sonner';

export function useApartments(filter: ApartmentFilter = {}) {
  return useQuery({
    queryKey: ['apartments', filter],
    queryFn: () => apartmentClientService.getApartments(filter),
  });
}

export function useApartment(id: string) {
  return useQuery({
    queryKey: ['apartment', id],
    queryFn: () => apartmentClientService.getApartmentById(id),
    enabled: !!id,
  });
}

export function useApartmentHierarchy() {
  return useQuery({
    queryKey: ['apartment-hierarchy'],
    queryFn: () => apartmentClientService.getHierarchy(),
  });
}

export function useApartmentHistory(apartmentId: string) {
  return useQuery({
    queryKey: ['apartment-history', apartmentId],
    queryFn: () => apartmentClientService.getHistory(apartmentId),
    enabled: !!apartmentId,
  });
}

export function useCreateApartmentHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      apartmentId,
      data,
    }: {
      apartmentId: string;
      data: CreateApartmentHistoryDto;
    }) => apartmentClientService.createHistory(apartmentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apartment-history', variables.apartmentId] });
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment', variables.apartmentId] });
      toast.success('Ghi nhận sự kiện lịch sử căn hộ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ghi nhận lịch sử thất bại!');
    },
  });
}

export function useCreateApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApartmentDto) => apartmentClientService.createApartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Thêm căn hộ mới thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm căn hộ thất bại!');
    },
  });
}

export function useUpdateApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApartmentDto }) =>
      apartmentClientService.updateApartment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['apartment-history', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Cập nhật thông tin căn hộ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật thất bại!');
    },
  });
}

export function useDeleteApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apartmentClientService.deleteApartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Xóa căn hộ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa căn hộ thất bại!');
    },
  });
}
