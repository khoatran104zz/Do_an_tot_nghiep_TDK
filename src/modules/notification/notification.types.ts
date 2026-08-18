import { Role } from '@prisma/client';

export interface NotificationFilter {
  isGlobal?: boolean;
  targetRole?: Role;
  page?: number;
  limit?: number;
}

export interface CreateNotificationDto {
  title: string;
  content: string;
  isGlobal?: boolean;
  targetRole?: Role;
  apartmentIds?: string[];
  senderId: string;
}
