import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetClientService } from '@/services/asset.service';
import {
  AssetFilter,
  CreateAssetDto,
  UpdateAssetDto,
  ScheduleFilter,
  CreateScheduleDto,
  CompleteScheduleDto,
} from '@/modules/asset/asset.types';
import { toast } from 'sonner';

export function useAssets(filter: AssetFilter = {}) {
  return useQuery({
    queryKey: ['assets', filter],
    queryFn: () => assetClientService.getAssets(filter),
  });
}

export function useAssetStats(buildingId?: string) {
  return useQuery({
    queryKey: ['asset-stats', buildingId],
    queryFn: () => assetClientService.getAssetStats(buildingId),
  });
}

export function useAsset(id?: string) {
  return useQuery({
    queryKey: ['asset-detail', id],
    queryFn: () => assetClientService.getAssetById(id!),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetDto) => assetClientService.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
      toast.success('Thêm mới tài sản thiết bị thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm mới tài sản thất bại!');
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetDto }) =>
      assetClientService.updateAsset(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
      queryClient.invalidateQueries({ queryKey: ['asset-detail', variables.id] });
      toast.success('Cập nhật tài sản thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật tài sản thất bại!');
    },
  });
}

export function useMaintenanceSchedules(filter: ScheduleFilter = {}) {
  return useQuery({
    queryKey: ['maintenance-schedules', filter],
    queryFn: () => assetClientService.getMaintenanceSchedules(filter),
  });
}

export function useCreateMaintenanceSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleDto) => assetClientService.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
      toast.success('Lập kế hoạch bảo trì thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lập kế hoạch bảo trì thất bại!');
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteScheduleDto }) =>
      assetClientService.completeSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-stats'] });
      queryClient.invalidateQueries({ queryKey: ['asset-detail'] });
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
      toast.success('Xác nhận hoàn thành bảo trì & tạo phiếu công việc thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Hoàn thành bảo trì thất bại!');
    },
  });
}
