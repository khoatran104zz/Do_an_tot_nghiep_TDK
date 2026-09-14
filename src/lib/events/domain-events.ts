import { EventEmitter } from 'events';
import { NotificationCategory, NotificationPriority, Role } from '@prisma/client';

export type DomainEventType =
  | 'PARCEL_RECEIVED'
  | 'PARCEL_COLLECTED'
  | 'VISITOR_CHECKED_IN'
  | 'TICKET_STATUS_CHANGED'
  | 'EMERGENCY_ALERT'
  | 'INVOICE_CREATED'
  | 'POLL_PUBLISHED'
  | 'ANNOUNCEMENT_PUBLISHED';

export interface DomainEventPayload {
  type: DomainEventType;
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  targetScope: 'ALL' | 'ROLE' | 'APARTMENT' | 'USER';
  targetRole?: Role;
  targetApartmentId?: string;
  targetUserId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  timestamp?: string;
}

class DomainEventEmitter extends EventEmitter {
  constructor() {
    super();
    // Allow large number of concurrent SSE connections without leak warnings
    this.setMaxListeners(500);
  }

  dispatch(event: DomainEventPayload) {
    const enriched: DomainEventPayload = {
      ...event,
      priority: event.priority || NotificationPriority.NORMAL,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    this.emit('domain_event', enriched);
  }
}

// Global singleton for Next.js hot-reload development
declare global {
  var __domainEventsInstance: DomainEventEmitter | undefined;
}

export const domainEvents: DomainEventEmitter =
  global.__domainEventsInstance || (global.__domainEventsInstance = new DomainEventEmitter());
