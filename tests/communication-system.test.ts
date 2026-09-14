import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { pollService } from '../src/modules/poll/poll.service';
import { notificationService } from '../src/modules/notification/notification.service';
import { domainEvents } from '../src/lib/events/domain-events';
import { Role, PollStatus, PollTargetScope, NotificationCategory, NotificationPriority, NotificationTargetScope } from '@prisma/client';

describe('COMMUNICATION SYSTEM TESTS (Polls, Announcements, Realtime)', async () => {
  let adminUser: any;
  let resident1User: any;
  let resident2User: any;
  let apartment1: any;
  let apartment2: any;
  let createdPollId: string;
  let option1Id: string;
  let option2Id: string;

  before(async () => {
    // 1. Setup mock/seed test apartments
    apartment1 = await prisma.apartment.upsert({
      where: { code: 'TEST-COMM-101' },
      update: {},
      create: {
        code: 'TEST-COMM-101',
        building: 'Tòa A',
        floor: 1,
        area: 75.5,
        bedrooms: 2,
        bathrooms: 2,
        status: 'OCCUPIED',
      },
    });

    apartment2 = await prisma.apartment.upsert({
      where: { code: 'TEST-COMM-102' },
      update: {},
      create: {
        code: 'TEST-COMM-102',
        building: 'Tòa A',
        floor: 1,
        area: 80.0,
        bedrooms: 2,
        bathrooms: 2,
        status: 'OCCUPIED',
      },
    });

    // 2. Setup users
    adminUser = await prisma.user.upsert({
      where: { email: 'admin.comm.test@smartbuilding.local' },
      update: {},
      create: {
        email: 'admin.comm.test@smartbuilding.local',
        fullName: 'BQL Tòa Nhà Test',
        passwordHash: 'hashedpassword',
        role: Role.ADMIN,
      },
    });

    resident1User = await prisma.user.upsert({
      where: { email: 'resident1.comm.test@smartbuilding.local' },
      update: {},
      create: {
        email: 'resident1.comm.test@smartbuilding.local',
        fullName: 'Nguyễn Văn A (Căn 101)',
        passwordHash: 'hashedpassword',
        role: Role.RESIDENT,
      },
    });

    resident2User = await prisma.user.upsert({
      where: { email: 'resident2.comm.test@smartbuilding.local' },
      update: {},
      create: {
        email: 'resident2.comm.test@smartbuilding.local',
        fullName: 'Trần Thị B (Căn 102)',
        passwordHash: 'hashedpassword',
        role: Role.RESIDENT,
      },
    });

    // Link residents to apartments
    await prisma.resident.upsert({
      where: { identityCard: 'TEST-ID-COMM-001' },
      update: { apartmentId: apartment1.id, userId: resident1User.id },
      create: {
        identityCard: 'TEST-ID-COMM-001',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        userId: resident1User.id,
        apartmentId: apartment1.id,
        relationshipToOwner: 'OWNER',
        status: 'RESIDING',
      },
    });

    await prisma.resident.upsert({
      where: { identityCard: 'TEST-ID-COMM-002' },
      update: { apartmentId: apartment2.id, userId: resident2User.id },
      create: {
        identityCard: 'TEST-ID-COMM-002',
        fullName: 'Trần Thị B',
        phone: '0901234568',
        userId: resident2User.id,
        apartmentId: apartment2.id,
        relationshipToOwner: 'OWNER',
        status: 'RESIDING',
      },
    });
  });

  after(async () => {
    // Cleanup created test records
    if (createdPollId) {
      await prisma.pollVote.deleteMany({ where: { pollId: createdPollId } });
      await prisma.pollOption.deleteMany({ where: { pollId: createdPollId } });
      await prisma.poll.delete({ where: { id: createdPollId } }).catch(() => {});
    }

    await prisma.notificationRead.deleteMany({
      where: { userId: { in: [resident1User.id, resident2User.id] } },
    });
    await prisma.notificationApartment.deleteMany({
      where: { apartmentId: { in: [apartment1.id, apartment2.id] } },
    });
    await prisma.notification.deleteMany({
      where: { senderId: adminUser.id },
    });
  });

  // =========================================================================
  // TEST SUITE 1: POLL & VOTING (1 APARTMENT = 1 VOTE)
  // =========================================================================
  await test('POLL 1: Ban Quản Lý tạo khảo sát lấy ý kiến cư dân', async () => {
    const startAt = new Date();
    const endAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    const poll = await pollService.createPoll(
      {
        title: 'Cư dân có đồng ý thay đổi giờ hoạt động hồ bơi?',
        description: 'Đề xuất mở cửa từ 05:30 sáng thay vì 06:30 sáng.',
        options: ['Đồng ý', 'Không đồng ý'],
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        targetScope: PollTargetScope.ALL_APARTMENTS,
      },
      { id: adminUser.id, role: Role.ADMIN }
    );

    assert.ok(poll.id);
    assert.equal(poll.options.length, 2);
    assert.equal(poll.status, PollStatus.ACTIVE);

    createdPollId = poll.id;
    option1Id = poll.options[0].id;
    option2Id = poll.options[1].id;
  });

  await test('POLL 2: Căn hộ 101 bỏ phiếu lần đầu thành công', async () => {
    const vote = await pollService.vote(
      createdPollId,
      { optionId: option1Id },
      { id: resident1User.id, role: Role.RESIDENT }
    );

    assert.ok(vote.id);
    assert.equal(vote.pollId, createdPollId);
    assert.equal(vote.apartmentId, apartment1.id);
    assert.equal(vote.optionId, option1Id);
  });

  await test('POLL 3: Căn hộ 101 cố gắng bỏ phiếu lần 2 -> Hệ thống phải từ chối (1 căn hộ = 1 vote)', async () => {
    await assert.rejects(
      async () => {
        await pollService.vote(
          createdPollId,
          { optionId: option2Id },
          { id: resident1User.id, role: Role.RESIDENT }
        );
      },
      {
        name: 'Error',
        message: /Căn hộ của bạn đã/i,
      }
    );
  });

  await test('POLL 4: Căn hộ 102 bỏ phiếu -> Cho phép thành công', async () => {
    const vote2 = await pollService.vote(
      createdPollId,
      { optionId: option1Id },
      { id: resident2User.id, role: Role.RESIDENT }
    );

    assert.ok(vote2.id);
    assert.equal(vote2.apartmentId, apartment2.id);
  });

  await test('POLL 5: Kiểm tra tính toán kết quả tỷ lệ tham gia và phần trăm option', async () => {
    const results = await pollService.getResults(createdPollId, { id: adminUser.id, role: Role.ADMIN });

    assert.equal(results.pollId, createdPollId);
    assert.equal(results.totalVotes, 2);
    assert.ok(results.eligibleApartments >= 2);
    assert.ok(results.participationRate > 0);

    const opt1 = results.options.find((o) => o.id === option1Id);
    const opt2 = results.options.find((o) => o.id === option2Id);

    assert.equal(opt1?.votesCount, 2);
    assert.equal(opt1?.percentage, 100);
    assert.equal(opt2?.votesCount, 0);
    assert.equal(opt2?.percentage, 0);
  });

  await test('POLL 6: Ban Quản Lý đóng cuộc khảo sát -> Ngăn không cho vote tiếp', async () => {
    const closed = await pollService.updatePoll(
      createdPollId,
      { status: PollStatus.CLOSED },
      { id: adminUser.id, role: Role.ADMIN }
    );
    assert.equal(closed.status, PollStatus.CLOSED);

    await assert.rejects(
      async () => {
        await pollService.vote(
          createdPollId,
          { optionId: option1Id },
          { id: resident1User.id, role: Role.RESIDENT }
        );
      },
      {
        name: 'Error',
        message: /hiện không trong thời gian/i,
      }
    );
  });

  // =========================================================================
  // TEST SUITE 2: NOTIFICATIONS & ANNOUNCEMENTS
  // =========================================================================
  await test('NOTIF 1: BQL phát hành thông báo khẩn cấp (EMERGENCY) toàn tòa nhà', async () => {
    const notif = await notificationService.createNotification({
      title: 'Cảnh báo diễn tập PCCC toàn khu',
      content: 'Tòa nhà sẽ tiến hành kiểm tra còi báo cháy định kỳ lúc 14:00.',
      category: NotificationCategory.EMERGENCY,
      priority: NotificationPriority.EMERGENCY,
      targetScope: NotificationTargetScope.ALL,
      senderId: adminUser.id,
    });

    assert.ok(notif.id);
    assert.equal(notif.category, NotificationCategory.EMERGENCY);
    assert.equal(notif.priority, NotificationPriority.EMERGENCY);

    // Cư dân 1 lấy danh sách thông báo
    const res1Notifs = await notificationService.getNotifications(
      {},
      { id: resident1User.id, role: Role.RESIDENT }
    );
    const found = res1Notifs.items.find((n: any) => n.id === notif.id);
    assert.ok(found, 'Cư dân 1 phải nhận được thông báo khẩn cấp toàn tòa nhà');

    // Unread count
    const unread = await notificationService.getUnreadCount({
      id: resident1User.id,
      role: Role.RESIDENT,
    });
    assert.ok(unread > 0, 'Unread count phải lớn hơn 0');

    // Cư dân 1 đánh dấu đã đọc
    await notificationService.markAsRead(notif.id, resident1User.id);

    const unreadAfter = await notificationService.getUnreadCount({
      id: resident1User.id,
      role: Role.RESIDENT,
    });
    assert.equal(unreadAfter, unread - 1, 'Unread count phải giảm đúng 1');
  });

  await test('NOTIF 2: BQL gửi thông báo bưu kiện (PARCEL) đích danh Căn hộ 101', async () => {
    const parcelNotif = await notificationService.createNotification({
      title: 'Bạn có một kiện hàng đang được lưu tại lễ tân',
      content: 'Mã bưu kiện: VNPOST-8899. Vui lòng mang mã nhận hàng đến quầy lễ tân.',
      category: NotificationCategory.PARCEL,
      priority: NotificationPriority.NORMAL,
      targetScope: NotificationTargetScope.APARTMENT,
      targetValue: 'TEST-COMM-101',
      apartmentIds: [apartment1.id],
      senderId: adminUser.id,
    });

    assert.ok(parcelNotif.id);

    // Cư dân 101 phải thấy
    const res1List = await notificationService.getNotifications(
      { category: NotificationCategory.PARCEL },
      { id: resident1User.id, role: Role.RESIDENT }
    );
    assert.ok(res1List.items.some((n: any) => n.id === parcelNotif.id));

    // Cư dân 102 KHÔNG được thấy thông báo bưu kiện riêng của 101
    const res2List = await notificationService.getNotifications(
      { category: NotificationCategory.PARCEL },
      { id: resident2User.id, role: Role.RESIDENT }
    );
    assert.ok(!res2List.items.some((n: any) => n.id === parcelNotif.id));
  });

  // =========================================================================
  // TEST SUITE 3: REALTIME DOMAIN EVENTS DISPATCHER
  // =========================================================================
  await test('REALTIME 1: domainEvents phát và bắt sự kiện qua domain_event', async () => {
    let capturedPayload: any = null;

    const handler = (payload: any) => {
      capturedPayload = payload;
    };

    domainEvents.on('domain_event', handler);

    domainEvents.dispatch({
      type: 'PARCEL_RECEIVED',
      title: 'Kiểm tra SSE Realtime',
      message: 'Kiện hàng mới đã đến',
      category: NotificationCategory.PARCEL,
      priority: NotificationPriority.URGENT,
      targetScope: 'APARTMENT',
      targetApartmentId: apartment1.id,
    });

    assert.ok(capturedPayload);
    assert.equal(capturedPayload.title, 'Kiểm tra SSE Realtime');
    assert.equal(capturedPayload.category, NotificationCategory.PARCEL);
    assert.equal(capturedPayload.priority, NotificationPriority.URGENT);

    domainEvents.off('domain_event', handler);
  });
});
