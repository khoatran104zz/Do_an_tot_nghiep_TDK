import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffClientService } from '@/services/staff.service';
import {
  StaffFilter,
  CreateStaffDto,
  UpdateStaffDto,
  AssignShiftDto,
  UpdateStaffStatusDto,
} from '@/modules/staff/staff.types';
import { toast } from 'sonner';

export function useStaffList(filter: StaffFilter = {}) {
  return useQuery({
    queryKey: ['staff', filter],
    queryFn: () => staffClientService.getStaffList(filter),
  });
}

export function useStaffStats() {
  return useQuery({
    queryKey: ['staff-stats'],
    queryFn: () => staffClientService.getStaffStats(),
  });
}

export function useStaffMember(id?: string) {
  return useQuery({
    queryKey: ['staff-member', id],
    queryFn: () => staffClientService.getStaffById(id!),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffDto) => staffClientService.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      toast.success('Thêm mới nhân sự thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm mới nhân sự thất bại!');
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffDto }) =>
      staffClientService.updateStaff(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      queryClient.invalidateQueries({ queryKey: ['staff-member', variables.id] });
      toast.success('Cập nhật thông tin nhân sự thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật nhân sự thất bại!');
    },
  });
}

export function useAssignShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignShiftDto }) =>
      staffClientService.assignShift(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      queryClient.invalidateQueries({ queryKey: ['staff-member', variables.id] });
      toast.success('Điều chuyển ca trực và khu vực phân công thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Điều chuyển ca trực thất bại!');
    },
  });
}

export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffStatusDto }) =>
      staffClientService.updateStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      queryClient.invalidateQueries({ queryKey: ['staff-member', variables.id] });
      toast.success(
        variables.data.status === 'ACTIVE'
          ? 'Đã kích hoạt tài khoản nhân sự!'
          : 'Đã cập nhật trạng thái hoạt động nhân sự!'
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật trạng thái thất bại!');
    },
  });
}
