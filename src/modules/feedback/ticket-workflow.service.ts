import { prisma } from '@/lib/prisma';
import { TicketPriority, TicketStatus, Role } from '@prisma/client';
import { ticketNotificationService } from './ticket-notification.service';

export const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  URGENT: 4,
  CRITICAL: 4,
};

export type SLAStatus = 'ON_TRACK' | 'APPROACHING' | 'OVERDUE';

export interface SLAInfo {
  dueAt: Date;
  status: SLAStatus;
  remainingHours: number;
  label: string;
  isOverdue: boolean;
}

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: [TicketStatus.ASSIGNED, TicketStatus.REJECTED],
  ASSIGNED: [TicketStatus.PROCESSING],
  PROCESSING: [TicketStatus.RESOLVED],
  RESOLVED: [TicketStatus.CLOSED],
  CLOSED: [],
  REJECTED: [],
};

export class TicketWorkflowService {
  /**
   * Calculate SLA details for a ticket based on created date & priority
   */
  calculateSla(
    createdAt: Date,
    priority: TicketPriority,
    slaDueAt?: Date | null,
    currentStatus?: TicketStatus,
    resolvedAt?: Date | null
  ): SLAInfo {
    const hours = SLA_HOURS_BY_PRIORITY[priority] || 48;
    const dueAt = slaDueAt || new Date(new Date(createdAt).getTime() + hours * 3600 * 1000);
    const now = new Date();

    const isTerminal = currentStatus === TicketStatus.RESOLVED || currentStatus === TicketStatus.CLOSED;
    const checkTime = isTerminal && resolvedAt ? new Date(resolvedAt).getTime() : now.getTime();
    const diffMs = dueAt.getTime() - checkTime;
    const remainingHours = Math.round((diffMs / (3600 * 1000)) * 10) / 10;

    let status: SLAStatus = 'ON_TRACK';
    let label = '🟢 Đúng hạn cam kết';
    let isOverdue = false;

    if (diffMs < 0) {
      status = 'OVERDUE';
      label = `🔴 Quá hạn SLA (${Math.abs(remainingHours)}h)`;
      isOverdue = true;
    } else if (remainingHours <= 4 || diffMs <= 0.25 * hours * 3600 * 1000) {
      status = 'APPROACHING';
      label = `🟡 Sắp đến hạn (${remainingHours}h)`;
    } else {
      label = `🟢 Đúng hạn (còn ${remainingHours}h)`;
    }

    return {
      dueAt,
      status,
      remainingHours,
      label,
      isOverdue,
    };
  }

