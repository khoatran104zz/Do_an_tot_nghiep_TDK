import { apiClient } from '@/lib/api-client';
import { NotificationFilter, CreateNotificationDto } from '@/modules/notification/notification.types';

export const notificationClientService = {
  async getNotifications(filter: NotificationFilter = {}) {
    return apiClient('/notifications', { params: filter as any });
  },

  async getUnreadCount() {
    return apiClient<{ unreadCount: number }>('/notifications/unread-count');
  },

  async createNotification(data: CreateNotificationDto) {
    return apiClient('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async markAsRead(id: string) {
    return apiClient(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  async markAllAsRead() {
    return apiClient('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  async deleteNotification(id: string) {
    return apiClient(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};
