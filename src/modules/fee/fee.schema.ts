import { z } from 'zod';
import { FeeUnit } from '@prisma/client';

export const feeCategorySchema = z.object({
  code: z.string().min(2, 'Mã phí tối thiểu 2 ký tự (VD: MGMT)'),
  name: z.string().min(2, 'Tên phí tối thiểu 2 ký tự'),
  unit: z.nativeEnum(FeeUnit).default(FeeUnit.PER_MONTH),
  unitPrice: z.coerce.number().min(0, 'Đơn giá không được âm'),
  description: z.string().optional(),
  isSystem: z.boolean().default(false),
});

export type FeeCategoryInput = z.infer<typeof feeCategorySchema>;
