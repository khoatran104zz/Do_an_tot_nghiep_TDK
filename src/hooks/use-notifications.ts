import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationClientService } from '@/services/notification.service';
import { NotificationFilter, CreateNotificationDto } from '@/modules/notification/notification.types';
import { toast } from 'sonner';

export function useNotifications(filter: NotificationFilter = {}) {
  return useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationClientService.getNotifications(filter),
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNotificationDto) => notificationClientService.createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đăng thông báo chung thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng thông báo thất bại!');
    },
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationClientService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationClientService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Xóa thông báo thành công!');
    },
  });
}
