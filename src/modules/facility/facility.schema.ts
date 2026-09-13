import { z } from 'zod';
import { FacilityType, FacilityStatus, BookingStatus } from '@prisma/client';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createFacilitySchema = z.object({
  name: z.string().min(2, 'Tên tiện ích tối thiểu 2 ký tự'),
  type: z.nativeEnum(FacilityType),
  description: z.string().optional().nullable(),
  location: z.string().min(2, 'Vị trí tiện ích không được để trống'),
  buildingId: z.string().optional().nullable(),
  openTime: z.string().regex(timeRegex, 'Giờ mở cửa phải có định dạng HH:mm (VD: 06:00)'),
  closeTime: z.string().regex(timeRegex, 'Giờ đóng cửa phải có định dạng HH:mm (VD: 22:00)'),
  slotDuration: z.number().int().min(15).max(360).default(60),
  maxUsers: z.number().int().min(1).default(1),
  fee: z.number().min(0).default(0),
  status: z.nativeEnum(FacilityStatus).default(FacilityStatus.ACTIVE),
  images: z.array(z.string()).default([]),
  rules: z.string().optional().nullable(),
});

export const updateFacilitySchema = createFacilitySchema.partial();

export const updateFacilityStatusSchema = z.object({
  status: z.nativeEnum(FacilityStatus),
});

export const createBookingSchema = z.object({
  facilityId: z.string().min(1, 'Tiện ích không được để trống'),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày đặt phải có định dạng YYYY-MM-DD'),
  startTime: z.string().regex(timeRegex, 'Giờ bắt đầu phải có định dạng HH:mm'),
  endTime: z.string().regex(timeRegex, 'Giờ kết thúc phải có định dạng HH:mm'),
  numberOfUsers: z.number().int().min(1, 'Số lượng người tham gia tối thiểu 1').default(1),
  notes: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(3, 'Lý do hủy đặt chỗ tối thiểu 3 ký tự').optional(),
});
