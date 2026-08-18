import { z } from 'zod';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

export const createFeedbackSchema = z.object({
  category: z.nativeEnum(TicketCategory).default(TicketCategory.OTHER),
  title: z.string().min(3, 'Tiêu đề sự cố tối thiểu 3 ký tự'),
  content: z.string().min(5, 'Nội dung phản ánh tối thiểu 5 ký tự'),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  images: z.array(z.string()).optional(),
  apartmentId: z.string().optional(),
});

export const respondFeedbackSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  responseContent: z.string().optional(),
});

export const rateFeedbackSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  ratingComment: z.string().optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