  /**
   * Validate state transition according to Finite State Machine
   */
  validateTransition(fromStatus: TicketStatus, toStatus: TicketStatus): boolean {
    const allowed = VALID_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  /**
   * 1. Create Ticket
   */
  async createTicket(params: {
    title: string;
    content: string;
    category: any;
    priority?: TicketPriority;
    apartmentId: string;
    residentId: string;
    images?: string[];
    creatorUserId: string;
  }) {
    const priority = params.priority || TicketPriority.MEDIUM;
    const slaHours = SLA_HOURS_BY_PRIORITY[priority] || 48;
    const now = new Date();
    const slaDueAt = new Date(now.getTime() + slaHours * 3600 * 1000);
    const code = `FB-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.feedback.create({
        data: {
          code,
          title: params.title,
          content: params.content,
          category: params.category,
          priority,
          apartmentId: params.apartmentId,
          residentId: params.residentId,
          images: params.images || [],
          status: TicketStatus.NEW,
          slaDueAt,
        },
        include: {
          apartment: { select: { code: true } },
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          feedbackId: ticket.id,
          fromStatus: null,
          toStatus: TicketStatus.NEW,
          changedById: params.creatorUserId,
          note: 'Cư dân khởi tạo phiếu báo hỏng sự cố',
        },
      });

      return ticket;
    });

    // Trigger Notification to Manager
    await ticketNotificationService.notifyTicketCreated({
      ticketId: result.id,
      ticketCode: result.code,
      title: result.title,
      apartmentCode: result.apartment?.code || '',
      senderId: params.creatorUserId,
    });

    return result;
  }

  /**
   * 2. Assign Ticket (NEW -> ASSIGNED)
   */
  async assignTicket(params: {
    ticketId: string;
    staffId: string;
    internalNote?: string;
    changedBy: { id: string; role: string; fullName?: string };
  }) {
    if (params.changedBy.role === Role.RESIDENT) {
      throw new Error('Chỉ Ban quản trị hoặc Quản lý mới có quyền phân công nhân sự');
    }

    const ticket = await prisma.feedback.findUnique({
      where: { id: params.ticketId },
      include: { apartment: { select: { code: true } } },
    });
    if (!ticket) throw new Error('Không tìm thấy sự cố');

    if (!this.validateTransition(ticket.status, TicketStatus.ASSIGNED)) {
      throw new Error(`Không thể chuyển trạng thái từ ${ticket.status} sang ASSIGNED`);
    }

    const staff = await prisma.user.findUnique({
      where: { id: params.staffId },
      select: { fullName: true, role: true },
    });
    if (!staff) throw new Error('Không tìm thấy nhân sự phân công');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.feedback.update({
        where: { id: params.ticketId },
        data: {
          status: TicketStatus.ASSIGNED,
          assignedStaffId: params.staffId,
          ...(params.internalNote && { internalNote: params.internalNote }),
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          feedbackId: params.ticketId,
          fromStatus: ticket.status,
          toStatus: TicketStatus.ASSIGNED,
          changedById: params.changedBy.id,
          note: `Đã phân công cho kỹ thuật viên ${staff.fullName || ''}${
            params.internalNote ? ` (Ghi chú: ${params.internalNote})` : ''
          }`,
        },
      });

      return res;
    });

    await ticketNotificationService.notifyTicketAssigned({
      ticketId: ticket.id,
      ticketCode: ticket.code,
      title: ticket.title,
      apartmentCode: ticket.apartment?.code || '',
      staffId: params.staffId,
      senderId: params.changedBy.id,
    });

    return updated;
  }

  /**
   * 3. Change Priority (Re-calculates SLA)
   */
  async changePriority(params: {
    ticketId: string;
    priority: TicketPriority;
    changedBy: { id: string; role: string };
  }) {
    if (params.changedBy.role === Role.RESIDENT) {
      throw new Error('Cư dân không có quyền thay đổi mức độ ưu tiên');
    }

    const ticket = await prisma.feedback.findUnique({ where: { id: params.ticketId } });
    if (!ticket) throw new Error('Không tìm thấy sự cố');

    const hours = SLA_HOURS_BY_PRIORITY[params.priority] || 48;
    const newSlaDueAt = new Date(new Date(ticket.createdAt).getTime() + hours * 3600 * 1000);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.feedback.update({
        where: { id: params.ticketId },
        data: {
          priority: params.priority,
          slaDueAt: newSlaDueAt,
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          feedbackId: params.ticketId,
          fromStatus: ticket.status,
          toStatus: ticket.status,
          changedById: params.changedBy.id,
          note: `Thay đổi mức độ ưu tiên từ ${ticket.priority} sang ${params.priority} (Hạn SLA mới: ${hours}h)`,
        },
      });

      return updated;
    });
  }

  /**
   * 4. Change Category
   */
  async changeCategory(params: {
    ticketId: string;
    category: any;
    changedBy: { id: string; role: string };
  }) {
    if (params.changedBy.role === Role.RESIDENT) {
      throw new Error('Cư dân không có quyền thay đổi danh mục kỹ thuật');
    }

    const ticket = await prisma.feedback.findUnique({ where: { id: params.ticketId } });
    if (!ticket) throw new Error('Không tìm thấy sự cố');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.feedback.update({
        where: { id: params.ticketId },
        data: { category: params.category },
      });

      await tx.ticketStatusHistory.create({
        data: {
          feedbackId: params.ticketId,
          fromStatus: ticket.status,
          toStatus: ticket.status,
          changedById: params.changedBy.id,
          note: `Điều chỉnh phân loại danh mục: ${params.category}`,
        },
      });

      return updated;
    });
  }

  /**
   * 5. Start Processing (ASSIGNED -> PROCESSING)
   */
  async startProcessing(params: {
    ticketId: string;
    note?: string;
    changedBy: { id: string; role: string };
  }) {
    const ticket = await prisma.feedback.findUnique({ where: { id: params.ticketId } });
    if (!ticket) throw new Error('Không tìm thấy sự cố');

    // Role check: Only assigned staff or Manager/Admin
    if (
      params.changedBy.role === Role.RESIDENT ||
      (params.changedBy.role !== Role.ADMIN &&
        params.changedBy.role !== Role.MANAGER &&
        ticket.assignedStaffId !== params.changedBy.id)
    ) {
      throw new Error('Chỉ nhân sự được phân công hoặc Quản lý mới có quyền bắt đầu xử lý');
    }

    if (!this.validateTransition(ticket.status, TicketStatus.PROCESSING)) {
      throw new Error(`Không thể chuyển trạng thái từ ${ticket.status} sang PROCESSING`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.feedback.update({
        where: { id: params.ticketId },
        data: { status: TicketStatus.PROCESSING },
      });

      await tx.ticketStatusHistory.create({
        data: {
          feedbackId: params.ticketId,
          fromStatus: ticket.status,
          toStatus: TicketStatus.PROCESSING,
          changedById: params.changedBy.id,
          note: params.note || 'Kỹ thuật viên đã tiếp nhận và bắt đầu sửa chữa tại hiện trường',
        },
      });

      return updated;
    });
  }

  /**
   * 6. Resolve Ticket (PROCESSING -> RESOLVED)
   */
  async resolveTicket(params: {
    ticketId: string;
    resolutionNote: string;
    changedBy: { id: string; role: string };
  }) {
    if (!params.resolutionNote || params.resolutionNote.trim().length < 5) {
      throw new Error('Vui lòng cung cấp mô tả chi tiết phương án đã xử lý (tối thiểu 5 ký tự)');
    }

    const ticket = await prisma.feedback.findUnique({
      where: { id: params.ticketId },
      include: { apartment: { select: { id: true, code: true } } },
    });
    if (!ticket) throw new Error('Không tìm thấy sự cố');

    if (!this.validateTransition(ticket.status, TicketStatus.RESOLVED)) {
      throw new Error(`Không thể chuyển trạng thái từ ${ticket.status} sang RESOLVED`);
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.feedback.update({
        where: { id: params.ticketId },
        data: {
          status: TicketStatus.RESOLVED,
          responseContent: params.resolutionNote,
          resolvedAt: now,
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          feedbackId: params.ticketId,
          fromStatus: ticket.status,
          toStatus: TicketStatus.RESOLVED,
          changedById: params.changedBy.id,
          note: `Đã xử lý hoàn tất. Nội dung: ${params.resolutionNote}`,
        },
      });

      return res;
    });

    await ticketNotificationService.notifyTicketResolved({
      ticketId: ticket.id,
      ticketCode: ticket.code,
      title: ticket.title,
      apartmentId: ticket.apartmentId,
      senderId: params.changedBy.id,
    });

    return updated;
  }

  /**
   * 7. Reject Ticket (NEW -> REJECTED, must have reason)
   */
  async rejectTicket(params: {
    ticketId: string;
    reason: string;
    changedBy: { id: string; role: string };
  }) {
    if (params.changedBy.role === Role.RESIDENT) {
      throw new Error('Chỉ Ban Quản Trị hoặc Quản lý mới có quyền từ chối yêu cầu');
    }

    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('Vui lòng nhập lý do từ chối cụ thể (tối thiểu 5 ký tự)');
    }

    const ticket = await prisma.feedback.findUnique({
      where: { id: params.ticketId },
      include: { apartment: { select: { id: true, code: true } } },
    });
    if (!ticket) throw new Error('Không tìm thấy sự cố');

    if (!this.validateTransition(ticket.status, TicketStatus.REJECTED)) {
      throw new Error(`Không thể từ chối ticket đang ở trạng thái ${ticket.status}`);
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.feedback.update({
        where: { id: params.ticketId },
        data: {
          status: TicketStatus.REJECTED,
          rejectReason: params.reason,
          rejectedAt: now,
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          feedbackId: params.ticketId,
          fromStatus: ticket.status,
          toStatus: TicketStatus.REJECTED,
          changedById: params.changedBy.id,
          note: `Từ chối tiếp nhận. Lý do: ${params.reason}`,
        },
      });

      return res;
    });

    await ticketNotificationService.notifyTicketRejected({
      ticketId: ticket.id,
      ticketCode: ticket.code,
      title: ticket.title,
      apartmentId: ticket.apartmentId,
      reason: params.reason,
      senderId: params.changedBy.id,
    });

    return updated;
  }

  /**
   * 8. Close Ticket (RESOLVED -> CLOSED)
   */
  async closeTicket(params: {
    ticketId: string;
    note?: string;
    changedBy: { id: string; role: string };
  }) {
    const ticket = await prisma.feedback.findUnique({ where: { id: params.ticketId } });
    if (!ticket) throw new Error('Không tìm thấy sự cố');

    if (!this.validateTransition(ticket.status, TicketStatus.CLOSED)) {
      throw new Error(`Không thể đóng ticket đang ở trạng thái ${ticket.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const res = await tx.feedback.update({
        where: { id: params.ticketId },
        data: {
          status: TicketStatus.CLOSED,
          closedAt: new Date(),
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          feedbackId: params.ticketId,
          fromStatus: ticket.status,
          toStatus: TicketStatus.CLOSED,
          changedById: params.changedBy.id,
          note: params.note || 'Đã nghiệm thu và chính thức đóng ticket',
        },
      });

      return res;
    });
  }

