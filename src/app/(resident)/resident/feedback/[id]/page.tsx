import React from 'react';
import { TicketDetail } from '@/components/tickets/ticket-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResidentFeedbackDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50/50">
      <TicketDetail
        ticketId={id}
        mode="RESIDENT"
        backUrl="/resident/feedback"
      />
    </div>
  );
}
