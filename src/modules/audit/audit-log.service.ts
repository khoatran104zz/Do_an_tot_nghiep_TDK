import { prisma } from '@/lib/prisma';

export interface RecordAuditParams {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string; // e.g. 'GENERATE_INVOICES', 'PROCESS_PAYMENT', 'DELETE_RESIDENT', 'UPDATE_RESIDENT', 'CHANGE_TICKET_STATUS'
  entity: string; // e.g. 'INVOICE', 'PAYMENT', 'RESIDENT', 'TICKET', 'CONTRACT', 'USER'
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
}

export class AuditLogService {
  /**
   * Asynchronously records security & business audit events
   */
  async record(params: RecordAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          actorEmail: params.actorEmail || null,
          actorRole: params.actorRole || null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId || null,
          metadata: params.metadata || undefined,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (error) {
      // Non-blocking: audit log failure should not crash main transaction unless critical
      console.error('[AuditLogService] Error recording audit log:', error);
      return null;
    }
  }

  /**
   * Query audit history
   */
  async queryLogs(filter: {
    entity?: string;
    entityId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const { entity, entityId, action, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const auditLogService = new AuditLogService();
