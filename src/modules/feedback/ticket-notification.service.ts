import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export class TicketNotificationService {
  /**
   * Helper to ensure valid senderId (falls back to an Admin/Manager if not provided)
   */
  private async resolveSenderId(preferredSenderId?: string): Promise<string> {
    if (preferredSenderId) return preferredSenderId;
    const admin = await prisma.user.findFirst({
      where: { role: { in: [Role.ADMIN, Role.MANAGER] } },
      select: { id: true },
    });
    return admin?.id || '';
  }

  /**
   * Event 1: Ticket created -> notify Manager / Admin
   */
  async notifyTicketCreated(params: {
    ticketId: string;
    ticketCode: string;
    title: string;
    apartmentCode: string;
    senderId: string;
  }) {
    try {
      await prisma.notification.create({
        data: {
          title: `Sự cố mới cần điều phối: ${params.apartmentCode}`,
          content: `Căn hộ ${params.apartmentCode} vừa gửi yêu cầu sửa chữa "${params.title}" (Mã: ${params.ticketCode}).`,
          isGlobal: false,
          targetRole: Role.MANAGER,
          senderId: params.senderId,
        },
      });
    } catch (error) {
      console.error('[NotificationService] notifyTicketCreated failed:', error);
    }
  }

  /**
   * Event 2: Ticket assigned -> notify Staff
   */
  async notifyTicketAssigned(params: {
    ticketId: string;
    ticketCode: string;
    title: string;
    apartmentCode: string;
    staffId: string;
    senderId: string;
  }) {
    try {
      const staff = await prisma.user.findUnique({
        where: { id: params.staffId },
        select: { fullName: true },
      });

      await prisma.notification.create({
        data: {
          title: `Phân công bảo trì: ${params.ticketCode}`,
          content: `Kỹ thuật viên ${staff?.fullName || ''} được phân công xử lý sự cố "${params.title}" tại căn hộ ${params.apartmentCode}.`,
          isGlobal: false,
          targetRole: Role.MANAGER,
          senderId: params.senderId,
        },
      });
    } catch (error) {
      console.error('[NotificationService] notifyTicketAssigned failed:', error);
    }
  }

  /**
   * Event 3: Ticket resolved -> notify Resident
   */
  async notifyTicketResolved(params: {
    ticketId: string;
    ticketCode: string;
    title: string;
    apartmentId: string;
    senderId: string;
  }) {
    try {
      const senderId = await this.resolveSenderId(params.senderId);
      if (!senderId) return;

      await prisma.notification.create({
        data: {
          title: `Sự cố kỹ thuật đã xử lý: ${params.title}`,
          content: `Yêu cầu sửa chữa (Mã: ${params.ticketCode}) đã được hoàn tất. Quý cư dân vui lòng kiểm tra và gửi đánh giá dịch vụ.`,
          isGlobal: false,
          targetRole: Role.RESIDENT,
          senderId,
          apartments: {
            create: [{ apartmentId: params.apartmentId }],
          },
        },
      });
    } catch (error) {
      console.error('[NotificationService] notifyTicketResolved failed:', error);
    }
  }

  /**
   * Event 4: Ticket rejected -> notify Resident
   */
  async notifyTicketRejected(params: {
    ticketId: string;
    ticketCode: string;
    title: string;
    apartmentId: string;
    reason: string;
    senderId: string;
  }) {
    try {
      const senderId = await this.resolveSenderId(params.senderId);
      if (!senderId) return;

      await prisma.notification.create({
        data: {
          title: `Phản ánh không tiếp nhận: ${params.title}`,
          content: `Yêu cầu (Mã: ${params.ticketCode}) chưa thể tiếp nhận. Lý do: ${params.reason}`,
          isGlobal: false,
          targetRole: Role.RESIDENT,
          senderId,
          apartments: {
            create: [{ apartmentId: params.apartmentId }],
          },
        },
      });
    } catch (error) {
      console.error('[NotificationService] notifyTicketRejected failed:', error);
    }
  }

  /**
   * Event 5: Rating submitted -> notify Manager
   */
  async notifyRatingSubmitted(params: {
    ticketId: string;
    ticketCode: string;
    title: string;
    apartmentCode: string;
    rating: number;
    comment?: string | null;
    senderId: string;
  }) {
    try {
      const stars = '⭐'.repeat(params.rating);
      await prisma.notification.create({
        data: {
          title: `Đánh giá dịch vụ (${stars}): ${params.apartmentCode}`,
          content: `Căn hộ ${params.apartmentCode} đã đánh giá ${params.rating}/5 sao cho sự cố "${params.title}". ${
            params.comment ? `Ý kiến: "${params.comment}"` : ''
          }`,
          isGlobal: false,
          targetRole: Role.MANAGER,
          senderId: params.senderId,
        },
      });
    } catch (error) {
      console.error('[NotificationService] notifyRatingSubmitted failed:', error);
    }
  }
}

export const ticketNotificationService = new TicketNotificationService();
