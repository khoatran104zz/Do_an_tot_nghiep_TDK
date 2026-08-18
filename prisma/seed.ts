import { PrismaClient, Role, ApartmentStatus, ResidentRelationship, ResidentStatus, ContractType, ContractStatus, FeeUnit, InvoiceStatus, PaymentMethod, TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed script...');

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

  // 3. Apartments
  console.log('--> Seeding Apartments...');
  const aptA1001 = await prisma.apartment.upsert({
    where: { code: 'A-1001' },
    update: {},
    create: {
      code: 'A-1001',
      building: 'Tòa A',
      floor: 10,
      bedrooms: 2,
      bathrooms: 2,
      area: 75.5,
      status: ApartmentStatus.OCCUPIED,
      note: 'Căn góc hướng Đông Nam',
    },
  });

  const aptA1002 = await prisma.apartment.upsert({
    where: { code: 'A-1002' },
    update: {},
    create: {
      code: 'A-1002',
      building: 'Tòa A',
      floor: 10,
      bedrooms: 3,
      bathrooms: 2,
      area: 92.0,
      status: ApartmentStatus.VACANT,
      note: 'Căn 3PN view hồ bơi',
    },
  });

  const aptB2001 = await prisma.apartment.upsert({
    where: { code: 'B-2001' },
    update: {},
    create: {
      code: 'B-2001',
      building: 'Tòa B',
      floor: 20,
      bedrooms: 2,
      bathrooms: 2,
      area: 68.0,
      status: ApartmentStatus.OCCUPIED,
      note: 'Căn hộ nội thất đầy đủ',
    },
  });

  // 4. Users
  console.log('--> Seeding Users...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@building.com' },
    update: {},
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
    update: {},
    create: {
      email: 'manager@building.com',
      passwordHash: managerPassword,
      fullName: 'Trưởng Ban Quản Lý',
      phone: '0912345678',
      role: Role.MANAGER,
    },
  });

  const residentUser = await prisma.user.upsert({
    where: { email: 'resident@building.com' },
    update: {},
    create: {
      email: 'resident@building.com',
      passwordHash: residentPassword,
      fullName: 'Nguyễn Văn An',
      phone: '0987654321',
      role: Role.RESIDENT,
    },
  });

  // 5. Resident Profile
  console.log('--> Seeding Resident Profiles...');
  const residentProfile = await prisma.resident.upsert({
    where: { identityCard: '012345678901' },
    update: { userId: residentUser.id, apartmentId: aptA1001.id },
    create: {
      userId: residentUser.id,
      apartmentId: aptA1001.id,
      fullName: 'Nguyễn Văn An',
      identityCard: '012345678901',
      phone: '0987654321',
      email: 'resident@building.com',
      gender: 'Nam',
      relationshipToOwner: ResidentRelationship.OWNER,
      status: ResidentStatus.RESIDING,
    },
  });

  const residentProfile2 = await prisma.resident.upsert({
    where: { identityCard: '098765432109' },
    update: { apartmentId: aptB2001.id },
    create: {
      apartmentId: aptB2001.id,
      fullName: 'Trần Thị Bình',
      identityCard: '098765432109',
      phone: '0977112233',
      email: 'binhtran@gmail.com',
      gender: 'Nữ',
      relationshipToOwner: ResidentRelationship.OWNER,
      status: ResidentStatus.RESIDING,
    },
  });

  // 6. Contracts
  console.log('--> Seeding Contracts...');
  await prisma.contract.upsert({
    where: { contractCode: 'HD-2026-001' },
    update: {},
    create: {
      contractCode: 'HD-2026-001',
      apartmentId: aptA1001.id,
      residentId: residentProfile.id,
      type: ContractType.RENT,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      monthlyRent: 8500000,
      deposit: 17000000,
      status: ContractStatus.ACTIVE,
      note: 'Hợp đồng thuê 1 năm gia hạn hàng năm',
    },
  });

  // 7. Invoices
  console.log('--> Seeding Invoices...');
  const inv1 = await prisma.invoice.upsert({
    where: { code: 'INV-202608-A1001' },
    update: {},
    create: {
      code: 'INV-202608-A1001',
      apartmentId: aptA1001.id,
      billingMonth: '2026-08',
      dueDate: new Date('2026-08-25'),
      totalAmount: 1850000,
      status: InvoiceStatus.UNPAID,
      items: {
        create: [
          {
            feeCategoryId: mgmtFee.id,
            title: 'Phí quản lý vận hành (75.5 m²)',
            quantity: 75.5,
            unitPrice: 12000,
            amount: 906000,
          },
          {
            feeCategoryId: motoFee.id,
            title: 'Phí xe máy (2 xe)',
            quantity: 2,
            unitPrice: 100000,
            amount: 200000,
          },
          {
            feeCategoryId: electricFee.id,
            title: 'Tiền điện (180 kWh)',
            quantity: 180,
            unitPrice: 2800,
            amount: 504000,
          },
          {
            feeCategoryId: waterFee.id,
            title: 'Tiền nước (16 m³)',
            quantity: 16,
            unitPrice: 15000,
            amount: 240000,
          },
        ],
      },
    },
  });

  const inv2 = await prisma.invoice.upsert({
    where: { code: 'INV-202607-A1001' },
    update: {},
    create: {
      code: 'INV-202607-A1001',
      apartmentId: aptA1001.id,
      billingMonth: '2026-07',
      dueDate: new Date('2026-07-25'),
      totalAmount: 1780000,
      status: InvoiceStatus.PAID,
      paidAt: new Date('2026-07-20'),
      paymentMethod: PaymentMethod.VNPAY,
      transactionId: 'PAY-VNPAY-882910',
      items: {
        create: [
          {
            feeCategoryId: mgmtFee.id,
            title: 'Phí quản lý vận hành (75.5 m²)',
            quantity: 75.5,
            unitPrice: 12000,
            amount: 906000,
          },
          {
            feeCategoryId: motoFee.id,
            title: 'Phí xe máy (2 xe)',
            quantity: 2,
            unitPrice: 100000,
            amount: 200000,
          },
          {
            feeCategoryId: electricFee.id,
            title: 'Tiền điện (170 kWh)',
            quantity: 170,
            unitPrice: 2800,
            amount: 476000,
          },
          {
            feeCategoryId: waterFee.id,
            title: 'Tiền nước (13.2 m³)',
            quantity: 13.2,
            unitPrice: 15000,
            amount: 198000,
          },
        ],
      },
    },
  });

  // 8. Feedback Tickets
  console.log('--> Seeding Feedbacks...');
  await prisma.feedback.upsert({
    where: { code: 'FB-2026-0001' },
    update: {},
    create: {
      code: 'FB-2026-0001',
      apartmentId: aptA1001.id,
      residentId: residentProfile.id,
      category: TicketCategory.WATER,
      title: 'Áp lực nước yếu tại nhà vệ sinh phòng master',
      content: 'Từ sáng nay áp lực nước chảy rất yếu, đề nghị kỹ thuật tòa nhà qua kiểm tra van tổng giúp.',
      priority: TicketPriority.HIGH,
      status: TicketStatus.PROCESSING,
      responseContent: 'BQL đã cử kỹ thuật viên kiểm tra áp lực đường ống tầng 10.',
    },
  });

  // 9. Notifications
  console.log('--> Seeding Notifications...');
  await prisma.notification.create({
    data: {
      title: 'Thông báo Kiểm tra & Diễn tập PCCC Định kỳ Quý III/2026',
      content: 'Ban Quản Lý tòa nhà sẽ phối hợp với Cảnh sát PCCC tổ chức kiểm tra và diễn tập vào lúc 9h00 ngày 28/08/2026. Rất mong cư dân thông cảm và hợp tác.',
      isGlobal: true,
      senderId: adminUser.id,
    },
  });

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
