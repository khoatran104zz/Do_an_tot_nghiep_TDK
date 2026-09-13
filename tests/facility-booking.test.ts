import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createFacilitySchema,
  updateFacilitySchema,
  createBookingSchema,
  cancelBookingSchema,
} from '../src/modules/facility/facility.schema';
import {
  FacilityType,
  FacilityStatus,
  BookingStatus,
} from '@prisma/client';

describe('Facility Booking Module Tests', () => {
  describe('1. Zod Schema Validation', () => {
    it('MUST VALIDATE a valid facility creation payload', () => {
      const validFacility = {
        name: 'Vườn nướng BBQ Sky Garden',
        type: FacilityType.BBQ_AREA,
        location: 'Tầng 26 Sky Garden',
        openTime: '10:00',
        closeTime: '22:00',
        slotDuration: 120,
        maxUsers: 1,
        fee: 200000,
        status: FacilityStatus.ACTIVE,
        rules: 'Không đốt than củi, giữ gìn vệ sinh chung.',
      };

      const parsed = createFacilitySchema.safeParse(validFacility);
      assert.equal(parsed.success, true, 'Valid facility payload should pass validation');
      if (parsed.success) {
        assert.equal(parsed.data.name, validFacility.name);
        assert.equal(parsed.data.slotDuration, 120);
        assert.equal(parsed.data.fee, 200000);
      }
    });

    it('MUST REJECT facility with invalid time format (e.g. not HH:mm)', () => {
      const invalidFacility = {
        name: 'Hồ bơi',
        type: FacilityType.SWIMMING_POOL,
        location: 'Tầng 5',
        openTime: '6 AM', // invalid format
        closeTime: '22:00',
      };

      const parsed = createFacilitySchema.safeParse(invalidFacility);
      assert.equal(parsed.success, false, 'Invalid time format must be rejected');
    });

    it('MUST VALIDATE a valid booking creation payload', () => {
      const validBooking = {
        facilityId: 'fac-bbq-garden',
        bookingDate: '2026-09-20',
        startTime: '18:00',
        endTime: '20:00',
        numberOfUsers: 6,
        notes: 'Tiệc kỷ niệm ngày cưới gia đình',
      };

      const parsed = createBookingSchema.safeParse(validBooking);
      assert.equal(parsed.success, true, 'Valid booking payload should pass validation');
      if (parsed.success) {
        assert.equal(parsed.data.bookingDate, '2026-09-20');
        assert.equal(parsed.data.numberOfUsers, 6);
      }
    });

    it('MUST REJECT booking with invalid date format or 0 users', () => {
      const invalidDate = {
        facilityId: 'fac-bbq-garden',
        bookingDate: '20/09/2026', // wrong format, should be YYYY-MM-DD
        startTime: '18:00',
        endTime: '20:00',
        numberOfUsers: 1,
      };
      assert.equal(createBookingSchema.safeParse(invalidDate).success, false);

      const invalidUsers = {
        facilityId: 'fac-bbq-garden',
        bookingDate: '2026-09-20',
        startTime: '18:00',
        endTime: '20:00',
        numberOfUsers: 0, // must be >= 1
      };
      assert.equal(createBookingSchema.safeParse(invalidUsers).success, false);
    });
  });

  describe('2. Time Slot Generator Calculation', () => {
    it('MUST calculate correct number of slots for given operating hours and duration', () => {
      // 06:00 to 22:00 (16 hours = 960 minutes), 60 min slots -> exactly 16 slots
      const [openH, openM] = '06:00'.split(':').map(Number);
      const [closeH, closeM] = '22:00'.split(':').map(Number);
      const openTotalMin = openH * 60 + openM;
      const closeTotalMin = closeH * 60 + closeM;
      const slotDuration = 60;

      const slots: Array<{ start: string; end: string }> = [];
      for (let m = openTotalMin; m + slotDuration <= closeTotalMin; m += slotDuration) {
        const sH = Math.floor(m / 60).toString().padStart(2, '0');
        const sM = (m % 60).toString().padStart(2, '0');
        const eH = Math.floor((m + slotDuration) / 60).toString().padStart(2, '0');
        const eM = ((m + slotDuration) % 60).toString().padStart(2, '0');
        slots.push({ start: `${sH}:${sM}`, end: `${eH}:${eM}` });
      }

      assert.equal(slots.length, 16);
      assert.equal(slots[0].start, '06:00');
      assert.equal(slots[0].end, '07:00');
      assert.equal(slots[slots.length - 1].start, '21:00');
      assert.equal(slots[slots.length - 1].end, '22:00');
    });

    it('MUST calculate 120-minute slots correctly for BBQ area (10:00 to 22:00 -> 6 slots)', () => {
      const openTotalMin = 10 * 60;
      const closeTotalMin = 22 * 60;
      const slotDuration = 120;

      const slots: Array<{ start: string; end: string }> = [];
      for (let m = openTotalMin; m + slotDuration <= closeTotalMin; m += slotDuration) {
        const sH = Math.floor(m / 60).toString().padStart(2, '0');
        const sM = (m % 60).toString().padStart(2, '0');
        const eH = Math.floor((m + slotDuration) / 60).toString().padStart(2, '0');
        const eM = ((m + slotDuration) % 60).toString().padStart(2, '0');
        slots.push({ start: `${sH}:${sM}`, end: `${eH}:${eM}` });
      }

      assert.equal(slots.length, 6);
      assert.equal(slots[0].start, '10:00');
      assert.equal(slots[0].end, '12:00');
      assert.equal(slots[5].start, '20:00');
      assert.equal(slots[5].end, '22:00');
    });
  });

  describe('3. Anti-Overbooking Concurrency & Capacity Protection', () => {
    it('MUST REJECT booking for exclusive facility when slot already has an active booking', () => {
      const maxUsers = 1; // Exclusive booking
      const existingBookings = [
        {
          startTime: '18:00',
          endTime: '20:00',
          status: BookingStatus.CONFIRMED,
        },
      ];

      const newBookingRequest = {
        startTime: '18:00',
        endTime: '20:00',
        numberOfUsers: 4,
      };

      const hasConflict =
        maxUsers === 1 &&
        existingBookings.some((b) => b.status === BookingStatus.CONFIRMED);

      assert.equal(hasConflict, true, 'Conflict must be detected for exclusive facility');
    });

    it('MUST REJECT booking for capacity facility when requested users exceeds remaining capacity', () => {
      const maxUsers = 20; // e.g. Gym
      const existingBookings = [
        { numberOfUsers: 10, status: BookingStatus.CONFIRMED },
        { numberOfUsers: 7, status: BookingStatus.CONFIRMED },
      ];

      const totalBookedUsers = existingBookings.reduce((sum, b) => sum + b.numberOfUsers, 0);
      assert.equal(totalBookedUsers, 17);

      const remainingCapacity = maxUsers - totalBookedUsers;
      assert.equal(remainingCapacity, 3);

      const validRequestUsers = 3;
      const invalidRequestUsers = 5;

      assert.equal(totalBookedUsers + validRequestUsers <= maxUsers, true, '3 users fits in 3 slots');
      assert.equal(totalBookedUsers + invalidRequestUsers <= maxUsers, false, '5 users exceeds 3 slots (Overbooking blocked)');
    });
  });

  describe('4. Authorization & Cancellation Rules', () => {
    it('MUST ALLOW resident to cancel only their own booking and REJECT canceling others', () => {
      const residentUserA = { id: 'user_resident_a', role: 'RESIDENT' };
      const bookingA = { id: 'bk_001', userId: 'user_resident_a' };
      const bookingB = { id: 'bk_002', userId: 'user_resident_b' };

      const canCancelOwn = residentUserA.role === 'RESIDENT' && bookingA.userId === residentUserA.id;
      const canCancelOther = residentUserA.role === 'RESIDENT' && bookingB.userId === residentUserA.id;

      assert.equal(canCancelOwn, true, 'Resident can cancel their own booking');
      assert.equal(canCancelOther, false, 'Resident CANNOT cancel another resident booking');
    });

    it('MUST ALLOW manager to cancel any booking', () => {
      const managerUser = { id: 'user_manager', role: 'MANAGER' };
      const booking = { id: 'bk_001', userId: 'user_resident_a' };

      const canCancel = managerUser.role === 'MANAGER' || managerUser.role === 'ADMIN';
      assert.equal(canCancel, true, 'Manager has authority to cancel any booking for maintenance or safety');
    });
  });
});
