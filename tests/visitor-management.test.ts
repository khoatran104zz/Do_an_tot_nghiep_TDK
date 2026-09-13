import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { visitorRepository } from '../src/modules/visitor/visitor.repository';
import { visitorService } from '../src/modules/visitor/visitor.service';
import { VisitorStatus, Role } from '@prisma/client';

test('Visitor Management & QR Check-in Module Test Suite', async (t) => {
  // Setup test context
  const testApartment = await prisma.apartment.findFirst({
    include: { residents: true },
  });
  assert.ok(testApartment, 'Should have at least one apartment');

  const securityUser = await prisma.user.findFirst({
    where: { role: Role.STAFF_SECURITY },
  });
  assert.ok(securityUser, 'Should have STAFF_SECURITY user');

  const residentUser = await prisma.user.findFirst({
    where: { role: Role.RESIDENT },
  });
  assert.ok(residentUser, 'Should have RESIDENT user');

  const adminUser = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });
  assert.ok(adminUser, 'Should have ADMIN user');

  let createdPassId: string = '';
  let createdPassCode: string = '';
  let createdQrCode: string = '';

  await t.test('1. Resident creates a visitor pass', async () => {
    const today = new Date().toISOString().split('T')[0];
    const pass = await visitorRepository.createPass(
      {
        visitorName: 'Trần Văn Khách Test',
        visitorPhone: '0988777666',
        visitDate: today,
        expectedTime: '19:00 - 22:00',
        licensePlate: '30K-123.45',
        note: 'Khách đến ăn tối tân gia',
      },
      residentUser.id,
      testApartment.id,
      testApartment.residents[0]?.id
    );

    assert.ok(pass.id, 'Pass should have an ID');
    assert.ok(pass.passCode.startsWith('VP-'), 'Pass code should start with VP-');
    assert.ok(pass.qrCode.length > 10, 'QR Code token should be generated');
    assert.strictEqual(pass.status, VisitorStatus.PENDING, 'Status should be PENDING');
    assert.strictEqual(pass.visitorName, 'Trần Văn Khách Test');

    createdPassId = pass.id;
    createdPassCode = pass.passCode;
    createdQrCode = pass.qrCode;
  });

  await t.test('2. Security scans and validates PENDING pass', async () => {
    // Test with passCode
    const scanByCode = await visitorRepository.scanAndValidate(createdPassCode);
    assert.strictEqual(scanByCode.isValid, true, 'Pass should be valid');
    assert.strictEqual(scanByCode.canCheckIn, true, 'Can check in should be true');
    assert.strictEqual(scanByCode.canCheckOut, false, 'Can check out should be false');
    assert.strictEqual(scanByCode.pass?.passCode, createdPassCode);

    // Test with qrCode
    const scanByQr = await visitorRepository.scanAndValidate(createdQrCode);
    assert.strictEqual(scanByQr.isValid, true, 'Pass should be valid by QR token');
    assert.strictEqual(scanByQr.canCheckIn, true);
  });

  await t.test('3. Security checks in the visitor (PENDING -> CHECKED_IN)', async () => {
    const checkedIn = await visitorService.checkInVisitor(createdPassId, {
      id: securityUser.id,
      email: securityUser.email || '',
      role: Role.STAFF_SECURITY,
      fullName: securityUser.fullName,
    });

    assert.strictEqual(checkedIn.status, VisitorStatus.CHECKED_IN);
    assert.ok(checkedIn.checkInAt, 'Check-in time must be recorded');
    assert.strictEqual(checkedIn.checkedInById, securityUser.id);

    // Scanner state verification
    const scanAfterCheckIn = await visitorRepository.scanAndValidate(createdPassCode);
    assert.strictEqual(scanAfterCheckIn.isValid, true);
    assert.strictEqual(scanAfterCheckIn.canCheckIn, false, 'Should not allow double check-in');
    assert.strictEqual(scanAfterCheckIn.canCheckOut, true, 'Should allow check out');
  });

  await t.test('4. Security checks out the visitor (CHECKED_IN -> CHECKED_OUT)', async () => {
    const checkedOut = await visitorService.checkOutVisitor(createdPassId, {
      id: securityUser.id,
      email: securityUser.email || '',
      role: Role.STAFF_SECURITY,
      fullName: securityUser.fullName,
    });

    assert.strictEqual(checkedOut.status, VisitorStatus.CHECKED_OUT);
    assert.ok(checkedOut.checkOutAt, 'Check-out time must be recorded');
    assert.strictEqual(checkedOut.checkedOutById, securityUser.id);

    // Scanner state verification
    const scanAfterCheckOut = await visitorRepository.scanAndValidate(createdPassCode);
    assert.strictEqual(scanAfterCheckOut.isValid, false, 'Checked out pass should no longer be valid for entry');
    assert.strictEqual(scanAfterCheckOut.canCheckIn, false);
    assert.strictEqual(scanAfterCheckOut.canCheckOut, false, 'Should not allow check out again');
  });

  await t.test('5. Cancellation and State Machine Guard', async () => {
    // Cannot cancel an already checked-out pass
    await assert.rejects(
      async () => {
        await visitorService.cancelVisitorPass(createdPassId, 'Hủy test', {
          id: residentUser.id,
          email: residentUser.email || '',
          role: Role.RESIDENT,
        });
      },
      /chờ/i,
      'Should not allow cancelling non-pending pass'
    );

    // Create a new pending pass to cancel
    const cancelPass = await visitorRepository.createPass(
      {
        visitorName: 'Khách Cần Hủy',
        visitDate: new Date().toISOString().split('T')[0],
        expectedTime: '10:00 - 12:00',
      },
      residentUser.id,
      testApartment.id
    );

    const cancelled = await visitorService.cancelVisitorPass(
      cancelPass.id,
      'Cư dân bận việc đột xuất',
      {
        id: adminUser.id,
        email: adminUser.email || '',
        role: Role.ADMIN,
      }
    );
    assert.strictEqual(cancelled.status, VisitorStatus.CANCELLED);

    // Scanning cancelled pass should be invalid
    const scanCancelled = await visitorRepository.scanAndValidate(cancelPass.passCode);
    assert.strictEqual(scanCancelled.isValid, false);
    assert.strictEqual(scanCancelled.canCheckIn, false);
  });

  await t.test('6. Stats aggregate check', async () => {
    const stats = await visitorRepository.getStats();
    assert.ok(typeof stats.activeVisitors === 'number');
    assert.ok(typeof stats.todayTotal === 'number');
    assert.ok(typeof stats.pendingToday === 'number');
    assert.ok(typeof stats.checkedOutToday === 'number');
  });
});
