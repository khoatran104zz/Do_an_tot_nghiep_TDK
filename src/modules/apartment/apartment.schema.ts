import { z } from 'zod';
import { ApartmentStatus } from '@prisma/client';

export const apartmentSchema = z.object({
  code: z.string().min(2, 'Mã căn hộ tối thiểu 2 ký tự (VD: A-1001)'),
  building: z.string().min(1, 'Tòa nhà không được để trống'),
  floor: z.coerce.number().int().min(1, 'Tầng phải lớn hơn 0'),
  bedrooms: z.coerce.number().int().min(1, 'Số phòng ngủ tối thiểu là 1'),
  bathrooms: z.coerce.number().int().min(1, 'Số phòng tắm tối thiểu là 1'),
  area: z.coerce.number().positive('Diện tích phải là số dương'),
  status: z.nativeEnum(ApartmentStatus).default(ApartmentStatus.VACANT),
  note: z.string().optional(),
});

export type ApartmentInput = z.infer<typeof apartmentSchema>;
