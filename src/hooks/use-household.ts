import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { householdClientService } from '@/services/household.service';
import {
  ResidenceRequestFilter,
  CreateResidenceRequestDto,
  ReviewResidenceRequestDto,
} from '@/modules/household/household.types';
import { toast } from 'sonner';

export function useResidenceRequests(filter: ResidenceRequestFilter = {}) {
  return useQuery({
    queryKey: ['residence-requests', filter],
    queryFn: () => householdClientService.getResidenceRequests(filter),
  });
}

export function useCreateResidenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateResidenceRequestDto) =>
      householdClientService.createResidenceRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residence-requests'] });
      toast.success('Gửi yêu cầu cư trú thành công! Ban Quản Lý sẽ sớm xét duyệt.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gửi yêu cầu thất bại!');
    },
  });
}

export function useReviewResidenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewResidenceRequestDto }) =>
      householdClientService.reviewResidenceRequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['residence-requests'] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success(
        variables.data.action === 'APPROVE'
          ? 'Đã phê duyệt yêu cầu cư trú và cập nhật dữ liệu hộ gia đình!'
          : 'Đã từ chối yêu cầu cư trú.'
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xử lý yêu cầu thất bại!');
    },
  });
}
