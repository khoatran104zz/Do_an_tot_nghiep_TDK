import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeApartmentAccess,
  authorizeInvoiceAccess,
  authorizeFeedbackAccess,
  SessionUser,
} from '../src/lib/authorization';

describe('Resident Portal Authorization Security Tests', () => {
  // Mock DB where resident "user-101" owns apartment "apt-A1001" and residentId "res-101"
  const mockPrisma = {
    resident: {
      findUnique: async ({ where }: { where: { userId: string } }) => {
        if (where.userId === 'user-101') {
          return {
            id: 'res-101',
            userId: 'user-101',
            apartmentId: 'apt-A1001',
          };
        }
        return null;
      },
    },
  };

  const residentUser: SessionUser = {
    id: 'user-101',
    role: 'RESIDENT',
    residentId: 'res-101',
    apartmentId: 'apt-A1001',
  };

  const managerUser: SessionUser = {
    id: 'user-admin',
    role: 'ADMIN',
  };

  describe('1. Apartment Access Authorization', () => {
    it('MUST DENY when resident attempts to access another apartment (403 Forbidden)', async () => {
      const targetApartmentId = 'apt-B2002'; // Another apartment
      const result = await authorizeApartmentAccess(residentUser, targetApartmentId, mockPrisma);

      assert.equal(result.allowed, false, 'Resident must NOT be allowed to access another apartment');
      assert.equal(result.statusCode, 403, 'Must return 403 status code');
      assert.match(result.error || '', /Bạn không có quyền truy cập thông tin căn hộ khác/);
    });

    it('MUST ALLOW when resident accesses their own apartment', async () => {
      const targetApartmentId = 'apt-A1001'; // Own apartment
      const result = await authorizeApartmentAccess(residentUser, targetApartmentId, mockPrisma);

      assert.equal(result.allowed, true, 'Resident must be allowed to access their own apartment');
    });

    it('MUST ALLOW when ADMIN/MANAGER accesses any apartment', async () => {
      const result = await authorizeApartmentAccess(managerUser, 'apt-B2002', mockPrisma);
      assert.equal(result.allowed, true, 'Staff/Manager must have access');
    });
  });

  describe('2. Invoice Access Authorization', () => {
    it('MUST DENY when resident attempts to access invoice belonging to another apartment (403 Forbidden)', async () => {
      const foreignInvoiceApartmentId = 'apt-B2002';
      const result = await authorizeInvoiceAccess(residentUser, foreignInvoiceApartmentId, mockPrisma);

      assert.equal(result.allowed, false, 'Resident must NOT be allowed to view invoice of another apartment');
      assert.equal(result.statusCode, 403, 'Must return 403 status code');
      assert.match(result.error || '', /Bạn không có quyền truy cập hóa đơn của căn hộ khác/);
    });

    it('MUST ALLOW when resident accesses invoice of their own apartment', async () => {
      const ownInvoiceApartmentId = 'apt-A1001';
      const result = await authorizeInvoiceAccess(residentUser, ownInvoiceApartmentId, mockPrisma);

      assert.equal(result.allowed, true, 'Resident must be allowed to view their apartment invoices');
    });

    it('MUST ALLOW when ADMIN/MANAGER accesses any invoice', async () => {
      const result = await authorizeInvoiceAccess(managerUser, 'apt-B2002', mockPrisma);
      assert.equal(result.allowed, true, 'Staff/Manager must have invoice access');
    });
  });

  describe('3. Maintenance Ticket / Feedback Access Authorization', () => {
    it('MUST DENY when resident attempts to access maintenance ticket of another resident/apartment (403 Forbidden)', async () => {
      const foreignFeedback = {
        residentId: 'res-999',
        apartmentId: 'apt-B2002',
      };
      const result = await authorizeFeedbackAccess(residentUser, foreignFeedback, mockPrisma);

      assert.equal(result.allowed, false, 'Resident must NOT be allowed to view tickets of other residents');
      assert.equal(result.statusCode, 403, 'Must return 403 status code');
      assert.match(result.error || '', /Bạn không có quyền truy cập phản ánh sự cố của người khác/);
    });

    it('MUST ALLOW when resident accesses ticket created by themselves', async () => {
      const ownFeedback = {
        residentId: 'res-101',
        apartmentId: 'apt-A1001',
      };
      const result = await authorizeFeedbackAccess(residentUser, ownFeedback, mockPrisma);

      assert.equal(result.allowed, true, 'Resident must be allowed to view their own ticket');
    });

    it('MUST ALLOW when ticket is for the resident apartment even if filed by another co-resident', async () => {
      const coResidentFeedback = {
        residentId: 'res-family-member',
        apartmentId: 'apt-A1001',
      };
      const result = await authorizeFeedbackAccess(residentUser, coResidentFeedback, mockPrisma);

      assert.equal(result.allowed, true, 'Resident should be allowed to view tickets associated with their apartment');
    });

    it('MUST ALLOW when ADMIN/MANAGER accesses any ticket', async () => {
      const result = await authorizeFeedbackAccess(
        managerUser,
        { residentId: 'res-999', apartmentId: 'apt-B2002' },
        mockPrisma
      );
      assert.equal(result.allowed, true, 'Staff/Manager must have ticket access');
    });
  });
});
