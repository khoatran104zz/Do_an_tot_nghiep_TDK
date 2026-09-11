import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parkingCardClientService } from '@/services/parking-card.service';
import {
  ParkingCardFilter,
  UpdateParkingCardDto,
  LockParkingCardDto,
} from '@/modules/vehicle/vehicle.types';
import { toast } from 'sonner';

export function useParkingCards(filter: ParkingCardFilter = {}) {
  return useQuery({
    queryKey: ['parking-cards', filter],
    queryFn: () => parkingCardClientService.getParkingCards(filter),
  });
}

export function useParkingCard(id: string) {
  return useQuery({
    queryKey: ['parking-card', id],
    queryFn: () => parkingCardClientService.getParkingCardById(id),
    enabled: !!id,
  });
}

export function useUpdateParkingCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateParkingCardDto }) =>
      parkingCardClientService.updateParkingCard(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-cards'] });
      queryClient.invalidateQueries({ queryKey: ['parking-card', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Cập nhật thông tin thẻ gửi xe thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật thẻ gửi xe thất bại!');
    },
  });
}

export function useLockParkingCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LockParkingCardDto }) =>
      parkingCardClientService.lockParkingCard(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-cards'] });
      queryClient.invalidateQueries({ queryKey: ['parking-card', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Đã khóa thẻ gửi xe thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Khóa thẻ gửi xe thất bại!');
    },
  });
}

export function useUnlockParkingCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => parkingCardClientService.unlockParkingCard(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['parking-cards'] });
      queryClient.invalidateQueries({ queryKey: ['parking-card', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Đã mở khóa thẻ gửi xe thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Mở khóa thẻ gửi xe thất bại!');
    },
  });
}

export function useDeleteParkingCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => parkingCardClientService.deleteParkingCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-cards'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Đã xóa thẻ gửi xe thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa thẻ gửi xe thất bại!');
    },
  });
}
