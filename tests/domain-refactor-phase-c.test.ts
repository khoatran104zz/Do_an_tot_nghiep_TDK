import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { apartmentRepository } from '../src/modules/apartment/apartment.repository';
import { residentRepository } from '../src/modules/resident/resident.repository';
import { invoiceRepository } from '../src/modules/invoice/invoice.repository';

describe('Phase C — Domain Model Refactor Tests (Ownership, Residency, Payments)', () => {
  describe('1. Apartment Ownership Model & Verification', () => {
    it('MUST query apartment_ownerships table without error', async () => {
      const ownershipCount = await prisma.apartmentOwnership.count();
      assert.ok(typeof ownershipCount === 'number', 'apartmentOwnership count must be a number');
      assert.ok(ownershipCount > 0, 'Must have backfilled ownership records');
    });

    it('MUST only contain verified owners with valid ownerResident and isCurrent', async () => {
      const ownerships = await prisma.apartmentOwnership.findMany({
        include: {
          ownerResident: true,
        },
      });

      for (const own of ownerships) {
        assert.ok(own.ownerResident, 'Ownership must link to valid resident');
        assert.equal(own.isCurrent, true, 'Current ownership should be flagged true');
        assert.ok(own.ownershipPercentage > 0, 'Ownership percentage should be positive');
      }
    });

    it('MUST NOT create ownership record for tenants or family members', async () => {
      const nonOwners = await prisma.apartmentResident.findMany({
        where: {
          roleInHousehold: { not: 'HEAD_OF_HOUSEHOLD' },
        },
        include: {
          resident: {
            include: {
              ownedApartments: true,
            },
          },
        },
      });

      for (const item of nonOwners) {
        assert.equal(item.resident.ownedApartments.length, 0, `Resident ${item.resident.id} (${item.roleInHousehold}) must not have ownership records`);
      }
    });
  });

  describe('2. Apartment Resident & Occupancy Model', () => {
    it('MUST query apartment_residents table without error', async () => {
      const occupancyCount = await prisma.apartmentResident.count();
      assert.ok(typeof occupancyCount === 'number', 'apartmentResident count must be a number');
      assert.ok(occupancyCount > 0, 'Must have backfilled occupancy records');
    });

    it('MUST accurately reflect residing status and role in household', async () => {
      const occupancies = await prisma.apartmentResident.findMany({
        include: {
          resident: true,
          apartment: true,
        },
      });

      for (const occ of occupancies) {
        assert.ok(occ.apartmentId, 'Occupancy must have apartmentId');
        assert.ok(occ.residentId, 'Occupancy must have residentId');
        assert.ok(['HEAD_OF_HOUSEHOLD', 'FAMILY_MEMBER', 'TENANT', 'TEMPORARY'].includes(occ.roleInHousehold), 'Must have valid household role');
      }
    });
  });

  describe('3. Payment Transactions Model', () => {
    it('MUST query payment_transactions table without error', async () => {
      const txnCount = await prisma.paymentTransaction.count();
      assert.ok(typeof txnCount === 'number', 'paymentTransaction count must be a number');
      assert.ok(txnCount > 0, 'Must have backfilled payment transactions');
    });

    it('MUST link each payment transaction to a valid invoice with SUCCESS status', async () => {
      const txns = await prisma.paymentTransaction.findMany({
        include: {
          invoice: true,
        },
      });

      for (const txn of txns) {
        assert.ok(txn.invoice, 'Payment transaction must link to an existing invoice');
        assert.equal(txn.invoice.status, 'PAID', 'Linked invoice must be PAID');
        assert.equal(txn.status, 'SUCCESS', 'Backfilled transaction must be SUCCESS');
        assert.ok(txn.amount > 0, 'Transaction amount must be positive');
        assert.ok(txn.transactionCode.startsWith('TXN-'), 'Transaction code should have standard prefix');
      }
    });
  });

  describe('4. Dual-Read & Repository Verification', () => {
    it('apartmentRepository.findById MUST return separated owners and occupancies', async () => {
      const aptWithOwnership = await prisma.apartmentOwnership.findFirst();
      assert.ok(aptWithOwnership, 'Must have at least one apartment with ownership');

      const apt = await apartmentRepository.findById(aptWithOwnership.apartmentId);
      assert.ok(apt, 'Apartment must be found');
      assert.ok(Array.isArray(apt.owners), 'apt.owners must be an array');
      assert.ok(Array.isArray(apt.occupancies), 'apt.occupancies must be an array');
      assert.ok(apt.owner, 'apt.owner must be resolved');
      assert.equal(apt.owner.id, aptWithOwnership.ownerResidentId, 'Resolved owner must match verified ownership');
    });

    it('residentRepository.findById MUST include ownedApartments and occupancies', async () => {
      const aptWithOwnership = await prisma.apartmentOwnership.findFirst();
      assert.ok(aptWithOwnership);

      const resident = await residentRepository.findById(aptWithOwnership.ownerResidentId);
      assert.ok(resident, 'Resident must be found');
      assert.ok(Array.isArray((resident as any).ownedApartments), 'ownedApartments must be an array');
      assert.ok(Array.isArray((resident as any).occupancies), 'occupancies must be an array');
      assert.ok((resident as any).ownedApartments.length > 0, 'Owner must have at least one owned apartment');
    });

    it('invoiceRepository.findById MUST include payments list', async () => {
      const paidInvoice = await prisma.invoice.findFirst({
        where: { status: 'PAID' },
      });
      assert.ok(paidInvoice, 'Must have at least one paid invoice');

      const invoice = await invoiceRepository.findById(paidInvoice.id);
      assert.ok(invoice, 'Invoice must be found');
      assert.ok(Array.isArray((invoice as any).payments), 'payments must be an array');
      assert.ok((invoice as any).payments.length > 0, 'Paid invoice must have linked payment transactions');
    });
  });

  describe('5. Data Integrity & Schema Normalization', () => {
    it('MUST verify Resident and Apartment schema normalization', async () => {
      const apt = await prisma.apartment.findFirst();
      assert.ok(apt);
      assert.equal(typeof apt.code, 'string');
      assert.equal(typeof apt.building, 'string');

      const resident = await prisma.resident.findFirst();
      assert.ok(resident);
      assert.equal(typeof resident.fullName, 'string');
    });
  });
});
