import { z } from 'zod';
import { ApartmentStatus } from '@prisma/client';

export const buildingSchema = z.object({
  code: z.string().min(2, 'Mã tòa nhà tối thiểu 2 ký tự (VD: SMART-CITY)'),
  name: z.string().min(2, 'Tên tòa nhà tối thiểu 2 ký tự'),
  address: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const blockSchema = z.object({
  buildingId: z.string().min(1, 'Vui lòng chọn tòa nhà thuộc về'),
  code: z.string().min(2, 'Mã khối tháp tối thiểu 2 ký tự (VD: BLOCK-A)'),
  name: z.string().min(2, 'Tên khối tháp tối thiểu 2 ký tự (VD: Tháp A - Sky Tower)'),
  totalFloors: z.coerce.number().int().min(1, 'Tổng số tầng phải lớn hơn hoặc bằng 1').default(25),
});

export const floorSchema = z.object({
  blockId: z.string().min(1, 'Vui lòng chọn khối tháp thuộc về'),
  floorNumber: z.coerce.number().int().min(1, 'Số tầng phải lớn hơn hoặc bằng 1'),
  name: z.string().min(1, 'Tên tầng không được để trống (VD: Tầng 10)'),
});

export const apartmentSchema = z.object({
  code: z.string().min(2, 'Mã căn hộ tối thiểu 2 ký tự (VD: A-1001)'),
  building: z.string().optional(), // Legacy / compatibility
  floor: z.coerce.number().int().optional(), // Legacy / compatibility
  bedrooms: z.coerce.number().int().min(1, 'Số phòng ngủ tối thiểu là 1').default(2),
  bathrooms: z.coerce.number().int().min(1, 'Số phòng tắm tối thiểu là 1').default(2),
  area: z.coerce.number().positive('Diện tích phải là số dương'),
  status: z.nativeEnum(ApartmentStatus).default(ApartmentStatus.VACANT),
  note: z.string().optional().nullable(),
  buildingId: z.string().optional().nullable(),
  blockId: z.string().optional().nullable(),
  floorId: z.string().optional().nullable(),
});

export type BuildingInput = z.infer<typeof buildingSchema>;
export type BlockInput = z.infer<typeof blockSchema>;
export type FloorInput = z.infer<typeof floorSchema>;
export type ApartmentInput = z.infer<typeof apartmentSchema>;

