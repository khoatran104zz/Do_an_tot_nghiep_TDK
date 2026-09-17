import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelClientService } from '@/services/parcel.service';
import {
  ParcelFilter,
  ReceiveParcelDto,
  CollectParcelDto,
  UpdateParcelDto,
} from '@/modules/parcel/parcel.types';
import { toast } from 'sonner';

export function useParcels(filter: ParcelFilter = {}) {
  return useQuery({
    queryKey: ['parcels', filter],
    queryFn: () => parcelClientService.getParcels(filter),
  });
}

export function useParcelStats(buildingId?: string) {
  return useQuery({
    queryKey: ['parcel-stats', buildingId],
    queryFn: () => parcelClientService.getParcelStats(buildingId),
    refetchInterval: 30000, // Tự động làm mới mỗi 30s
  });
}

export function useParcel(id?: string) {
  return useQuery({
    queryKey: ['parcel', id],
    queryFn: () => parcelClientService.getParcelById(id!),
    enabled: Boolean(id),
  });
}

export function useReceiveParcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReceiveParcelDto) => parcelClientService.receiveParcel(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      queryClient.invalidateQueries({ queryKey: ['parcel-stats'] });
      toast.success(res?.message || 'Tiếp nhận kiện hàng và gửi thông báo thành công');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Tiếp nhận kiện hàng thất bại');
    },
  });
}

export function useCollectParcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CollectParcelDto) => parcelClientService.verifyAndCollect(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      queryClient.invalidateQueries({ queryKey: ['parcel-stats'] });
      toast.success(res?.message || 'Xác nhận bàn giao bưu kiện thành công');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Xác thực mã nhận hàng thất bại');
    },
  });
}

export function useUpdateParcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateParcelDto }) =>
      parcelClientService.updateParcel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      queryClient.invalidateQueries({ queryKey: ['parcel-stats'] });
      toast.success('Cập nhật thông tin bưu kiện thành công');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Cập nhật bưu kiện thất bại');
    },
  });
}
