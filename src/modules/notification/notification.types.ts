import { Role, NotificationCategory, NotificationPriority, NotificationTargetScope } from '@prisma/client';

export interface NotificationFilter {
  isGlobal?: boolean;
  targetRole?: Role;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  unreadOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateNotificationDto {
  title: string;
  content: string;
  isGlobal?: boolean;
  targetRole?: Role | null;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  targetScope?: NotificationTargetScope;
  targetValue?: string | null;
  targetId?: string | null;
  apartmentIds?: string[];
  publishAt?: string | null;
  expiresAt?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  senderId?: string;
}
