import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAlertActionUrl } from '../src/modules/smart-operations/smart-alert.service';
import nextConfig from '../next.config';

describe('Phase 4 Frontend UX & Routing Test Suite', () => {
  describe('1. FE-001 & FE-003: Deprecated Routes Redirect Configuration in next.config.ts', () => {
    it('MUST have permanent redirects configured for all deprecated routes', async () => {
      assert.ok(typeof nextConfig.redirects === 'function', 'nextConfig must export a redirects function');
      const redirects = await nextConfig.redirects();

      const sourceToDest = new Map(redirects.map((r: any) => [r.source, r.destination]));

      // FE-001: /announcements -> /notifications
      assert.equal(sourceToDest.get('/announcements'), '/notifications');
      assert.equal(sourceToDest.get('/resident/announcements'), '/resident/notifications');

      // FE-003: /maintenance-schedule -> /maintenance-schedules
      assert.equal(sourceToDest.get('/maintenance-schedule'), '/maintenance-schedules');
    });
  });

  describe('2. FE-002: Smart Alert Fallback ActionUrl Resolution (No Dead 404 Links)', () => {
    it('MUST resolve invoice alerts to /invoices with search query when entityId is present', () => {
      const url = resolveAlertActionUrl('/smart-operations/alerts', 'INVOICE', 'INV-2026-001');
      assert.equal(url, '/invoices?search=INV-2026-001');
    });

    it('MUST resolve ticket/feedback alerts to /feedbacks', () => {
      const urlWithId = resolveAlertActionUrl(null, 'FEEDBACK', 'TICK-101');
      assert.equal(urlWithId, '/feedbacks?search=TICK-101');

      const urlWithoutId = resolveAlertActionUrl(null, 'TICKET', null);
      assert.equal(urlWithoutId, '/feedbacks');
    });

    it('MUST resolve contract alerts to /contracts', () => {
      const url = resolveAlertActionUrl(undefined, 'CONTRACT', 'CTR-999');
      assert.equal(url, '/contracts?search=CTR-999');
    });

    it('MUST resolve maintenance & asset alerts to /maintenance-schedules', () => {
      const urlMaint = resolveAlertActionUrl(null, 'MAINTENANCE', 'SCH-01');
      assert.equal(urlMaint, '/maintenance-schedules?search=SCH-01');

      const urlSchedule = resolveAlertActionUrl(null, 'MAINTENANCE_SCHEDULE', null);
      assert.equal(urlSchedule, '/maintenance-schedules');
    });

    it('MUST preserve valid custom URLs that are not the broken default', () => {
      const validCustom = resolveAlertActionUrl('/custom/special-view', 'INVOICE', '123');
      assert.equal(validCustom, '/custom/special-view');
    });

    it('MUST NEVER return /smart-operations/alerts for any entity or fallback', () => {
      const fallbackUrl = resolveAlertActionUrl('/smart-operations/alerts', 'UNKNOWN_ENTITY', null);
      assert.notEqual(fallbackUrl, '/smart-operations/alerts');
      assert.equal(fallbackUrl, '/dashboard');
    });
  });

  describe('3. FE-001 & FE-003: Sidebar Navigation Integrity across all Roles', () => {
    it('MUST NOT include /announcements in any role navigation', () => {
      // Mock navigation structures representing the updated Sidebar
      const platformAdminHrefs = [
        '/admin/tenants', '/dashboard', '/fees', '/reports', '/settings/access-control',
        '/apartments', '/residents', '/contracts', '/invoices', '/payments', '/settings'
      ];

      const tenantAdminHrefs = [
        '/dashboard', '/apartments', '/settings/access-control', '/staff',
        '/residents', '/contracts', '/invoices', '/payments', '/fees',
        '/feedbacks', '/maintenance-schedules', '/assets', '/facilities', '/parcels',
        '/parking', '/vehicles', '/parking-cards', '/parking-logs', '/visitors',
        '/notifications', '/polls', '/reports', '/settings'
      ];

      const managerHrefs = [
        '/dashboard', '/apartments', '/residents', '/contracts',
        '/invoices', '/payments', '/parking', '/vehicles', '/parking-cards', '/visitors',
        '/feedbacks', '/maintenance-schedules', '/assets', '/facilities', '/parcels',
        '/notifications', '/polls', '/staff', '/reports'
      ];

      const technicianHrefs = [
        '/dashboard', '/tasks', '/feedbacks', '/assets', '/maintenance-schedules', '/notifications'
      ];

      const residentHrefs = [
        '/home', '/resident/apartment', '/resident/family',
        '/resident/invoices', '/resident/parking', '/resident/vehicles', '/resident/feedback',
        '/resident/facilities', '/resident/visitors', '/resident/parcels',
        '/resident/notifications', '/resident/polls'
      ];

      const allHrefs = [
        ...platformAdminHrefs,
        ...tenantAdminHrefs,
        ...managerHrefs,
        ...technicianHrefs,
        ...residentHrefs,
      ];

      for (const href of allHrefs) {
        assert.equal(
          href.includes('/announcements'),
          false,
          `Deprecated route /announcements found in sidebar href: ${href}`
        );
        assert.notEqual(
          href,
          '/maintenance-schedule',
          `Non-canonical singular route /maintenance-schedule found in sidebar href: ${href}`
        );
      }
    });
  });
});
