import { prisma } from '@/lib/prisma';
import { NotificationFilter, CreateNotificationDto } from './notification.types';
import { Prisma, Role } from '@prisma/client';

export class NotificationRepository {
  async findAll(
    filter: NotificationFilter,
    user?: { id: string; role: string; apartmentId?: string }
  ) {
    const { page = 1, limit = 15 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};

    // Role and Scope filtering
    if (user && user.role === Role.RESIDENT) {
      where.OR = [
        { isGlobal: true },
        { targetRole: Role.RESIDENT },
        ...(user.apartmentId
          ? [{ apartments: { some: { apartmentId: user.apartmentId } } }]
          : []),
      ];
    } else if (filter.targetRole) {
      where.targetRole = filter.targetRole;
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.priority) {
      where.priority = filter.priority;
    }

    if (filter.unreadOnly && user) {
      where.reads = {
        none: { userId: user.id },
      };
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { fullName: true, role: true } },
          reads: user ? { where: { userId: user.id } } : false,
          apartments: { select: { apartmentId: true } },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async countUnread(userId: string, userRole: string, apartmentId?: string) {
    const where: Prisma.NotificationWhereInput = {
      reads: {
        none: { userId },
      },
    };

    if (userRole === Role.RESIDENT) {
      where.OR = [
        { isGlobal: true },
        { targetRole: Role.RESIDENT },
        ...(apartmentId ? [{ apartments: { some: { apartmentId } } }] : []),
      ];
    }

    return prisma.notification.count({ where });
  }

  async markAllAsRead(userId: string, userRole: string, apartmentId?: string) {
    const where: Prisma.NotificationWhereInput = {
      reads: {
        none: { userId },
      },
    };

    if (userRole === Role.RESIDENT) {
      where.OR = [
        { isGlobal: true },
        { targetRole: Role.RESIDENT },
        ...(apartmentId ? [{ apartments: { some: { apartmentId } } }] : []),
      ];
    }

    const unread = await prisma.notification.findMany({
      where,
      select: { id: true },
    });

    if (unread.length === 0) return { count: 0 };

    await prisma.notificationRead.createMany({
      data: unread.map((n) => ({
        notificationId: n.id,
        userId,
      })),
      skipDuplicates: true,
    });

    return { count: unread.length };
  }

  async create(data: CreateNotificationDto) {
    return prisma.notification.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        isGlobal: data.isGlobal ?? true,
        targetRole: data.targetRole || null,
        category: data.category || 'GENERAL',
        priority: data.priority || 'NORMAL',
        targetScope: data.targetScope || 'ALL',
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        relatedEntityType: data.relatedEntityType || null,
        relatedEntityId: data.relatedEntityId || null,
        sender: { connect: { id: data.senderId! } },
        ...(data.apartmentIds && data.apartmentIds.length > 0 && {
          apartments: {
            create: data.apartmentIds.map((aptId) => ({ apartmentId: aptId })),
          },
        }),
      },
      include: {
        sender: { select: { fullName: true, role: true } },
        apartments: true,
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
