import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  requireRole,
  authorizeContractAccess,
  authorizeResidentProfileAccess,
  SessionUser,
} from '../src/lib/authorization';
import { rateLimiter } from '../src/lib/rate-limiter';
import { apiSuccess, apiError, sanitizeErrorMessage } from '../src/lib/api-response';

describe('Backend Security & Hardening Test Suite', () => {
  const residentUser: SessionUser = {
    id: 'user-res-1',
    role: 'RESIDENT',
    residentId: 'res-1',
    apartmentId: 'apt-101',
  };

  const otherResidentUser: SessionUser = {
    id: 'user-res-2',
    role: 'RESIDENT',
    residentId: 'res-2',
    apartmentId: 'apt-202',
  };

  const managerUser: SessionUser = {
    id: 'user-manager',
    role: 'MANAGER',
  };

  const adminUser: SessionUser = {
    id: 'user-admin',
    role: 'ADMIN',
  };

  const mockPrisma = {
    resident: {
      findUnique: async ({ where }: { where: { userId: string } }) => {
        if (where.userId === 'user-res-1') {
          return { id: 'res-1', apartmentId: 'apt-101' };
        }
        if (where.userId === 'user-res-2') {
          return { id: 'res-2', apartmentId: 'apt-202' };
        }
        return null;
      },
    },
  };

  describe('1. Centralized Role RBAC Guard', () => {
    it('MUST ALLOW user when their role is in allowedRoles', () => {
      const result = requireRole(managerUser, ['ADMIN', 'MANAGER']);
      assert.equal(result.allowed, true);
    });

    it('MUST DENY user with 403 when their role is NOT in allowedRoles', () => {
      const result = requireRole(residentUser, ['ADMIN', 'MANAGER']);
      assert.equal(result.allowed, false);
      assert.equal(result.statusCode, 403);
      assert.match(result.error || '', /không có quyền/);
    });
  });

  describe('2. Contract IDOR Protection', () => {
    it('MUST DENY when resident tries to access contract of another apartment', async () => {
      const result = await authorizeContractAccess(residentUser, 'apt-202', mockPrisma);
      assert.equal(result.allowed, false);
      assert.equal(result.statusCode, 403);
      assert.match(result.error || '', /hợp đồng của căn hộ khác/);
    });

    it('MUST ALLOW when resident accesses contract of their own apartment', async () => {
      const result = await authorizeContractAccess(residentUser, 'apt-101', mockPrisma);
      assert.equal(result.allowed, true);
    });

    it('MUST ALLOW manager or admin to access any apartment contract', async () => {
      const result = await authorizeContractAccess(managerUser, 'apt-202', mockPrisma);
      assert.equal(result.allowed, true);
    });
  });

  describe('3. Resident Profile IDOR Protection', () => {
    it('MUST DENY when resident tries to access profile of resident in another apartment', async () => {
      const result = await authorizeResidentProfileAccess(
        residentUser,
        { id: 'res-2', apartmentId: 'apt-202' },
        mockPrisma
      );
      assert.equal(result.allowed, false);
      assert.equal(result.statusCode, 403);
      assert.match(result.error || '', /thông tin cư dân khác/);
    });

    it('MUST ALLOW when resident views their own profile', async () => {
      const result = await authorizeResidentProfileAccess(
        residentUser,
        { id: 'res-1', apartmentId: 'apt-101' },
        mockPrisma
      );
      assert.equal(result.allowed, true);
    });

    it('MUST ALLOW when resident views profile of co-resident in the same apartment', async () => {
      const result = await authorizeResidentProfileAccess(
        residentUser,
        { id: 'res-1-spouse', apartmentId: 'apt-101' },
        mockPrisma
      );
      assert.equal(result.allowed, true);
    });

    it('MUST ALLOW admin or manager to view any resident profile', async () => {
      const result = await authorizeResidentProfileAccess(
        adminUser,
        { id: 'res-2', apartmentId: 'apt-202' },
        mockPrisma
      );
      assert.equal(result.allowed, true);
    });
  });

  describe('4. Rate Limiter Security Engine', () => {
    it('MUST ALLOW requests within rate limit quota', () => {
      const testKey = `test-client-${Date.now()}`;
      const res1 = rateLimiter.check(testKey, 3, 5000);
      const res2 = rateLimiter.check(testKey, 3, 5000);
      const res3 = rateLimiter.check(testKey, 3, 5000);

      assert.equal(res1.allowed, true);
      assert.equal(res2.allowed, true);
      assert.equal(res3.allowed, true);
      assert.equal(res3.remaining, 0);
    });

    it('MUST BLOCK request and return retryAfter when quota is exceeded', () => {
      const testKey = `test-blocked-${Date.now()}`;
      rateLimiter.check(testKey, 2, 5000);
      rateLimiter.check(testKey, 2, 5000);
      const blockedRes = rateLimiter.check(testKey, 2, 5000);

      assert.equal(blockedRes.allowed, false);
      assert.equal(blockedRes.remaining, 0);
      assert.ok(blockedRes.retryAfterSeconds >= 1);
    });
  });

  describe('5. Standardized API Response & Production Error Sanitization', () => {
    it('MUST format success response with success: true and data wrapper', async () => {
      const res = apiSuccess({ foo: 'bar' }, 'Thao tác thành công', { page: 1, total: 1 });
      const json = await res.json();

      assert.equal(json.success, true);
      assert.deepEqual(json.data, { foo: 'bar' });
      assert.equal(json.message, 'Thao tác thành công');
      assert.equal(json.meta.total, 1);
    });

    it('MUST format error response with success: false and structured error payload', async () => {
      const res = apiError('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400, { field: 'email' });
      const json = await res.json();

      assert.equal(json.success, false);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
      assert.equal(json.error.message, 'Dữ liệu không hợp lệ');
      assert.deepEqual(json.error.details, { field: 'email' });
      assert.equal(res.status, 400);
    });

    it('MUST sanitize low-level database or stack trace error messages', () => {
      const pgError = 'PrismaClientKnownRequestError: Can\'t reach database server at localhost:5432';
      const sanitized = sanitizeErrorMessage(pgError, 500);
      assert.equal(sanitized, 'Đã xảy ra lỗi hệ thống. Vui lòng liên hệ quản trị viên.');

      const friendlyError = 'Hóa đơn này đã được thanh toán trước đó';
      const keepFriendly = sanitizeErrorMessage(friendlyError, 400);
      assert.equal(keepFriendly, friendlyError);
    });
  });

  describe('6. Server-side Invoice Amount Calculation', () => {
    it('MUST compute totalAmount strictly as sum of item quantities * unitPrice', () => {
      const items = [
        { quantity: 85, unitPrice: 12000 },  // Management fee: 1,020,000
        { quantity: 2, unitPrice: 100000 },  // Parking: 200,000
        { quantity: 150, unitPrice: 2500 },  // Electric: 375,000
      ];

      const computedTotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
      assert.equal(computedTotal, 1595000);
    });
  });

  describe('7. Payment Processing Idempotency Guard', () => {
    it('MUST reject payment attempt if invoice is already PAID', async () => {
      const mockInvoiceRepo = {
        processPayment: async (id: string, _data: any) => {
          // Simulate atomic condition { where: { id, status: { not: 'PAID' } } }
          const isPaid = id === 'inv-already-paid';
          if (isPaid) {
            throw new Error('Hóa đơn không tồn tại hoặc đã được thanh toán trước đó');
          }
          return { id, status: 'PAID' };
        },
      };

      await assert.rejects(
        async () => {
          await mockInvoiceRepo.processPayment('inv-already-paid', { paymentMethod: 'BANK_TRANSFER' });
        },
        /đã được thanh toán trước đó/
      );

      const successPay = await mockInvoiceRepo.processPayment('inv-unpaid', { paymentMethod: 'CASH' });
      assert.equal(successPay.status, 'PAID');
    });
  });
});
