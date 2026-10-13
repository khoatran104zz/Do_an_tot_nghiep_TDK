import { z } from 'zod';
import { ResidentStatus } from '@prisma/client';

export const residentSchema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  identityCard: z.string().min(9, 'Số CCCD/CMND tối thiểu 9 số'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  roleInHousehold: z.string().optional(),
  relationshipToOwner: z.string().optional(),
  isOwner: z.boolean().optional(),
  status: z.nativeEnum(ResidentStatus).default(ResidentStatus.RESIDING),
  apartmentId: z.string().optional().or(z.literal('')),
});

export type ResidentInput = z.infer<typeof residentSchema>;
