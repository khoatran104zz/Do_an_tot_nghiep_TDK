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

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationClientService.getUnreadCount(),
    refetchInterval: 30000, // Background fallback polling
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNotificationDto) => notificationClientService.createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Gửi thông báo thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gửi thông báo thất bại!');
    },
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationClientService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationClientService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('Đã đánh dấu tất cả là đã đọc!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể đánh dấu đã đọc');
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationClientService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('Xóa thông báo thành công!');
    },
  });
}
