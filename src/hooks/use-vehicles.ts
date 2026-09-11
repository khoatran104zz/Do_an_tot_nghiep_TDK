import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleClientService } from '@/services/vehicle.service';
import {
  VehicleFilter,
  CreateVehicleDto,
  UpdateVehicleDto,
  ApproveVehicleDto,
  RejectVehicleDto,
  CreateParkingCardDto,
} from '@/modules/vehicle/vehicle.types';
import { toast } from 'sonner';

export function useVehicles(filter: VehicleFilter = {}) {
  return useQuery({
    queryKey: ['vehicles', filter],
    queryFn: () => vehicleClientService.getVehicles(filter),
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleClientService.getVehicleById(id),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehicleDto) => vehicleClientService.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Đăng ký phương tiện mới thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký phương tiện thất bại!');
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleDto }) =>
      vehicleClientService.updateVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Cập nhật thông tin phương tiện thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật phương tiện thất bại!');
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleClientService.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['parking-cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Xóa phương tiện thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa phương tiện thất bại!');
    },
  });
}

export function useApproveVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApproveVehicleDto }) =>
      vehicleClientService.approveVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['parking-cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Phê duyệt phương tiện và kích hoạt thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Phê duyệt phương tiện thất bại!');
    },
  });
}

export function useRejectVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectVehicleDto }) =>
      vehicleClientService.rejectVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Đã từ chối đăng ký phương tiện');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Từ chối phương tiện thất bại!');
    },
  });
}

export function useDeactivateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleClientService.deactivateVehicle(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
      queryClient.invalidateQueries({ queryKey: ['parking-cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Đã ngưng hoạt động phương tiện và khóa thẻ xe liên quan');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ngưng hoạt động phương tiện thất bại!');
    },
  });
}

export function useIssueParkingCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: CreateParkingCardDto }) =>
      vehicleClientService.issueParkingCard(vehicleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['parking-cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-management'] });
      toast.success('Cấp thẻ gửi xe RFID thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cấp thẻ gửi xe thất bại!');
    },
  });
}
