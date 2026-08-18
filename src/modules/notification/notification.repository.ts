import { prisma } from '@/lib/prisma';
import { NotificationFilter, CreateNotificationDto } from './notification.types';
import { Prisma } from '@prisma/client';

export class NotificationRepository {
  async findAll(filter: NotificationFilter, userId?: string) {
    const { page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { fullName: true, role: true } },
          reads: userId ? { where: { userId } } : false,
        },
      }),
      prisma.notification.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: CreateNotificationDto) {
    return prisma.notification.create({
      data: {
        title: data.title,
        content: data.content,
        isGlobal: data.isGlobal ?? true,
        targetRole: data.targetRole || null,
        senderId: data.senderId,
        ...(data.apartmentIds && data.apartmentIds.length > 0 && {
          apartments: {
            create: data.apartmentIds.map((aptId) => ({ apartmentId: aptId })),
          },
        }),
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notificationRead.upsert({
      where: {
        notificationId_userId: { notificationId, userId },
      },
      create: { notificationId, userId },
      update: { readAt: new Date() },
    });
  }

  async delete(id: string) {
    return prisma.notification.delete({
      where: { id },
    });
  }
}

export const notificationRepository = new NotificationRepository();
