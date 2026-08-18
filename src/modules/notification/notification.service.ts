import { notificationRepository } from './notification.repository';
import { NotificationFilter, CreateNotificationDto } from './notification.types';

export class NotificationService {
  async getNotifications(filter: NotificationFilter, userId?: string) {
    return notificationRepository.findAll(filter, userId);
  }

  async createNotification(data: CreateNotificationDto) {
    return notificationRepository.create(data);
  }

  async markAsRead(notificationId: string, userId: string) {
    return notificationRepository.markAsRead(notificationId, userId);
  }

  async deleteNotification(id: string) {
    return notificationRepository.delete(id);
  }
}

export const notificationService = new NotificationService();
