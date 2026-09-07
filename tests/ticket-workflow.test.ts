import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ticketWorkflowService,
  VALID_TRANSITIONS,
  SLA_HOURS_BY_PRIORITY,
} from '../src/modules/feedback/ticket-workflow.service';
import { TicketPriority, TicketStatus, Role } from '@prisma/client';

describe('Maintenance Ticket Workflow & State Machine Tests', () => {
  describe('1. Finite State Machine (FSM) Transitions', () => {
    it('MUST ALLOW valid transitions in workflow progression', () => {
      // NEW -> ASSIGNED
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.NEW, TicketStatus.ASSIGNED), true);
      // NEW -> REJECTED
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.NEW, TicketStatus.REJECTED), true);
      // ASSIGNED -> PROCESSING
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.ASSIGNED, TicketStatus.PROCESSING), true);
      // PROCESSING -> RESOLVED
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.PROCESSING, TicketStatus.RESOLVED), true);
      // RESOLVED -> CLOSED
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.RESOLVED, TicketStatus.CLOSED), true);
    });

    it('MUST REJECT invalid / jumping transitions', () => {
      // Cannot jump from NEW to RESOLVED
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.NEW, TicketStatus.RESOLVED), false);
      // Cannot jump from NEW to CLOSED
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.NEW, TicketStatus.CLOSED), false);
      // Cannot jump from ASSIGNED to RESOLVED without PROCESSING
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.ASSIGNED, TicketStatus.RESOLVED), false);
      // Cannot jump from PROCESSING to CLOSED without RESOLVED
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.PROCESSING, TicketStatus.CLOSED), false);
      // Cannot transition out of CLOSED
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.CLOSED, TicketStatus.NEW), false);
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.CLOSED, TicketStatus.PROCESSING), false);
      // Cannot transition out of REJECTED
      assert.equal(ticketWorkflowService.validateTransition(TicketStatus.REJECTED, TicketStatus.PROCESSING), false);
    });
  });

  describe('2. SLA Calculation Logic', () => {
    it('MUST accurately map SLA hours by priority', () => {
      assert.equal(SLA_HOURS_BY_PRIORITY[TicketPriority.LOW], 72);
      assert.equal(SLA_HOURS_BY_PRIORITY[TicketPriority.MEDIUM], 48);
      assert.equal(SLA_HOURS_BY_PRIORITY[TicketPriority.HIGH], 24);
      assert.equal(SLA_HOURS_BY_PRIORITY[TicketPriority.URGENT], 4);
      assert.equal(SLA_HOURS_BY_PRIORITY[TicketPriority.CRITICAL], 4);
    });

    it('MUST calculate ON_TRACK status when generous time remains', () => {
      const now = new Date();
      const createdAt = now;
      const futureDueAt = new Date(now.getTime() + 40 * 3600 * 1000); // 40h remaining on 48h SLA

      const sla = ticketWorkflowService.calculateSla(
        createdAt,
        TicketPriority.MEDIUM,
        futureDueAt,
        TicketStatus.PROCESSING
      );

      assert.equal(sla.status, 'ON_TRACK');
      assert.equal(sla.isOverdue, false);
      assert.ok(sla.remainingHours > 35);
    });

    it('MUST calculate APPROACHING status when time is under 4h', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 46 * 3600 * 1000); // 46 hours ago
      const approachingDueAt = new Date(now.getTime() + 2 * 3600 * 1000); // 2 hours remaining

      const sla = ticketWorkflowService.calculateSla(
        createdAt,
        TicketPriority.MEDIUM,
        approachingDueAt,
        TicketStatus.PROCESSING
      );

      assert.equal(sla.status, 'APPROACHING');
      assert.equal(sla.isOverdue, false);
    });

    it('MUST calculate OVERDUE status when past due date', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 50 * 3600 * 1000);
      const pastDueAt = new Date(now.getTime() - 2 * 3600 * 1000); // Passed 2 hours ago

      const sla = ticketWorkflowService.calculateSla(
        createdAt,
        TicketPriority.MEDIUM,
        pastDueAt,
        TicketStatus.PROCESSING
      );

      assert.equal(sla.status, 'OVERDUE');
      assert.equal(sla.isOverdue, true);
    });
  });

  describe('3. Role Authorization & Business Rules Validation', () => {
    it('MUST DENY when resident tries to assign ticket', async () => {
      await assert.rejects(
        async () => {
          await ticketWorkflowService.assignTicket({
            ticketId: 'test-ticket-id',
            staffId: 'staff-id',
            changedBy: { id: 'user-resident', role: Role.RESIDENT },
          });
        },
        /Chỉ Ban quản trị hoặc Quản lý mới có quyền phân công nhân sự/
      );
    });

    it('MUST DENY when resident tries to reject ticket', async () => {
      await assert.rejects(
        async () => {
          await ticketWorkflowService.rejectTicket({
            ticketId: 'test-ticket-id',
            reason: 'Test reason',
            changedBy: { id: 'user-resident', role: Role.RESIDENT },
          });
        },
        /Chỉ Ban Quản Trị hoặc Quản lý mới có quyền từ chối yêu cầu/
      );
    });

    it('MUST REJECT when reject reason is missing or under 5 characters', async () => {
      await assert.rejects(
        async () => {
          await ticketWorkflowService.rejectTicket({
            ticketId: 'test-ticket-id',
            reason: 'abc', // < 5 chars
            changedBy: { id: 'user-manager', role: Role.MANAGER },
          });
        },
        /Vui lòng nhập lý do từ chối cụ thể/
      );
    });

    it('MUST REJECT when resolution note is missing or under 5 characters', async () => {
      await assert.rejects(
        async () => {
          await ticketWorkflowService.resolveTicket({
            ticketId: 'test-ticket-id',
            resolutionNote: 'done', // < 5 chars
            changedBy: { id: 'user-manager', role: Role.MANAGER },
          });
        },
        /Vui lòng cung cấp mô tả chi tiết phương án đã xử lý/
      );
    });

    it('MUST DENY when resident tries to post internal note', async () => {
      await assert.rejects(
        async () => {
          await ticketWorkflowService.addComment({
            ticketId: 'test-ticket-id',
            content: 'Secret comment',
            isInternal: true,
            author: { id: 'user-resident', role: Role.RESIDENT },
          });
        },
        /Cư dân chỉ có thể gửi tin nhắn công khai/
      );
    });

    it('MUST DENY when resident tries to change priority', async () => {
      await assert.rejects(
        async () => {
          await ticketWorkflowService.changePriority({
            ticketId: 'test-ticket-id',
            priority: TicketPriority.URGENT,
            changedBy: { id: 'user-resident', role: Role.RESIDENT },
          });
        },
        /Cư dân không có quyền thay đổi mức độ ưu tiên/
      );
    });
  });
});
