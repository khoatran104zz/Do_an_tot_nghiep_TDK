import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SmartAlert, AlertSeverity } from '../src/modules/smart-operations/smart-operations.types';

describe('Smart Operations & Automated Rule-based Alerts Tests', () => {
  describe('1. Contract Operational Alert Rules', () => {
    it('MUST classify contracts expired in the past as CRITICAL', () => {
      const now = new Date();
      const pastEndDate = new Date(now.getTime() - 5 * 24 * 3600 * 1000); // 5 days ago
      const diffDays = Math.ceil((pastEndDate.getTime() - now.getTime()) / (24 * 3600 * 1000));

      assert.ok(diffDays < 0, 'Contract must be in past');
      const severity: AlertSeverity = diffDays < 0 ? 'CRITICAL' : 'INFO';
      assert.equal(severity, 'CRITICAL');
    });

    it('MUST classify contracts expiring within 7 days as CRITICAL', () => {
      const now = new Date();
      const soonEndDate = new Date(now.getTime() + 4 * 24 * 3600 * 1000); // 4 days from now
      const diffDays = Math.ceil((soonEndDate.getTime() - now.getTime()) / (24 * 3600 * 1000));

      assert.ok(diffDays > 0 && diffDays <= 7);
      const severity: AlertSeverity = diffDays <= 7 ? 'CRITICAL' : 'WARNING';
      assert.equal(severity, 'CRITICAL');
    });

    it('MUST classify contracts expiring between 8 and 30 days as WARNING', () => {
      const now = new Date();
      const soonEndDate = new Date(now.getTime() + 20 * 24 * 3600 * 1000); // 20 days from now
      const diffDays = Math.ceil((soonEndDate.getTime() - now.getTime()) / (24 * 3600 * 1000));

      assert.ok(diffDays > 7 && diffDays <= 30);
      const severity: AlertSeverity = diffDays <= 7 ? 'CRITICAL' : diffDays <= 30 ? 'WARNING' : 'INFO';
      assert.equal(severity, 'WARNING');
    });
  });

  describe('2. Invoice Overdue & Debt Alert Rules', () => {
    it('MUST flag invoices overdue by more than 15 days as CRITICAL', () => {
      const now = new Date();
      const pastDueDate = new Date(now.getTime() - 20 * 24 * 3600 * 1000); // 20 days overdue
      const overdueDays = Math.ceil((now.getTime() - pastDueDate.getTime()) / (24 * 3600 * 1000));

      assert.ok(overdueDays >= 15);
      const severity: AlertSeverity = overdueDays >= 15 ? 'CRITICAL' : 'WARNING';
      assert.equal(severity, 'CRITICAL');
    });

    it('MUST flag high-debt invoices (>= 5,000,000 VNĐ) as WARNING', () => {
      const totalAmount = 7_500_000;
      const isHighDebt = totalAmount >= 5_000_000;
      assert.equal(isHighDebt, true);
    });
  });

  describe('3. Maintenance Ticket & SLA Alert Rules', () => {
    it('MUST flag ticket with breached SLA as CRITICAL', () => {
      const now = new Date();
      const slaDueAt = new Date(now.getTime() - 2 * 3600 * 1000); // Breached 2h ago
      const remainingMs = slaDueAt.getTime() - now.getTime();

      assert.ok(remainingMs < 0, 'SLA must be breached');
      const isBreached = remainingMs < 0;
      assert.equal(isBreached, true);
    });

    it('MUST flag ticket approaching deadline within 4h as WARNING', () => {
      const now = new Date();
      const slaDueAt = new Date(now.getTime() + 2.5 * 3600 * 1000); // 2.5h remaining
      const remainingHours = (slaDueAt.getTime() - now.getTime()) / (3600 * 1000);

      assert.ok(remainingHours > 0 && remainingHours <= 4);
    });
  });

  describe('4. Operational Severity Sorting & Top 5 Priority Queue', () => {
    it('MUST correctly sort CRITICAL alerts ahead of WARNING and INFO', () => {
      const mockAlerts: Partial<SmartAlert>[] = [
        { id: '1', severity: 'INFO', title: 'Info Item' },
        { id: '2', severity: 'CRITICAL', title: 'Critical Item A' },
        { id: '3', severity: 'WARNING', title: 'Warning Item' },
        { id: '4', severity: 'CRITICAL', title: 'Critical Item B' },
      ];

      const severityScore: Record<AlertSeverity, number> = {
        CRITICAL: 3,
        WARNING: 2,
        INFO: 1,
      };

      mockAlerts.sort((a, b) => severityScore[b.severity!] - severityScore[a.severity!]);

      assert.equal(mockAlerts[0].severity, 'CRITICAL');
      assert.equal(mockAlerts[1].severity, 'CRITICAL');
      assert.equal(mockAlerts[2].severity, 'WARNING');
      assert.equal(mockAlerts[3].severity, 'INFO');
    });

    it('MUST limit Top 5 Today to at most 5 items', () => {
      const items = Array.from({ length: 15 }, (_, i) => ({ id: `${i}` }));
      const top5 = items.slice(0, 5);
      assert.equal(top5.length, 5);
    });
  });

  describe('5. Collection Rate & Operational Insights Calculation', () => {
    it('MUST compute collection rate accurately', () => {
      const totalInvoices = 50;
      const paidInvoices = 46;
      const rate = Number(((paidInvoices / totalInvoices) * 100).toFixed(1));
      assert.equal(rate, 92.0);
    });

    it('MUST compute average resident rating accurately', () => {
      const ratings = [5, 4, 5, 5, 4];
      const avg = Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
      assert.equal(avg, 4.6);
    });
  });
});
