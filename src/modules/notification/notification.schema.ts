import { z } from 'zod';
import { Role, NotificationCategory, NotificationPriority, NotificationTargetScope } from '@prisma/client';

export const createNotificationSchema = z.object({
  title: z.string().min(3, 'Tiêu đề thông báo phải có ít nhất 3 ký tự').max(200),
  content: z.string().min(5, 'Nội dung thông báo phải có ít nhất 5 ký tự'),
  isGlobal: z.boolean().optional(),
  targetRole: z.nativeEnum(Role).optional().nullable(),
  category: z.nativeEnum(NotificationCategory).default(NotificationCategory.GENERAL),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
  targetScope: z.nativeEnum(NotificationTargetScope).default(NotificationTargetScope.ALL),
  targetValue: z.string().optional().nullable(),
  apartmentIds: z.array(z.string()).optional(),
  publishAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  relatedEntityType: z.string().optional().nullable(),
  relatedEntityId: z.string().optional().nullable(),
});
