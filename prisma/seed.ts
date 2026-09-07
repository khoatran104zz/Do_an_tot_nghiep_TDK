import {
  PrismaClient,
  Role,
  ApartmentStatus,
  ResidentRelationship,
  ResidentStatus,
  ContractType,
  ContractStatus,
  FeeUnit,
  InvoiceStatus,
  PaymentMethod,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Password hashes
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const residentPassword = await bcrypt.hash('resident123', 10);

  // 2. Fee Categories
  console.log('--> Seeding Fee Categories...');
  const mgmtFee = await prisma.feeCategory.upsert({
    where: { code: 'MGMT' },
    update: {},
    create: {
      code: 'MGMT',
      name: 'Phí quản lý vận hành tòa nhà',
      unit: FeeUnit.PER_M2,
      unitPrice: 12000,
      description: 'Phí dịch vụ quản lý tính theo diện tích m2 căn hộ',
      isSystem: true,
    },
  });

  const motoFee = await prisma.feeCategory.upsert({
    where: { code: 'PARKING_MOTO' },
    update: {},
    create: {
      code: 'PARKING_MOTO',
      name: 'Phí trông giữ xe máy',
      unit: FeeUnit.PER_VEHICLE,
      unitPrice: 100000,
      description: 'Phí trông giữ xe máy theo tháng',
      isSystem: true,
    },
  });

  const carFee = await prisma.feeCategory.upsert({
    where: { code: 'PARKING_CAR' },
    update: {},
    create: {
      code: 'PARKING_CAR',
      name: 'Phí trông giữ ô tô',
      unit: FeeUnit.PER_VEHICLE,
      unitPrice: 1200000,
      description: 'Phí trông giữ ô tô theo tháng',
      isSystem: true,
    },
  });

  const electricFee = await prisma.feeCategory.upsert({
    where: { code: 'ELECTRIC' },
    update: {},
    create: {
      code: 'ELECTRIC',
      name: 'Tiền điện sinh hoạt',
      unit: FeeUnit.PER_KWH,
      unitPrice: 2800,
      description: 'Tiền điện sinh hoạt tính theo kWh',
      isSystem: true,
    },
  });

  const waterFee = await prisma.feeCategory.upsert({
    where: { code: 'WATER' },
    update: {},
    create: {
      code: 'WATER',
      name: 'Tiền nước sinh hoạt',
      unit: FeeUnit.PER_M3,
      unitPrice: 15000,
      description: 'Tiền nước sinh hoạt tính theo m3',
      isSystem: true,
    },
  });

  // 3. Apartments across 3 Buildings: Tòa A (Sky), Tòa B (Ocean), Tòa C (Garden)
  console.log('--> Seeding Apartments...');
  const apartmentsData = [
    { code: 'A-1001', building: 'Tòa A (Sky)', floor: 10, bedrooms: 2, bathrooms: 2, area: 75.5, status: ApartmentStatus.OCCUPIED, note: 'Căn góc Đông Nam' },
    { code: 'A-1002', building: 'Tòa A (Sky)', floor: 10, bedrooms: 3, bathrooms: 2, area: 92.0, status: ApartmentStatus.OCCUPIED, note: 'Căn 3PN view hồ bơi' },
    { code: 'A-1003', building: 'Tòa A (Sky)', floor: 10, bedrooms: 2, bathrooms: 1, area: 65.0, status: ApartmentStatus.VACANT, note: 'Đang bàn giao hoàn thiện' },
    { code: 'A-1201', building: 'Tòa A (Sky)', floor: 12, bedrooms: 3, bathrooms: 3, area: 115.0, status: ApartmentStatus.OCCUPIED, note: 'Penthouse tầng cao' },
    { code: 'B-2001', building: 'Tòa B (Ocean)', floor: 20, bedrooms: 2, bathrooms: 2, area: 68.0, status: ApartmentStatus.OCCUPIED, note: 'Căn hộ nội thất cao cấp' },
    { code: 'B-2002', building: 'Tòa B (Ocean)', floor: 20, bedrooms: 2, bathrooms: 2, area: 70.0, status: ApartmentStatus.OCCUPIED, note: 'Căn 2PN view thành phố' },
    { code: 'B-2003', building: 'Tòa B (Ocean)', floor: 20, bedrooms: 1, bathrooms: 1, area: 48.5, status: ApartmentStatus.VACANT, note: 'Khách đã cọc giữ chỗ' },
    { code: 'B-2101', building: 'Tòa B (Ocean)', floor: 21, bedrooms: 2, bathrooms: 2, area: 72.0, status: ApartmentStatus.UNDER_MAINTENANCE, note: 'Đang bảo dưỡng hệ thống chống thấm' },
    { code: 'C-0501', building: 'Tòa C (Garden)', floor: 5, bedrooms: 3, bathrooms: 2, area: 88.0, status: ApartmentStatus.OCCUPIED, note: 'Căn hộ sân vườn' },

    { code: 'C-0502', building: 'Tòa C (Garden)', floor: 5, bedrooms: 2, bathrooms: 2, area: 74.0, status: ApartmentStatus.OCCUPIED, note: 'Ban công hướng công viên' },
    { code: 'C-0601', building: 'Tòa C (Garden)', floor: 6, bedrooms: 2, bathrooms: 1, area: 62.0, status: ApartmentStatus.VACANT, note: 'Căn mới hoàn thiện cơ bản' },
    { code: 'C-0602', building: 'Tòa C (Garden)', floor: 6, bedrooms: 3, bathrooms: 2, area: 85.0, status: ApartmentStatus.OCCUPIED, note: 'Gia đình 4 thành viên' },
  ];

  const aptMap: Record<string, any> = {};
  for (const apt of apartmentsData) {
    const created = await prisma.apartment.upsert({
      where: { code: apt.code },
      update: { status: apt.status, area: apt.area, building: apt.building },
      create: apt,
    });
    aptMap[apt.code] = created;
  }

  // 4. Core Users
  console.log('--> Seeding Users...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@building.com' },
    update: { passwordHash: adminPassword },
    create: {
      email: 'admin@building.com',
      passwordHash: adminPassword,
      fullName: 'Quản trị viên Hệ thống',
      phone: '0901234567',
      role: Role.ADMIN,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@building.com' },
    update: { passwordHash: managerPassword },
    create: {
      email: 'manager@building.com',
      passwordHash: managerPassword,
      fullName: 'Trần Minh Đức (Trưởng BQL)',
      phone: '0912345678',
      role: Role.MANAGER,
    },
  });

  const residentUser = await prisma.user.upsert({
    where: { email: 'resident@building.com' },
    update: { passwordHash: residentPassword },
    create: {
      email: 'resident@building.com',
      passwordHash: residentPassword,
      fullName: 'Nguyễn Văn An',
      phone: '0987654321',
      role: Role.RESIDENT,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'tech@building.com' },
    update: { passwordHash: managerPassword },
    create: {
      email: 'tech@building.com',
      passwordHash: managerPassword,
      fullName: 'Lê Hoàng Nam (Kỹ thuật viên)',
      phone: '0933445566',
      role: Role.MANAGER,
    },
  });

  // 5. Residents Profiles
  console.log('--> Seeding Resident Profiles...');
  const residentProfileA1001 = await prisma.resident.upsert({
    where: { identityCard: '012345678901' },
    update: { userId: residentUser.id, apartmentId: aptMap['A-1001'].id },
    create: {
      userId: residentUser.id,
      apartmentId: aptMap['A-1001'].id,
      fullName: 'Nguyễn Văn An',
      identityCard: '012345678901',
      phone: '0987654321',
      email: 'resident@building.com',
      gender: 'Nam',
      relationshipToOwner: ResidentRelationship.OWNER,
      status: ResidentStatus.RESIDING,
    },
  });

  const residentProfileA1001_spouse = await prisma.resident.upsert({
    where: { identityCard: '012345678902' },
    update: { apartmentId: aptMap['A-1001'].id },
    create: {
      apartmentId: aptMap['A-1001'].id,
      fullName: 'Phạm Thu Hương',
      identityCard: '012345678902',
      phone: '0987654322',
      email: 'thuhuong.pham@gmail.com',
      gender: 'Nữ',
      relationshipToOwner: ResidentRelationship.FAMILY,
      status: ResidentStatus.RESIDING,
    },
  });


  const residentProfileA1002 = await prisma.resident.upsert({
    where: { identityCard: '023456789012' },
    update: { apartmentId: aptMap['A-1002'].id },
    create: {
      apartmentId: aptMap['A-1002'].id,
      fullName: 'Hoàng Quốc Dũng',
      identityCard: '023456789012',
      phone: '0944556677',
      email: 'dung.hoang@vietcombank.com',
      gender: 'Nam',
      relationshipToOwner: ResidentRelationship.OWNER,
      status: ResidentStatus.RESIDING,
    },
  });

  const residentProfileB2001 = await prisma.resident.upsert({
    where: { identityCard: '098765432109' },
    update: { apartmentId: aptMap['B-2001'].id },
    create: {
      apartmentId: aptMap['B-2001'].id,
      fullName: 'Trần Thị Bình',
      identityCard: '098765432109',
      phone: '0977112233',
      email: 'binhtran@gmail.com',
      gender: 'Nữ',
      relationshipToOwner: ResidentRelationship.OWNER,
      status: ResidentStatus.RESIDING,
    },
  });

  const residentProfileB2002 = await prisma.resident.upsert({
    where: { identityCard: '034567890123' },
    update: { apartmentId: aptMap['B-2002'].id },
    create: {
      apartmentId: aptMap['B-2002'].id,
      fullName: 'Đặng Tuấn Kiệt',
      identityCard: '034567890123',
      phone: '0911223344',
      email: 'kiet.dang@fpt.com',
      gender: 'Nam',
      relationshipToOwner: ResidentRelationship.TENANT,
      status: ResidentStatus.RESIDING,
    },
  });

  const residentProfileC0501 = await prisma.resident.upsert({
    where: { identityCard: '045678901234' },
    update: { apartmentId: aptMap['C-0501'].id },
    create: {
      apartmentId: aptMap['C-0501'].id,
      fullName: 'Vũ Đình Trọng',
      identityCard: '045678901234',
      phone: '0922334455',
      email: 'trongvu@techcom.vn',
      gender: 'Nam',
      relationshipToOwner: ResidentRelationship.OWNER,
      status: ResidentStatus.RESIDING,
    },
  });

  // 6. Contracts with Smart Alert triggers (expiring soon, active, expired)
  console.log('--> Seeding Contracts...');
  const now = new Date();

  // Contract 1: Active
  await prisma.contract.upsert({
    where: { contractCode: 'HD-2026-001' },
    update: {},
    create: {
      contractCode: 'HD-2026-001',
      apartmentId: aptMap['A-1001'].id,
      residentId: residentProfileA1001.id,
      type: ContractType.RENT,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      monthlyRent: 8500000,
      deposit: 17000000,
      status: ContractStatus.ACTIVE,
      note: 'Hợp đồng thuê căn hộ 1 năm',
    },
  });

  // Contract 2: Expiring in 5 days -> Triggers CRITICAL Alert
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  await prisma.contract.upsert({
    where: { contractCode: 'HD-2026-002' },
    update: { endDate: in5Days, status: ContractStatus.ACTIVE },
    create: {
      contractCode: 'HD-2026-002',
      apartmentId: aptMap['B-2002'].id,
      residentId: residentProfileB2002.id,
      type: ContractType.RENT,
      startDate: new Date('2025-09-15'),
      endDate: in5Days,
      monthlyRent: 9500000,
      deposit: 19000000,
      status: ContractStatus.ACTIVE,
      note: 'Hợp đồng sắp hết hạn trong 5 ngày tới, cần gia hạn',
    },
  });

  // Contract 3: Expiring in 22 days -> Triggers WARNING Alert
  const in22Days = new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000);
  await prisma.contract.upsert({
    where: { contractCode: 'HD-2026-003' },
    update: { endDate: in22Days, status: ContractStatus.ACTIVE },
    create: {
      contractCode: 'HD-2026-003',
      apartmentId: aptMap['C-0501'].id,
      residentId: residentProfileC0501.id,
      type: ContractType.RENT,
      startDate: new Date('2025-10-01'),
      endDate: in22Days,
      monthlyRent: 11000000,
      deposit: 22000000,
      status: ContractStatus.ACTIVE,
      note: 'Hợp đồng còn 22 ngày, chuẩn bị thủ tục tái ký',
    },
  });

  // 7. Invoices spanning past 6 months (Apr - Sep 2026) for rich charts
  console.log('--> Seeding Invoices & Payments...');

  // Current Month: Unpaid
  await prisma.invoice.upsert({
    where: { code: 'INV-202609-A1001' },
    update: {},
    create: {
      code: 'INV-202609-A1001',
      apartmentId: aptMap['A-1001'].id,
      billingMonth: '2026-09',
      dueDate: new Date('2026-09-25'),
      totalAmount: 1850000,
      status: InvoiceStatus.UNPAID,
      items: {
        create: [
          { feeCategoryId: mgmtFee.id, title: 'Phí quản lý vận hành (75.5 m²)', quantity: 75.5, unitPrice: 12000, amount: 906000 },
          { feeCategoryId: motoFee.id, title: 'Phí xe máy (2 xe)', quantity: 2, unitPrice: 100000, amount: 200000 },
          { feeCategoryId: electricFee.id, title: 'Tiền điện (180 kWh)', quantity: 180, unitPrice: 2800, amount: 504000 },
          { feeCategoryId: waterFee.id, title: 'Tiền nước (16 m³)', quantity: 16, unitPrice: 15000, amount: 240000 },
        ],
      },
    },
  });

  // Overdue Critical: Overdue by 20 days -> Triggers CRITICAL Alert
  await prisma.invoice.upsert({
    where: { code: 'INV-202608-B2002' },
    update: {},
    create: {
      code: 'INV-202608-B2002',
      apartmentId: aptMap['B-2002'].id,
      billingMonth: '2026-08',
      dueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // Overdue by 20 days
      totalAmount: 5450000, // High debt >= 5M
      status: InvoiceStatus.OVERDUE,
      items: {
        create: [
          { feeCategoryId: mgmtFee.id, title: 'Phí quản lý (70 m²)', quantity: 70, unitPrice: 12000, amount: 840000 },
          { feeCategoryId: carFee.id, title: 'Phí trông ô tô (2 xe)', quantity: 2, unitPrice: 1200000, amount: 2400000 },
          { feeCategoryId: electricFee.id, title: 'Tiền điện (450 kWh)', quantity: 450, unitPrice: 2800, amount: 1260000 },
          { feeCategoryId: waterFee.id, title: 'Tiền nước (63 m³)', quantity: 63, unitPrice: 15000, amount: 945000 },
        ],
      },
    },
  });

  // Past Paid Invoices (August, July, June, May, April)
  const pastMonths = [
    { month: '2026-08', apt: 'A-1001', code: 'INV-202608-A1001', amount: 1850000, paidMethod: PaymentMethod.VNPAY, tx: 'PAY-VNPAY-992182' },
    { month: '2026-07', apt: 'A-1001', code: 'INV-202607-A1001', amount: 1780000, paidMethod: PaymentMethod.BANK_TRANSFER, tx: 'PAY-VCB-883192' },
    { month: '2026-06', apt: 'A-1001', code: 'INV-202606-A1001', amount: 1920000, paidMethod: PaymentMethod.MOMO, tx: 'PAY-MOMO-772183' },
    { month: '2026-08', apt: 'A-1002', code: 'INV-202608-A1002', amount: 2450000, paidMethod: PaymentMethod.VNPAY, tx: 'PAY-VNPAY-663194' },
    { month: '2026-07', apt: 'A-1002', code: 'INV-202607-A1002', amount: 2380000, paidMethod: PaymentMethod.BANK_TRANSFER, tx: 'PAY-TCB-552185' },
    { month: '2026-08', apt: 'B-2001', code: 'INV-202608-B2001', amount: 1650000, paidMethod: PaymentMethod.CASH, tx: 'PAY-CASH-442186' },
    { month: '2026-08', apt: 'C-0501', code: 'INV-202608-C0501', amount: 2150000, paidMethod: PaymentMethod.BANK_TRANSFER, tx: 'PAY-MBB-332187' },
  ];

  for (const p of pastMonths) {
    await prisma.invoice.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        apartmentId: aptMap[p.apt].id,
        billingMonth: p.month,
        dueDate: new Date(`${p.month}-25`),
        totalAmount: p.amount,
        status: InvoiceStatus.PAID,
        paidAt: new Date(`${p.month}-20`),
        paymentMethod: p.paidMethod,
        transactionId: p.tx,
        items: {
          create: [
            { title: 'Phí quản lý & dịch vụ tòa nhà', quantity: 1, unitPrice: p.amount * 0.55, amount: p.amount * 0.55 },
            { title: 'Điện, nước & gửi xe', quantity: 1, unitPrice: p.amount * 0.45, amount: p.amount * 0.45 },
          ],
        },
      },
    });
  }

  // 8. Tickets across diverse states & priorities with SLAs
  console.log('--> Seeding Tickets & Workflow...');

  // Ticket 1: Urgent SLA Breached -> Triggers CRITICAL Alert
  const breachedSla = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3h ago
  await prisma.feedback.upsert({
    where: { code: 'FB-2026-0001' },
    update: { status: TicketStatus.PROCESSING, slaDueAt: breachedSla, priority: TicketPriority.URGENT },
    create: {
      code: 'FB-2026-0001',
      apartmentId: aptMap['A-1001'].id,
      residentId: residentProfileA1001.id,
      category: TicketCategory.WATER,
      title: 'Rò rỉ van cấp nước tổng khu vực vệ sinh',
      content: 'Nước chảy tràn sàn vệ sinh phòng ngủ master từ sáng nay, cần hỗ trợ khóa van gấp.',
      priority: TicketPriority.URGENT,
      status: TicketStatus.PROCESSING,
      assignedStaffId: staffUser.id,
      slaDueAt: breachedSla,
      responseContent: 'Kỹ thuật viên Lê Hoàng Nam đang có mặt để thay thế gioăng cao su và van khóa.',
    },
  });

  // Ticket 2: New ticket awaiting assignment
  await prisma.feedback.upsert({
    where: { code: 'FB-2026-0002' },
    update: {},
    create: {
      code: 'FB-2026-0002',
      apartmentId: aptMap['B-2001'].id,
      residentId: residentProfileB2001.id,
      category: TicketCategory.ELECTRIC,
      title: 'Đèn chiếu sáng hành lang tầng 20 chớp nháy liên tục',
      content: 'Bóng đèn LED ngoài cửa căn B-2001 bị chập chờn gây khó chịu vào ban đêm.',
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.NEW,
      slaDueAt: new Date(now.getTime() + 20 * 60 * 60 * 1000), // in 20h
    },
  });

  // Ticket 3: Resolved & Rated 5 stars
  await prisma.feedback.upsert({
    where: { code: 'FB-2026-0003' },
    update: {},
    create: {
      code: 'FB-2026-0003',
      apartmentId: aptMap['A-1002'].id,
      residentId: residentProfileA1002.id,
      category: TicketCategory.ELEVATOR,
      title: 'Thang máy số 2 kêu rít khi dừng tầng 10',
      content: 'Khi thang số 2 dừng ở tầng 10 phát ra tiếng rít kim loại.',
      priority: TicketPriority.HIGH,
      status: TicketStatus.CLOSED,
      assignedStaffId: staffUser.id,
      slaDueAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      responseContent: 'Đội bảo trì Schindler đã tra dầu ray trượt và căn chỉnh đối trọng.',
      resolvedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      rating: 5,
      ratingComment: 'Kỹ thuật xử lý rất nhanh và chuyên nghiệp, cảm ơn BQL!',
    },
  });


  // 9. Notifications
  console.log('--> Seeding Notifications...');
  await prisma.notification.create({
    data: {
      title: 'Thông báo Kiểm tra & Diễn tập PCCC Định kỳ Quý III/2026',
      content: 'Ban Quản Lý tòa nhà phối hợp với Công an PCCC tổ chức kiểm tra và diễn tập thoát nạn vào lúc 9h00 Chủ Nhật ngày 20/09/2026. Kính mong toàn thể cư dân chủ động sắp xếp tham gia.',
      isGlobal: true,
      senderId: adminUser.id,
    },
  });

  await prisma.notification.create({
    data: {
      title: 'Lịch súc rửa bể chứa nước sinh hoạt Tòa A',
      content: 'Ban Quản Lý sẽ tiến hành bảo dưỡng súc rửa bể nước ngầm Tòa A từ 23h00 đến 05h00 sáng ngày 12/09/2026. Nước sinh hoạt sẽ tạm ngắt trong thời gian trên.',
      isGlobal: false,
      senderId: managerUser.id,
      apartments: {
        create: [
          { apartmentId: aptMap['A-1001'].id },
          { apartmentId: aptMap['A-1002'].id },
          { apartmentId: aptMap['A-1003'].id },
          { apartmentId: aptMap['A-1201'].id },
        ],
      },
    },
  });

  console.log('✅ Rich demo dataset seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