  /**
   * 9. Rate Ticket (and optionally close)
   */
  async rateTicket(params: {
    ticketId: string;
    rating: number;
    comment?: string;
    residentUserId: string;
  }) {
    if (params.rating < 1 || params.rating > 5) {
      throw new Error('Số sao đánh giá phải từ 1 đến 5');
    }

    const ticket = await prisma.feedback.findUnique({
      where: { id: params.ticketId },
      include: {
        resident: true,
        apartment: { select: { code: true } },
      },
    });
    if (!ticket) throw new Error('Không tìm thấy sự cố');

    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new Error('Chỉ có thể đánh giá phản ánh đã được xử lý hoàn tất');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.feedback.update({
        where: { id: params.ticketId },
        data: {
          rating: params.rating,
          ratingComment: params.comment || null,
          ...(ticket.status === TicketStatus.RESOLVED && {
            status: TicketStatus.CLOSED,
            closedAt: new Date(),
          }),
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          feedbackId: params.ticketId,
          fromStatus: ticket.status,
          toStatus: ticket.status === TicketStatus.RESOLVED ? TicketStatus.CLOSED : ticket.status,
          changedById: params.residentUserId,
          note: `Cư dân gửi đánh giá ${params.rating} sao${params.comment ? `: "${params.comment}"` : ''}`,
        },
      });

      return res;
    });

    await ticketNotificationService.notifyRatingSubmitted({
      ticketId: ticket.id,
      ticketCode: ticket.code,
      title: ticket.title,
      apartmentCode: ticket.apartment?.code || '',
      rating: params.rating,
      comment: params.comment,
      senderId: params.residentUserId,
    });

    return updated;
  }

  /**
   * 10. Add Comment (Internal note vs Public conversation)
   */
  async addComment(params: {
    ticketId: string;
    content: string;
    isInternal: boolean;
    author: { id: string; role: string; fullName?: string };
  }) {
    if (!params.content || params.content.trim().length === 0) {
      throw new Error('Nội dung bình luận không được để trống');
    }

    // Resident can NEVER post internal comments
    if (params.author.role === Role.RESIDENT && params.isInternal) {
      throw new Error('Cư dân chỉ có thể gửi tin nhắn công khai');
    }

    return prisma.ticketComment.create({
      data: {
        feedbackId: params.ticketId,
        authorId: params.author.id,
        content: params.content.trim(),
        isInternal: params.isInternal,
      },
      include: {
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
      },
    });
  }

  /**
   * 11. Get Ticket Detail with timeline, SLA and role-filtered privacy
   */
  async getTicketDetail(id: string, user: { id: string; role: string }) {
    const ticket = await prisma.feedback.findUnique({
      where: { id },
      include: {
        apartment: { select: { id: true, code: true, building: true, floor: true } },
        resident: { select: { id: true, fullName: true, phone: true, email: true, avatarUrl: true } },
        assignedStaff: { select: { id: true, fullName: true, phone: true, email: true, avatarUrl: true, role: true } },
        statusHistory: {
          orderBy: { changedAt: 'asc' },
          include: {
            changedBy: { select: { id: true, fullName: true, role: true } },
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!ticket) throw new Error('Không tìm thấy sự cố');

    // Calculate SLA
    const sla = this.calculateSla(
      ticket.createdAt,
      ticket.priority,
      ticket.slaDueAt,
      ticket.status,
      ticket.resolvedAt
    );

    // Filter out internal comments & internalNote if caller is RESIDENT
    const isResident = user.role === Role.RESIDENT;

    const visibleComments = isResident
      ? ticket.comments.filter((c) => !c.isInternal)
      : ticket.comments;

    const visibleInternalNote = isResident ? null : ticket.internalNote;

    return {
      ...ticket,
      internalNote: visibleInternalNote,
      comments: visibleComments,
      sla,
    };
  }
}

export const ticketWorkflowService = new TicketWorkflowService();
