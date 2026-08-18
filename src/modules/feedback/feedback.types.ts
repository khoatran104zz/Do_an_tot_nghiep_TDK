import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

export interface FeedbackFilter {
  search?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  apartmentId?: string;
  residentId?: string;
  page?: number;
  limit?: number;
}

export interface CreateFeedbackDto {
  apartmentId?: string;
  residentId?: string;
  category: TicketCategory;
  title: string;
  content: string;
  images?: string[];
  priority?: TicketPriority;
}

export interface RespondFeedbackDto {
  status: TicketStatus;
  responseContent?: string;
}

export interface RateFeedbackDto {
  rating: number; // 1-5
  ratingComment?: string;
}
