import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { parcelRepository } from '../src/modules/parcel/parcel.repository';
import { parcelService } from '../src/modules/parcel/parcel.service';
import { ParcelStatus, Role } from '@prisma/client';

test('Parcel Management Module Test Suite', async (t) => {
  // 1. Setup test context
  const testApartment = await prisma.apartment.findFirst({
    include: { residents: true },
  });
  assert.ok(testApartment, 'Cần có ít nhất một căn hộ trong cơ sở dữ liệu để chạy test');

  const receptionistUser =
    (await prisma.user.findFirst({ where: { role: Role.STAFF_RECEPTIONIST } })) ||
    (await prisma.user.findFirst({ where: { role: Role.MANAGER } })) ||
    (await prisma.user.findFirst({ where: { role: Role.ADMIN } }));
  assert.ok(receptionistUser, 'Cần có tài khoản Lễ tân hoặc Quản lý');

  let testParcelId = '';
  let testPickupCode = '';

  await t.test('1. Pickup code generation: 6 digits, random, and numeric', async () => {
    const code = await parcelService.generateUniquePickupCode();
    assert.strictEqual(code.length, 6, 'Pickup code phải có đúng 6 chữ số');
    assert.ok(/^\d{6}$/.test(code), 'Pickup code chỉ chứa các ký tự số từ 0-9');
  });

  await t.test('2. Receive Parcel: Create parcel, set status NOTIFIED, and create notification for resident', async () => {
    const trackingCode = `TEST-SPX-${Date.now()}`;
    const parcel = await parcelService.receiveParcel(
      {
        apartmentId: testApartment.id,
        recipientName: 'Nguyễn Văn Test',
        recipientPhone: '0988776655',
        carrier: 'Shopee Express',
        trackingNumber: trackingCode,
        location: 'Kệ A - Tầng 1',
        note: 'Hàng dễ vỡ xin nhẹ tay',
      },
      {
        id: receptionistUser.id,
        role: receptionistUser.role,
        fullName: receptionistUser.fullName,
      }
    );

    assert.ok(parcel.id, 'Parcel phải có id hợp lệ');
    assert.strictEqual(parcel.apartmentId, testApartment.id);
    assert.strictEqual(parcel.carrier, 'Shopee Express');
    assert.strictEqual(parcel.trackingNumber, trackingCode);
    assert.strictEqual(parcel.pickupCode.length, 6);
    assert.strictEqual(parcel.status, ParcelStatus.NOTIFIED);
    assert.ok(parcel.notifiedAt, 'Phải có thời gian thông báo notifiedAt');

    testParcelId = parcel.id;
    testPickupCode = parcel.pickupCode;

    // Check notification in DB
    const notif = await prisma.notification.findFirst({
      where: {
        apartments: { some: { apartmentId: testApartment.id } },
        content: { contains: parcel.pickupCode },
      },
    });
    assert.ok(notif, 'Hệ thống phải tự động tạo notification chứa pickup code cho căn hộ');
  });

  await t.test('3. Scoped Parcel Queries: IDOR Protection for residents', async () => {
    // Find resident belonging to testApartment
    const resident = await prisma.resident.findFirst({
      where: { apartmentId: testApartment.id, userId: { not: null } },
      include: { user: true },
    });

    if (resident && resident.user) {
      const residentParcels = await parcelService.getParcels(
        {},
        {
          id: resident.user.id,
          role: Role.RESIDENT,
        }
      );

      assert.ok(residentParcels.items.length > 0, 'Resident phải xem được bưu kiện căn hộ mình');
      residentParcels.items.forEach((p) => {
        assert.strictEqual(
          p.apartmentId,
          testApartment.id,
          'Resident tuyệt đối không được xem kiện hàng của căn hộ khác'
        );
      });
    }
  });

  await t.test('4. Collect Parcel: Reject invalid pickup code', async () => {
    await assert.rejects(
      async () => {
        await parcelService.collectParcel(
          {
            pickupCode: '999999', // Mã sai
            parcelId: testParcelId,
          },
          {
            id: receptionistUser.id,
            role: receptionistUser.role,
          }
        );
      },
      /Mã nhận hàng không chính xác|Mã nhận hàng không hợp lệ/,
      'Hệ thống phải từ chối khi nhập sai mã nhận hàng'
    );
  });

  await t.test('5. Collect Parcel: Accept correct pickup code, update status to COLLECTED', async () => {
    const collected = await parcelService.collectParcel(
      {
        pickupCode: testPickupCode,
        parcelId: testParcelId,
        collectedByName: 'Chủ hộ nhận thay',
      },
      {
        id: receptionistUser.id,
        role: receptionistUser.role,
        fullName: receptionistUser.fullName,
      }
    );

    assert.strictEqual(collected.status, ParcelStatus.COLLECTED);
    assert.ok(collected.collectedAt, 'Phải ghi nhận thời điểm bàn giao');
    assert.strictEqual(collected.collectedByName, 'Chủ hộ nhận thay');
    assert.strictEqual(collected.collectedById, receptionistUser.id);
  });

  await t.test('6. Collect Parcel: Cannot collect already collected parcel again', async () => {
    await assert.rejects(
      async () => {
        await parcelService.collectParcel(
          {
            pickupCode: testPickupCode,
            parcelId: testParcelId,
          },
          {
            id: receptionistUser.id,
            role: receptionistUser.role,
          }
        );
      },
      /Bưu kiện này đã được bàn giao|không hợp lệ/,
      'Không cho phép bàn giao lại bưu kiện đã hoàn tất'
    );
  });

  await t.test('7. Parcel Stats: Returns correct statistics', async () => {
    const stats = await parcelService.getStats({
      id: receptionistUser.id,
      role: receptionistUser.role,
    });

    assert.ok(typeof stats.totalPending === 'number');
    assert.ok(typeof stats.receivedToday === 'number');
    assert.ok(typeof stats.collectedToday === 'number');
    assert.ok(typeof stats.totalMonthly === 'number');
  });

  // Cleanup test parcel
  if (testParcelId) {
    await prisma.parcelDelivery.delete({ where: { id: testParcelId } }).catch(() => {});
  }
});
