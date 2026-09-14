'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export function useRealtimeNotifications() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    // Connect to Server-Sent Events endpoint
    const es = new EventSource('/api/realtime');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'CONNECTED') {
          return;
        }

        // Invalidate notification queries
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });

        // Invalidate specific domain queries
        if (payload.type?.startsWith('PARCEL')) {
          queryClient.invalidateQueries({ queryKey: ['parcels'] });
          queryClient.invalidateQueries({ queryKey: ['parcel-stats'] });
        } else if (payload.type?.startsWith('POLL')) {
          queryClient.invalidateQueries({ queryKey: ['polls'] });
        } else if (payload.type?.startsWith('TICKET')) {
          queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
        } else if (payload.type?.startsWith('VISITOR')) {
          queryClient.invalidateQueries({ queryKey: ['visitors'] });
        }

        // Display toast alert
        if (payload.priority === 'EMERGENCY') {
          toast.error(`🚨 KHẨN CẤP: ${payload.title}`, {
            description: payload.message,
            duration: 10000,
          });
        } else if (payload.priority === 'URGENT') {
          toast.warning(`⚠️ ${payload.title}`, {
            description: payload.message,
            duration: 6000,
          });
        } else {
          toast.info(payload.title, {
            description: payload.message,
            duration: 4000,
          });
        }
      } catch (err) {
        // Heartbeat or malformed frame
      }
    };

    es.onerror = () => {
      // Browser automatically attempts reconnect with exponential backoff
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [session, queryClient]);
}
