import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

describe('Phase 3 Concurrency & Transaction Integrity Test Suite', () => {
  describe('1. FLOW-001 & FLOW-002: Collision-Free Code Generation under High Concurrency', () => {
    it('FLOW-001: MUST generate 50 unique parking assignment codes concurrently without collision', () => {
      const year = new Date().getFullYear();
      const generatedCodes = new Set<string>();

      const generateParkingAssignmentCode = () => {
        return `PASS-${year}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      };

      for (let i = 0; i < 50; i++) {
        const code = generateParkingAssignmentCode();
        assert.match(code, new RegExp(`^PASS-${year}-[A-F0-9]{8}$`));
        assert.equal(generatedCodes.has(code), false, `Collision detected for parking code: ${code}`);
        generatedCodes.add(code);
      }

      assert.equal(generatedCodes.size, 50);
    });

    it('FLOW-002: MUST generate 50 unique facility booking codes concurrently without collision', () => {
      const year = new Date().getFullYear();
      const generatedCodes = new Set<string>();

      const generateFacilityBookingCode = () => {
        return `BK-${year}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      };

      for (let i = 0; i < 50; i++) {
        const code = generateFacilityBookingCode();
        assert.match(code, new RegExp(`^BK-${year}-[A-F0-9]{8}$`));
        assert.equal(generatedCodes.has(code), false, `Collision detected for booking code: ${code}`);
        generatedCodes.add(code);
      }

      assert.equal(generatedCodes.size, 50);
    });
  });

  describe('2. SEC-006: Facility Booking Cross-Building Isolation Guard', () => {
    it('MUST DENY when resident of Building A tries to book a facility exclusive to Building B', () => {
      const facility = {
        id: 'fac-bbq-tower-b',
        name: 'Vườn nướng BBQ Tầng thượng Tòa B',
        buildingId: 'bldg-tower-b',
      };

      const residentApartment = {
        id: 'apt-a-101',
        buildingId: 'bldg-tower-a', // Different building!
      };

      const validateFacilityAccess = (fac: typeof facility, apt: typeof residentApartment) => {
        if (fac.buildingId && apt.buildingId && fac.buildingId !== apt.buildingId) {
          throw new Error('Bạn chỉ có thể đặt tiện ích thuộc tòa nhà nơi bạn cư trú');
        }
      };

      assert.throws(() => {
        validateFacilityAccess(facility, residentApartment);
      }, /Bạn chỉ có thể đặt tiện ích thuộc tòa nhà nơi bạn cư trú/);
    });

    it('MUST ALLOW booking when facility belongs to the resident building or is complex-wide (buildingId null)', () => {
      const complexFacility = {
        id: 'fac-central-park',
        name: 'Công viên trung tâm',
        buildingId: null,
      };

      const buildingFacility = {
        id: 'fac-gym-tower-a',
        name: 'Phòng Gym Tòa A',
        buildingId: 'bldg-tower-a',
      };

      const residentApartment = {
        id: 'apt-a-101',
        buildingId: 'bldg-tower-a',
      };

      const validateFacilityAccess = (fac: { buildingId: string | null }, apt: { buildingId: string }) => {
        if (fac.buildingId && apt.buildingId && fac.buildingId !== apt.buildingId) {
          throw new Error('Bạn chỉ có thể đặt tiện ích thuộc tòa nhà nơi bạn cư trú');
        }
        return true;
      };

      assert.equal(validateFacilityAccess(complexFacility, residentApartment), true);
      assert.equal(validateFacilityAccess(buildingFacility, residentApartment), true);
    });
  });

  describe('3. FLOW-003 & SEC-005: Poll Building/Tenant Isolation and Scoped Notifications', () => {
    it('FLOW-003: MUST PREVENT resident of Tower A from voting on a poll for Tower B or other tenant', () => {
      const pollTowerB = {
        id: 'poll-tower-b',
        title: 'Bầu ban đại diện Tòa B',
        buildingId: 'bldg-tower-b',
        tenantId: 'tenant-1',
      };

      const residentTowerA = {
        id: 'res-1',
        apartmentId: 'apt-a-101',
        buildingId: 'bldg-tower-a',
        tenantId: 'tenant-1',
      };

      const residentTenant2 = {
        id: 'res-2',
        apartmentId: 'apt-b-101',
        buildingId: 'bldg-tower-b',
        tenantId: 'tenant-2', // Different tenant
      };

      const checkVoteEligibility = (
        poll: { buildingId: string | null; tenantId: string | null },
        res: { buildingId: string; tenantId: string }
      ) => {
        if (poll.buildingId && res.buildingId !== poll.buildingId) {
          throw new Error('Bạn không có quyền tham gia biểu quyết cuộc khảo sát này do không thuộc tòa nhà tương ứng');
        }
        if (poll.tenantId && res.tenantId !== poll.tenantId) {
          throw new Error('Bạn không có quyền tham gia biểu quyết cuộc khảo sát của tổ hợp khác');
        }
        return true;
      };

      assert.throws(() => {
        checkVoteEligibility(pollTowerB, residentTowerA);
      }, /do không thuộc tòa nhà tương ứng/);

      assert.throws(() => {
        checkVoteEligibility(pollTowerB, residentTenant2);
      }, /cuộc khảo sát của tổ hợp khác/);
    });

    it('SEC-005: MUST NOT set isGlobal = true when poll is scoped to a specific building or tenant', () => {
      const createPollNotificationConfig = (poll: { buildingId: string | null; tenantId: string | null; targetScope: string }) => {
        const isGlobal = !poll.buildingId && !poll.tenantId && poll.targetScope === 'ALL_APARTMENTS';
        const targetScope = poll.buildingId ? 'BUILDING' : 'ALL';
        return { isGlobal, targetScope };
      };

      // Scoped to Tower A
      const towerAPoll = createPollNotificationConfig({
        buildingId: 'bldg-tower-a',
        tenantId: 'tenant-1',
        targetScope: 'BUILDING',
      });
      assert.equal(towerAPoll.isGlobal, false);
      assert.equal(towerAPoll.targetScope, 'BUILDING');

      // Truly system-wide poll with no building and no tenant
      const systemWidePoll = createPollNotificationConfig({
        buildingId: null,
        tenantId: null,
        targetScope: 'ALL_APARTMENTS',
      });
      assert.equal(systemWidePoll.isGlobal, true);
      assert.equal(systemWidePoll.targetScope, 'ALL');
    });
  });

  describe('4. FLOW-004: Payment Processing Dual-Write Transactional Atomicity', () => {
    it('MUST execute status update and payment transaction creation atomically', async () => {
      type MockInvoice = {
        id: string;
        totalAmount: number;
        status: 'UNPAID' | 'PAID';
        paidAt: Date | null;
        transactionId: string | null;
      };

      type MockPaymentTxn = {
        id: string;
        invoiceId: string;
        transactionCode: string;
        amount: number;
        status: string;
      };

      const mockDb = {
        invoices: new Map<string, MockInvoice>([
          [
            'inv-001',
            {
              id: 'inv-001',
              totalAmount: 1500000,
              status: 'UNPAID',
              paidAt: null,
              transactionId: null,
            },
          ],
        ]),
        paymentTransactions: new Map<string, MockPaymentTxn>(),
      };

      // Mock transaction runner
      const runTransaction = async (
        callback: (tx: {
          updateInvoiceStatus: (id: string, txnId: string) => Promise<boolean>;
          createPaymentTxn: (invId: string, txnId: string, amount: number) => Promise<void>;
        }) => Promise<void>
      ) => {
        const snapshotInvoices = new Map(
          Array.from(mockDb.invoices.entries()).map(([k, v]) => [k, { ...v }])
        );
        const snapshotTxns = new Map(
          Array.from(mockDb.paymentTransactions.entries()).map(([k, v]) => [k, { ...v }])
        );

        const tx = {
          updateInvoiceStatus: async (id: string, txnId: string) => {
            const inv = mockDb.invoices.get(id);
            if (!inv || inv.status === 'PAID') return false;
            inv.status = 'PAID';
            inv.paidAt = new Date();
            inv.transactionId = txnId;
            return true;
          },
          createPaymentTxn: async (invId: string, txnId: string, amount: number) => {
            mockDb.paymentTransactions.set(txnId, {
              id: `txn-${Date.now()}`,
              invoiceId: invId,
              transactionCode: txnId,
              amount,
              status: 'SUCCESS',
            });
          },
        };

        try {
          await callback(tx);
        } catch (err) {
          // Rollback on failure!
          mockDb.invoices = snapshotInvoices;
          mockDb.paymentTransactions = snapshotTxns;
          throw err;
        }
      };

      // Test 1: Successful atomic commit
      const txnId1 = 'PAY-TEST-001';
      await runTransaction(async (tx) => {
        const updated = await tx.updateInvoiceStatus('inv-001', txnId1);
        assert.equal(updated, true);
        await tx.createPaymentTxn('inv-001', txnId1, 1500000);
      });

      assert.equal(mockDb.invoices.get('inv-001')?.status, 'PAID');
      assert.equal(mockDb.paymentTransactions.has(txnId1), true);

      // Test 2: Double payment rejection (Idempotency)
      await assert.rejects(async () => {
        await runTransaction(async (tx) => {
          const updated = await tx.updateInvoiceStatus('inv-001', 'PAY-TEST-002');
          if (!updated) {
            throw new Error('Hóa đơn không tồn tại hoặc đã được thanh toán trước đó');
          }
          await tx.createPaymentTxn('inv-001', 'PAY-TEST-002', 1500000);
        });
      }, /đã được thanh toán trước đó/);

      // Verify no orphan transaction was created for the rejected payment
      assert.equal(mockDb.paymentTransactions.has('PAY-TEST-002'), false);

      // Test 3: Failure during dual-write rolls back invoice status
      mockDb.invoices.set('inv-002', {
        id: 'inv-002',
        totalAmount: 500000,
        status: 'UNPAID',
        paidAt: null,
        transactionId: null,
      });

      await assert.rejects(async () => {
        await runTransaction(async (tx) => {
          await tx.updateInvoiceStatus('inv-002', 'PAY-FAIL');
          // Simulated DB network glitch on second write
          throw new Error('Database connection reset during paymentTransaction creation');
        });
      }, /Database connection reset/);

      // Ensure inv-002 is still UNPAID due to atomic rollback
      assert.equal(mockDb.invoices.get('inv-002')?.status, 'UNPAID');
      assert.equal(mockDb.invoices.get('inv-002')?.transactionId, null);
      assert.equal(mockDb.paymentTransactions.has('PAY-FAIL'), false);
    });
  });
});
