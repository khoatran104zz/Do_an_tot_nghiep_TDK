import { z } from 'zod';
import {
  ResidenceRequestType,
  ResidentRelationship,
} from '@prisma/client';

export const createResidenceRequestSchema = z.object({
  type: z.nativeEnum(ResidenceRequestType),
  apartmentId: z.string().min(1, 'Căn hộ không được để trống'),
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  identityCard: z.string().min(6, 'Số CCCD/Hộ chiếu không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  relationship: z.nativeEnum(ResidentRelationship).optional().default(ResidentRelationship.FAMILY),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
});

export const reviewResidenceRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectReason: z.string().optional().nullable(),
});
