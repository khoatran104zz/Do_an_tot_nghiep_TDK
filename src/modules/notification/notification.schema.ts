import { z } from 'zod';
import { Role } from '@prisma/client';

export const createNotificationSchema = z.object({
  title: z.string().min(3, 'Tiêu đề thông báo tối thiểu 3 ký tự'),
  content: z.string().min(5, 'Nội dung thông báo tối thiểu 5 ký tự'),
  isGlobal: z.boolean().default(true),
  targetRole: z.nativeEnum(Role).optional(),
  apartmentIds: z.array(z.string()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
