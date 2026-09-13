import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilityClientService } from '@/services/facility.service';
import {
  FacilityFilter,
  CreateFacilityDto,
  UpdateFacilityDto,
  BookingFilter,
  CreateBookingDto,
  CancelBookingDto,
} from '@/modules/facility/facility.types';
import { FacilityStatus } from '@prisma/client';
import { toast } from 'sonner';

export function useFacilities(filter: FacilityFilter = {}) {
  return useQuery({
    queryKey: ['facilities', filter],
    queryFn: () => facilityClientService.getFacilities(filter),
  });
}

export function useFacilityStats() {
  return useQuery({
    queryKey: ['facility-stats'],
    queryFn: () => facilityClientService.getFacilityStats(),
  });
}

export function useFacility(id?: string) {
  return useQuery({
    queryKey: ['facility-detail', id],
    queryFn: () => facilityClientService.getFacilityById(id!),
    enabled: !!id,
  });
}

export function useFacilitySlots(facilityId?: string, date?: string) {
  return useQuery({
    queryKey: ['facility-slots', facilityId, date],
    queryFn: () => facilityClientService.getAvailableSlots(facilityId!, date!),
    enabled: !!facilityId && !!date,
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacilityDto) => facilityClientService.createFacility(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['facility-stats'] });
      toast.success('Thêm mới tiện ích thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm tiện ích thất bại!');
    },
  });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFacilityDto }) =>
      facilityClientService.updateFacility(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['facility-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['facility-stats'] });
      toast.success('Cập nhật tiện ích thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật tiện ích thất bại!');
    },
  });
}

export function useSetFacilityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FacilityStatus }) =>
      facilityClientService.setFacilityStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['facility-stats'] });
      queryClient.invalidateQueries({ queryKey: ['facility-slots'] });
      toast.success('Cập nhật trạng thái tiện ích thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thay đổi trạng thái thất bại!');
    },
  });
}

export function useDeleteFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facilityClientService.deleteFacility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['facility-stats'] });
      toast.success('Xóa tiện ích thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa tiện ích thất bại!');
    },
  });
}

// Bookings
export function useBookings(filter: BookingFilter = {}) {
  return useQuery({
    queryKey: ['bookings', filter],
    queryFn: () => facilityClientService.getBookings(filter),
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => facilityClientService.getMyBookings(),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingDto) => facilityClientService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['facility-slots'] });
      queryClient.invalidateQueries({ queryKey: ['facility-stats'] });
      toast.success('🎉 Đặt chỗ tiện ích thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đặt chỗ thất bại. Vui lòng thử lại!');
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CancelBookingDto }) =>
      facilityClientService.cancelBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['facility-slots'] });
      queryClient.invalidateQueries({ queryKey: ['facility-stats'] });
      toast.success('Hủy lịch đặt chỗ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Hủy lịch đặt thất bại!');
    },
  });
}
