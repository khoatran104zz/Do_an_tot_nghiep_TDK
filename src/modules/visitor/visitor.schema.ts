import { z } from 'zod';
import { VisitorStatus } from '@prisma/client';

export const createVisitorPassSchema = z.object({
  visitorName: z.string().min(2, 'Họ tên khách thăm tối thiểu 2 ký tự'),
  visitorPhone: z
    .string()
    .min(9, 'Số điện thoại tối thiểu 9 số')
    .max(15, 'Số điện thoại tối đa 15 số')
    .regex(/^[0-9+() -]+$/, 'Số điện thoại không hợp lệ'),
  visitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hẹn phải có định dạng YYYY-MM-DD'),
  expectedTime: z.string().min(3, 'Khung giờ dự kiến không được để trống'),
  licensePlate: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  apartmentId: z.string().optional(),
});

export const scanVisitorPassSchema = z.object({
  passCodeOrQr: z.string().min(3, 'Mã thẻ hoặc mã QR không hợp lệ'),
});

export const cancelVisitorPassSchema = z.object({
  reason: z.string().optional(),
});
