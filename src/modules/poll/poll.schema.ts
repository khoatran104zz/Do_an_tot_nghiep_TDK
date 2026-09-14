import { z } from 'zod';
import { PollStatus, PollTargetScope } from '@prisma/client';

export const createPollSchema = z
  .object({
    title: z.string().min(5, 'Tiêu đề khảo sát phải có ít nhất 5 ký tự').max(200),
    description: z.string().optional().nullable(),
    options: z
      .array(z.string().min(1, 'Nội dung phương án không được để trống'))
      .min(2, 'Cuộc khảo sát phải có ít nhất 2 phương án lựa chọn'),
    startAt: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
    endAt: z.string().min(1, 'Vui lòng chọn thời hạn kết thúc'),
    targetScope: z.nativeEnum(PollTargetScope).default(PollTargetScope.ALL_APARTMENTS),
    targetValue: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startAt).getTime();
      const end = new Date(data.endAt).getTime();
      return end > start;
    },
    {
      message: 'Thời hạn kết thúc phải sau thời gian bắt đầu',
      path: ['endAt'],
    }
  )
  .refine(
    (data) => {
      const normalized = data.options.map((o) => o.trim().toLowerCase());
      const set = new Set(normalized);
      return set.size === normalized.length;
    },
    {
      message: 'Các phương án biểu quyết không được trùng nhau',
      path: ['options'],
    }
  );

export const votePollSchema = z.object({
  optionId: z.string().min(1, 'Vui lòng chọn một phương án biểu quyết'),
});

export const updatePollSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(PollStatus).optional(),
  endAt: z.string().optional(),
  options: z.array(z.string().min(1)).min(2).optional(),
});
