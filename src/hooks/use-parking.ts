import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parkingClientService } from '@/services/parking.service';
import {
  ParkingAreaFilter,
  ParkingSlotFilter,
  ParkingRequestFilter,
  ParkingAccessLogFilter,
  CreateParkingAreaDto,
  UpdateParkingAreaDto,
  CreateParkingZoneDto,
  CreateParkingSlotDto,
  UpdateParkingSlotDto,
  CreateParkingRequestDto,
  ReviewParkingRequestDto,
  AssignSlotDto,
  GateCheckInDto,
  GateCheckOutDto,
} from '@/modules/parking/parking.types';
import { ParkingSlotStatus } from '@prisma/client';
import { toast } from 'sonner';

// --------------------------------------------------------------------------
// QUERIES
// --------------------------------------------------------------------------
export function useParkingAreas(filter: ParkingAreaFilter = {}) {
  return useQuery({
    queryKey: ['parking-areas', filter],
    queryFn: () => parkingClientService.getAreas(filter),
  });
}

export function useParkingArea(id: string) {
  return useQuery({
    queryKey: ['parking-area', id],
    queryFn: () => parkingClientService.getAreaById(id),
    enabled: !!id,
  });
}

export function useParkingOccupancy(buildingId?: string) {
  return useQuery({
    queryKey: ['parking-occupancy', buildingId],
    queryFn: () => parkingClientService.getOccupancy(buildingId),
    refetchInterval: 30000, // Poll every 30s for near real-time live occupancy
  });
}

export function useParkingSlots(filter: ParkingSlotFilter = {}) {
  return useQuery({
    queryKey: ['parking-slots', filter],
    queryFn: () => parkingClientService.getSlots(filter),
  });
}

export function useParkingSlot(id: string) {
  return useQuery({
    queryKey: ['parking-slot', id],
    queryFn: () => parkingClientService.getSlotById(id),
    enabled: !!id,
  });
}

export function useParkingRequests(filter: ParkingRequestFilter = {}) {
  return useQuery({
    queryKey: ['parking-requests', filter],
    queryFn: () => parkingClientService.getRequests(filter),
  });
}

export function useMyParkingAssignments() {
  return useQuery({
    queryKey: ['my-parking-assignments'],
    queryFn: () => parkingClientService.getMyAssignments(),
  });
}

export function useGateLogs(filter: ParkingAccessLogFilter = {}) {
  return useQuery({
    queryKey: ['parking-gate-logs', filter],
    queryFn: () => parkingClientService.getAccessLogs(filter),
    refetchInterval: 10000, // Frequent refetch for security gate monitoring
  });
}

// --------------------------------------------------------------------------
// MUTATIONS
// --------------------------------------------------------------------------
export function useCreateParkingArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateParkingAreaDto) => parkingClientService.createArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-areas'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      toast.success('Tạo khu vực đỗ xe thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Tạo khu vực bãi đỗ thất bại!');
    },
  });
}

export function useUpdateParkingArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateParkingAreaDto }) =>
      parkingClientService.updateArea(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-areas'] });
      queryClient.invalidateQueries({ queryKey: ['parking-area', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      toast.success('Cập nhật khu vực đỗ xe thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật thất bại!');
    },
  });
}

export function useCreateParkingZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, data }: { areaId: string; data: Omit<CreateParkingZoneDto, 'areaId'> }) =>
      parkingClientService.createZone(areaId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-area', variables.areaId] });
      queryClient.invalidateQueries({ queryKey: ['parking-areas'] });
      toast.success('Tạo phân khu bãi đỗ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Tạo phân khu thất bại!');
    },
  });
}

export function useCreateParkingSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateParkingSlotDto) => parkingClientService.createSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      queryClient.invalidateQueries({ queryKey: ['parking-areas'] });
      queryClient.invalidateQueries({ queryKey: ['parking-area'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      toast.success('Tạo vị trí đỗ xe mới thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Tạo vị trí đỗ thất bại!');
    },
  });
}

export function useUpdateParkingSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateParkingSlotDto }) =>
      parkingClientService.updateSlot(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slot', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['parking-area'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      toast.success('Cập nhật vị trí đỗ xe thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật vị trí đỗ thất bại!');
    },
  });
}

export function useUpdateSlotStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ParkingSlotStatus }) =>
      parkingClientService.updateSlotStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slot', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['parking-area'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      toast.success('Đã cập nhật trạng thái chỗ đỗ!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật trạng thái thất bại!');
    },
  });
}

export function useAssignSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<AssignSlotDto, 'slotId'> }) =>
      parkingClientService.assignSlot(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slot', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['parking-area'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Cấp phát chỗ đỗ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cấp phát chỗ đỗ thất bại!');
    },
  });
}

export function useReleaseSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => parkingClientService.releaseSlot(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slot', id] });
      queryClient.invalidateQueries({ queryKey: ['parking-area'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Đã thu hồi chỗ đỗ xe!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thu hồi chỗ đỗ thất bại!');
    },
  });
}

export function useCreateParkingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateParkingRequestDto) => parkingClientService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      toast.success('Gửi yêu cầu đăng ký chỗ đỗ thành công! Ban quản lý sẽ xem xét.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gửi yêu cầu thất bại!');
    },
  });
}

export function useReviewParkingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewParkingRequestDto }) =>
      parkingClientService.reviewRequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      queryClient.invalidateQueries({ queryKey: ['parking-areas'] });
      queryClient.invalidateQueries({ queryKey: ['parking-area'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['my-parking-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(
        variables.data.action === 'APPROVE'
          ? 'Đã phê duyệt và cấp phát chỗ đỗ xe!'
          : 'Đã từ chối yêu cầu đăng ký.'
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xử lý yêu cầu thất bại!');
    },
  });
}

export function useGateCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GateCheckInDto) => parkingClientService.checkIn(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['parking-gate-logs'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      if (res?.data?.authorized) {
        toast.success(res.data.message || 'Xe vào bãi hợp lệ - Barie mở!');
      } else {
        toast.warning(res?.data?.message || 'Cảnh báo: Xe chưa đăng ký bãi đỗ!');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi kiểm soát xe vào bãi!');
    },
  });
}

export function useGateCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GateCheckOutDto) => parkingClientService.checkOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-gate-logs'] });
      queryClient.invalidateQueries({ queryKey: ['parking-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      toast.success('Xe rời bãi thành công - Barie mở!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi kiểm soát xe ra bãi!');
    },
  });
}
