import { z } from 'zod';
import { ContractStatus, ContractType } from '@prisma/client';

export const contractSchema = z.object({
  contractCode: z.string().min(3, 'Mã hợp đồng tối thiểu 3 ký tự (VD: HD-2026-001)'),
  apartmentId: z.string().min(1, 'Vui lòng chọn căn hộ'),
  residentId: z.string().min(1, 'Vui lòng chọn cư dân đại diện'),
  type: z.nativeEnum(ContractType).default(ContractType.RENT),
  startDate: z.string().min(1, 'Ngày bắt đầu hợp đồng là bắt buộc'),
  endDate: z.string().min(1, 'Ngày kết thúc hợp đồng là bắt buộc'),
  monthlyRent: z.coerce.number().optional(),
  deposit: z.coerce.number().optional(),
  fileUrl: z.string().optional(),
  status: z.nativeEnum(ContractStatus).default(ContractStatus.ACTIVE),
  note: z.string().optional(),
});

export type ContractInput = z.infer<typeof contractSchema>;
