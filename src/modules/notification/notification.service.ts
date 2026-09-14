import { prisma } from '@/lib/prisma';
import { notificationRepository } from './notification.repository';
import { NotificationFilter, CreateNotificationDto } from './notification.types';
import { domainEvents } from '@/lib/events/domain-events';
import { Role } from '@prisma/client';

export class NotificationService {
  async getNotifications(
    filter: NotificationFilter,
    user: { id: string; role: string }
  ) {
    let apartmentId: string | undefined = undefined;
    if (user.role === Role.RESIDENT) {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
        select: { apartmentId: true },
      });
      apartmentId = resident?.apartmentId || undefined;
    }

    return notificationRepository.findAll(filter, {
      id: user.id,
      role: user.role,
      apartmentId,
    });
  }

  async getUnreadCount(user: { id: string; role: string }) {
    let apartmentId: string | undefined = undefined;
    if (user.role === Role.RESIDENT) {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
        select: { apartmentId: true },
      });
      apartmentId = resident?.apartmentId || undefined;
    }

    return notificationRepository.countUnread(user.id, user.role, apartmentId);
  }

  async markAllAsRead(user: { id: string; role: string }) {
    let apartmentId: string | undefined = undefined;
    if (user.role === Role.RESIDENT) {
      const resident = await prisma.resident.findFirst({
        where: { userId: user.id },
        select: { apartmentId: true },
      });
      apartmentId = resident?.apartmentId || undefined;
    }

    return notificationRepository.markAllAsRead(user.id, user.role, apartmentId);
  }

  async createNotification(data: CreateNotificationDto) {
    let resolvedApartmentIds = data.apartmentIds || [];
    let isGlobal = data.isGlobal ?? true;

    if (data.targetScope === 'BUILDING' && data.targetValue) {
      isGlobal = false;
      const apts = await prisma.apartment.findMany({
        where: { building: data.targetValue },
        select: { id: true },
      });
      resolvedApartmentIds = apts.map((a) => a.id);
    } else if (data.targetScope === 'FLOOR' && data.targetValue) {
      isGlobal = false;
      const apts = await prisma.apartment.findMany({
        where: { floor: parseInt(data.targetValue, 10) || 1 },
        select: { id: true },
      });
      resolvedApartmentIds = apts.map((a) => a.id);
    } else if (data.targetScope === 'APARTMENT' && resolvedApartmentIds.length > 0) {
      isGlobal = false;
    } else if (data.targetScope === 'ALL') {
      isGlobal = true;
      resolvedApartmentIds = [];
    }

    const created = await notificationRepository.create({
      ...data,
      isGlobal,
      apartmentIds: resolvedApartmentIds,
    });

    // Dispatch realtime event
    try {
      domainEvents.dispatch({
        type: 'ANNOUNCEMENT_PUBLISHED',
        title: created.title,
        message: created.content,
        category: created.category,
        priority: created.priority,
        targetScope: isGlobal ? 'ALL' : 'ROLE',
        targetRole: Role.RESIDENT,
        relatedEntityType: created.relatedEntityType || undefined,
        relatedEntityId: created.relatedEntityId || undefined,
      });
    } catch (e) {
      console.error('Không thể dispatch realtime announcement:', e);
    }

    return created;
  }

  async markAsRead(notificationId: string, userId: string) {
    return notificationRepository.markAsRead(notificationId, userId);
  }

  async deleteNotification(id: string) {
    return notificationRepository.delete(id);
  }
}

export const notificationService = new NotificationService();
