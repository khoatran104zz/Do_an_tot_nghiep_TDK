import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackClientService } from '@/services/feedback.service';
import { FeedbackFilter, CreateFeedbackDto, RespondFeedbackDto, RateFeedbackDto } from '@/modules/feedback/feedback.types';
import { toast } from 'sonner';

export function useFeedbacks(filter: FeedbackFilter = {}) {
  return useQuery({
    queryKey: ['feedbacks', filter],
    queryFn: () => feedbackClientService.getFeedbacks(filter),
  });
}

export function useFeedback(id: string) {
  return useQuery({
    queryKey: ['feedback', id],
    queryFn: () => feedbackClientService.getFeedbackById(id),
    enabled: !!id,
  });
}

export function useStaffList() {
  return useQuery({
    queryKey: ['staff-list'],
    queryFn: () => feedbackClientService.getStaffList(),
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFeedbackDto) => feedbackClientService.createFeedback(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['resident-dashboard'] });
      toast.success('Gửi phản ánh thành công! Ban quản lý sẽ sớm tiếp nhận và phân công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gửi phản ánh thất bại!');
    },
  });
}

export function useWorkflowAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, payload }: { id: string; action: string; payload?: any }) =>
      feedbackClientService.triggerWorkflowAction(id, action, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['feedback', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['resident-dashboard'] });
      toast.success('Cập nhật tiến trình thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thao tác thất bại!');
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, isInternal }: { id: string; content: string; isInternal?: boolean }) =>
      feedbackClientService.addComment(id, { content, isInternal }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedback', variables.id] });
      toast.success('Đã gửi trao đổi thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi gửi trao đổi');
    },
  });
}

export function useRespondFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RespondFeedbackDto }) =>
      feedbackClientService.respondFeedback(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['feedback', variables.id] });
      toast.success('Cập nhật phản hồi thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật phản hồi thất bại!');
    },
  });
}

export function useRateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RateFeedbackDto }) =>
      feedbackClientService.rateFeedback(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['feedback', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['resident-dashboard'] });
      toast.success('Cảm ơn bạn đã gửi đánh giá dịch vụ!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đánh giá thất bại!');
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feedbackClientService.deleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      toast.success('Xóa phản ánh thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa phản ánh thất bại!');
    },
  });
}
