import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { domainEvents, DomainEventPayload } from '@/lib/events/domain-events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  // Resolve resident apartmentId if user is resident
  let residentApartmentId: string | null = null;
  if (userRole === 'RESIDENT') {
    const resident = await prisma.resident.findFirst({
      where: { userId },
      select: { apartmentId: true },
    });
    residentApartmentId = resident?.apartmentId || null;
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connected event
  const initialPayload = JSON.stringify({
    type: 'CONNECTED',
    message: 'Kết nối realtime thành công',
    timestamp: new Date().toISOString(),
  });
  writer.write(encoder.encode(`data: ${initialPayload}\n\n`));

  // Event listener handler
  const eventHandler = (event: DomainEventPayload) => {
    // Check if event is relevant for this connected user
    let shouldDeliver = false;

    if (event.targetScope === 'ALL') {
      shouldDeliver = true;
    } else if (event.targetScope === 'ROLE') {
      shouldDeliver = event.targetRole === userRole;
    } else if (event.targetScope === 'APARTMENT') {
      shouldDeliver = Boolean(
        residentApartmentId && event.targetApartmentId === residentApartmentId
      );
    } else if (event.targetScope === 'USER') {
      shouldDeliver = event.targetUserId === userId;
    }

    if (shouldDeliver) {
      const data = JSON.stringify(event);
      writer.write(encoder.encode(`data: ${data}\n\n`)).catch(() => {});
    }
  };

  domainEvents.on('domain_event', eventHandler);

  // Heartbeat ping every 15s to keep connection alive
  const heartbeatInterval = setInterval(() => {
    writer.write(encoder.encode(': ping\n\n')).catch(() => {
      clearInterval(heartbeatInterval);
    });
  }, 15000);

  // Clean up on abort
  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval);
    domainEvents.off('domain_event', eventHandler);
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
