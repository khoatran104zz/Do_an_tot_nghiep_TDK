import { z } from 'zod';
import { ParcelStatus } from '@prisma/client';

export const receiveParcelSchema = z.object({
  apartmentId: z.string().min(1, 'Vui lòng chọn căn hộ nhận bưu kiện'),
  recipientId: z.string().optional().nullable(),
  recipientName: z.string().min(1, 'Vui lòng nhập tên người nhận'),
  recipientPhone: z.string().optional().nullable(),
  carrier: z.string().min(1, 'Vui lòng chọn hoặc nhập đơn vị vận chuyển'),
  trackingNumber: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const collectParcelSchema = z.object({
  pickupCode: z.string().min(4, 'Mã nhận hàng phải có ít nhất 4 chữ số').max(10),
  parcelId: z.string().optional(),
  collectedByName: z.string().optional(),
});

export const updateParcelSchema = z.object({
  carrier: z.string().optional(),
  trackingNumber: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  status: z.nativeEnum(ParcelStatus).optional(),
});

export type ReceiveParcelInput = z.infer<typeof receiveParcelSchema>;
export type CollectParcelInput = z.infer<typeof collectParcelSchema>;
export type UpdateParcelInput = z.infer<typeof updateParcelSchema>;
