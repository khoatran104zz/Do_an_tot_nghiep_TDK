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
  VehicleType,
  VehicleStatus,
  ParkingCardStatus,
  ApartmentHistoryEvent,
  AssetCategory,
  AssetStatus,
  MaintenanceCycle,
  MaintenanceStatus,
  FacilityType,
  FacilityStatus,
  BookingStatus,
  VisitorStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Password hashes
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const residentPassword = await bcrypt.hash('resident123', 10);
  const techPassword = await bcrypt.hash('tech123', 10);
  const securityPassword = await bcrypt.hash('security123', 10);
  const receptionistPassword = await bcrypt.hash('recept123', 10);

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

  // 3.1 Bootstrap Property Hierarchy (Building -> Block -> Floor)
  console.log('--> Seeding Property Hierarchy (Building -> Block -> Floor)...');
  const masterBuilding = await prisma.building.upsert({
    where: { code: 'SMART-CITY' },
    update: {},
    create: {
      code: 'SMART-CITY',
      name: 'Tổ hợp Chung cư SmartCity Landmark',
      address: 'Số 108 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      description: 'Khu phức hợp căn hộ thông minh cao cấp tích hợp IoT & BMS',
    },
  });

  const blockConfigs = [
    { code: 'BLOCK-A', name: 'Tháp A (Sky Tower)', keyword: 'Tòa A', prefix: 'A', totalFloors: 15, aptPerFloor: 4 },
    { code: 'BLOCK-B', name: 'Tháp B (Ocean Tower)', keyword: 'Tòa B', prefix: 'B', totalFloors: 25, aptPerFloor: 4 },
    { code: 'BLOCK-C', name: 'Tháp C (Garden Tower)', keyword: 'Tòa C', prefix: 'C', totalFloors: 10, aptPerFloor: 4 },
  ];

  const seededBlocks: Record<string, any> = {};
  for (const b of blockConfigs) {
    const block = await prisma.block.upsert({
      where: { buildingId_code: { buildingId: masterBuilding.id, code: b.code } },
      update: { name: b.name, totalFloors: b.totalFloors },
      create: {
        buildingId: masterBuilding.id,
        code: b.code,
        name: b.name,
        totalFloors: b.totalFloors,
      },
    });
    seededBlocks[b.code] = block;

    // Generate all floors from 1 to totalFloors
    for (let f = 1; f <= b.totalFloors; f++) {
      const floorName = `Tầng ${f.toString().padStart(2, '0')}`;
      const floor = await prisma.floor.upsert({
        where: { blockId_floorNumber: { blockId: block.id, floorNumber: f } },
        update: { name: floorName },
        create: {
          blockId: block.id,
          floorNumber: f,
          name: floorName,
        },
      });

      // Generate apartments for each floor
      for (let aptIdx = 1; aptIdx <= b.aptPerFloor; aptIdx++) {
        const aptCode = `${b.prefix}-${f.toString().padStart(2, '0')}${aptIdx.toString().padStart(2, '0')}`;
        const existingApt = aptMap[aptCode];

        if (!existingApt) {
          const hash = (f * 7 + aptIdx * 13) % 10;
          let status: ApartmentStatus = ApartmentStatus.OCCUPIED;
          if (hash === 1 || hash === 5) status = ApartmentStatus.VACANT;
          else if (hash === 9) status = ApartmentStatus.UNDER_MAINTENANCE;

          const bedrooms = aptIdx === 1 ? 1 : aptIdx === 2 ? 2 : aptIdx === 3 ? 3 : 2;
          const bathrooms = aptIdx === 1 ? 1 : 2;
          const area = aptIdx === 1 ? 52.0 : aptIdx === 2 ? 75.0 : aptIdx === 3 ? 95.0 : 68.0;

          const createdApt = await prisma.apartment.upsert({
            where: { code: aptCode },
            update: {
              buildingId: masterBuilding.id,
              blockId: block.id,
              floorId: floor.id,
              building: b.name,
              floor: f,
            },
            create: {
              code: aptCode,
              building: b.name,
              floor: f,
              bedrooms,
              bathrooms,
              area,
              status,
              note: `Căn ${bedrooms}PN view ${aptIdx % 2 === 0 ? 'hồ bơi' : 'công viên'}`,
              buildingId: masterBuilding.id,
              blockId: block.id,
              floorId: floor.id,
            },
          });
          aptMap[aptCode] = createdApt;
        } else {
          await prisma.apartment.update({
            where: { id: existingApt.id },
            data: {
              buildingId: masterBuilding.id,
              blockId: block.id,
              floorId: floor.id,
              building: b.name,
              floor: f,
            },
          });
        }
      }
    }
  }

  // Seed sample history if empty for initial apartments
  for (const apt of apartmentsData) {
    const aptRecord = aptMap[apt.code];
    if (!aptRecord) continue;
    const histCount = await prisma.apartmentHistory.count({ where: { apartmentId: aptRecord.id } });
    if (histCount === 0) {
      if (apt.status === ApartmentStatus.OCCUPIED) {
        await prisma.apartmentHistory.createMany({
          data: [
            {
              apartmentId: aptRecord.id,
              event: ApartmentHistoryEvent.OWNER_TRANSFER,
              title: 'Bàn giao căn hộ cho chủ sở hữu',
              description: `Bàn giao chìa khóa và hồ sơ kỹ thuật căn hộ ${apt.code}`,
              performedBy: 'Ban Quản Lý Tòa Nhà',
              createdAt: new Date(Date.now() - 90 * 86400000),
            },
            {
              apartmentId: aptRecord.id,
              event: ApartmentHistoryEvent.STATUS_CHANGE,
              title: 'Chuyển trạng thái sang Đang ở (OCCUPIED)',
              description: 'Cư dân hoàn tất thủ tục đăng ký tạm trú và dọn vào sinh sống',
              fromStatus: ApartmentStatus.VACANT,
              toStatus: ApartmentStatus.OCCUPIED,
              performedBy: 'Ban Quản Lý Tòa Nhà',
              createdAt: new Date(Date.now() - 60 * 86400000),
            },
          ],
        });
      } else if (apt.status === ApartmentStatus.UNDER_MAINTENANCE) {
        await prisma.apartmentHistory.create({
          data: {
            apartmentId: aptRecord.id,
            event: ApartmentHistoryEvent.STATUS_CHANGE,
            title: 'Chuyển trạng thái sang Bảo dưỡng (UNDER_MAINTENANCE)',
            description: 'Bảo dưỡng và chống thấm ban công theo kế hoạch kỹ thuật',
            fromStatus: ApartmentStatus.OCCUPIED,
            toStatus: ApartmentStatus.UNDER_MAINTENANCE,
            performedBy: 'Kỹ thuật viên trưởng',
            createdAt: new Date(Date.now() - 7 * 86400000),
          },
        });
      } else {
        await prisma.apartmentHistory.create({
          data: {
            apartmentId: aptRecord.id,
            event: ApartmentHistoryEvent.STATUS_CHANGE,
            title: 'Căn hộ sẵn sàng bàn giao (VACANT)',
            description: 'Nghiệm thu hoàn thiện nội thất và sẵn sàng đón cư dân',
            fromStatus: ApartmentStatus.UNDER_MAINTENANCE,
            toStatus: ApartmentStatus.VACANT,
            performedBy: 'Ban Quản Lý Tòa Nhà',
            createdAt: new Date(Date.now() - 30 * 86400000),
          },
        });
      }
    }
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
    update: { passwordHash: managerPassword, role: Role.MANAGER },
    create: {
      email: 'manager@building.com',
      passwordHash: managerPassword,
      fullName: 'Trần Minh Đức (Trưởng BQL SmartCity)',
      phone: '0912345678',
      role: Role.MANAGER,
    },
  });

  const manager2User = await prisma.user.upsert({
    where: { email: 'manager2@building.com' },
    update: { passwordHash: managerPassword, role: Role.MANAGER },
    create: {
      email: 'manager2@building.com',
      passwordHash: managerPassword,
      fullName: 'Lê Thị Thu Thảo (Quản lý Sunrise Tower)',
      phone: '0918765432',
      role: Role.MANAGER,
    },
  });

  // Second Building for Multi-Property & Scope Verification
  const sunriseBuilding = await prisma.building.upsert({
    where: { code: 'SUNRISE-TOWER' },
    update: {},
    create: {
      code: 'SUNRISE-TOWER',
      name: 'Tòa nhà Sunrise Tower',
      address: 'Số 25 Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      description: 'Khu căn hộ dịch vụ cao cấp Sunrise Tower',
    },
  });

  // Assign Managers to respective Buildings
  await prisma.managerBuilding.upsert({
    where: { managerId_buildingId: { managerId: managerUser.id, buildingId: masterBuilding.id } },
    update: {},
    create: {
      managerId: managerUser.id,
      buildingId: masterBuilding.id,
    },
  });

  await prisma.managerBuilding.upsert({
    where: { managerId_buildingId: { managerId: manager2User.id, buildingId: sunriseBuilding.id } },
    update: {},
    create: {
      managerId: manager2User.id,
      buildingId: sunriseBuilding.id,
    },
  });

  // Seed sample block & apartment for Sunrise Tower
  const sunriseBlock = await prisma.block.upsert({
    where: { buildingId_code: { buildingId: sunriseBuilding.id, code: 'BLOCK-S1' } },
    update: {},
    create: {
      buildingId: sunriseBuilding.id,
      code: 'BLOCK-S1',
      name: 'Tháp Sunrise S1',
      totalFloors: 10,
    },
  });

  const sunriseFloor = await prisma.floor.upsert({
    where: { blockId_floorNumber: { blockId: sunriseBlock.id, floorNumber: 5 } },
    update: {},
    create: {
      blockId: sunriseBlock.id,
      floorNumber: 5,
      name: 'Tầng 05',
    },
  });

  await prisma.apartment.upsert({
    where: { code: 'SR-0501' },
    update: {
      buildingId: sunriseBuilding.id,
      blockId: sunriseBlock.id,
      floorId: sunriseFloor.id,
    },
    create: {
      code: 'SR-0501',
      building: sunriseBuilding.name,
      floor: 5,
      bedrooms: 2,
      bathrooms: 2,
      area: 82.5,
      status: ApartmentStatus.OCCUPIED,
      note: 'Căn hộ view công viên Tao Đàn',
      buildingId: sunriseBuilding.id,
      blockId: sunriseBlock.id,
      floorId: sunriseFloor.id,
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

  const techUser = await prisma.user.upsert({
    where: { email: 'technician@building.com' },
    update: { passwordHash: techPassword, role: Role.STAFF_TECHNICIAN },
    create: {
      email: 'technician@building.com',
      passwordHash: techPassword,
      fullName: 'Lê Hoàng Nam (Kỹ thuật viên Trưởng)',
      phone: '0933445566',
      role: Role.STAFF_TECHNICIAN,
    },
  });
  const staffUser = techUser;

  const securityUser = await prisma.user.upsert({
    where: { email: 'security@building.com' },
    update: { passwordHash: securityPassword, role: Role.STAFF_SECURITY },
    create: {
      email: 'security@building.com',
      passwordHash: securityPassword,
      fullName: 'Hoàng Văn Hùng (Đội trưởng An ninh)',
      phone: '0944556677',
      role: Role.STAFF_SECURITY,
    },
  });

  const receptionistUser = await prisma.user.upsert({
    where: { email: 'receptionist@building.com' },
    update: { passwordHash: receptionistPassword, role: Role.STAFF_RECEPTIONIST },
    create: {
      email: 'receptionist@building.com',
      passwordHash: receptionistPassword,
      fullName: 'Đỗ Thị Mai (Lễ tân Sảnh chính)',
      phone: '0955667788',
      role: Role.STAFF_RECEPTIONIST,
    },
  });

  const tech2User = await prisma.user.upsert({
    where: { email: 'tech2@building.com' },
    update: { passwordHash: techPassword, role: Role.STAFF_TECHNICIAN },
    create: {
      email: 'tech2@building.com',
      passwordHash: techPassword,
      fullName: 'Nguyễn Văn Hùng (Kỹ thuật PCCC)',
      phone: '0945678901',
      role: Role.STAFF_TECHNICIAN,
    },
  });

  const security2User = await prisma.user.upsert({
    where: { email: 'security2@building.com' },
    update: { passwordHash: securityPassword, role: Role.STAFF_SECURITY },
    create: {
      email: 'security2@building.com',
      passwordHash: securityPassword,
      fullName: 'Trần Văn Cường (An ninh ca đêm)',
      phone: '0966778899',
      role: Role.STAFF_SECURITY,
    },
  });

  // Seed Staff Profiles
  console.log('--> Seeding Staff Profiles...');
  await prisma.staffProfile.upsert({
    where: { userId: techUser.id },
    update: {
      employeeCode: 'EMP-TECH-001',
      position: 'Kỹ thuật viên trưởng',
      department: 'Ban Kỹ thuật',
      currentShift: 'MORNING',
      assignedZone: 'Hệ thống Điện & Thang máy',
    },
    create: {
      userId: techUser.id,
      employeeCode: 'EMP-TECH-001',
      position: 'Kỹ thuật viên trưởng',
      department: 'Ban Kỹ thuật',
      currentShift: 'MORNING',
      assignedZone: 'Hệ thống Điện & Thang máy',
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: securityUser.id },
    update: {
      employeeCode: 'EMP-SEC-001',
      position: 'Đội trưởng An ninh',
      department: 'Đội An ninh & Bảo vệ',
      currentShift: 'AFTERNOON',
      assignedZone: 'Cổng chính & Hầm B1',
    },
    create: {
      userId: securityUser.id,
      employeeCode: 'EMP-SEC-001',
      position: 'Đội trưởng An ninh',
      department: 'Đội An ninh & Bảo vệ',
      currentShift: 'AFTERNOON',
      assignedZone: 'Cổng chính & Hầm B1',
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: receptionistUser.id },
    update: {
      employeeCode: 'EMP-REC-001',
      position: 'Lễ tân Sảnh chính',
      department: 'Tổ Lễ tân & CSKH',
      currentShift: 'MORNING',
      assignedZone: 'Sảnh chính Tòa A (Sky)',
    },
    create: {
      userId: receptionistUser.id,
      employeeCode: 'EMP-REC-001',
      position: 'Lễ tân Sảnh chính',
      department: 'Tổ Lễ tân & CSKH',
      currentShift: 'MORNING',
      assignedZone: 'Sảnh chính Tòa A (Sky)',
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: tech2User.id },
    update: {
      employeeCode: 'EMP-TECH-002',
      position: 'Kỹ thuật viên điện lạnh & PCCC',
      department: 'Ban Kỹ thuật',
      currentShift: 'NIGHT',
      assignedZone: 'Hệ thống PCCC & Cấp thoát nước',
    },
    create: {
      userId: tech2User.id,
      employeeCode: 'EMP-TECH-002',
      position: 'Kỹ thuật viên điện lạnh & PCCC',
      department: 'Ban Kỹ thuật',
      currentShift: 'NIGHT',
      assignedZone: 'Hệ thống PCCC & Cấp thoát nước',
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: security2User.id },
    update: {
      employeeCode: 'EMP-SEC-002',
      position: 'Nhân viên an ninh ca đêm',
      department: 'Đội An ninh & Bảo vệ',
      currentShift: 'NIGHT',
      assignedZone: 'Cổng phụ Tòa B & Bãi xe ngoài trời',
    },
    create: {
      userId: security2User.id,
      employeeCode: 'EMP-SEC-002',
      position: 'Nhân viên an ninh ca đêm',
      department: 'Đội An ninh & Bảo vệ',
      currentShift: 'NIGHT',
      assignedZone: 'Cổng phụ Tòa B & Bãi xe ngoài trời',
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

  // 10. Vehicles & Parking Cards
  console.log('--> Seeding Vehicles & Parking Cards...');
  interface SeedCard {
    cardCode: string;
    status: ParkingCardStatus;
    issuedAt?: Date;
    expiresAt?: Date;
    lockedAt?: Date;
    lockReason?: string;
  }

  const vehiclesData: Array<{
    licensePlate: string;
    type: VehicleType;
    brand: string;
    model: string | null;
    color: string | null;
    apartmentId: string;
    residentId: string | null;
    status: VehicleStatus;
    registrationDocumentUrl?: string;
    cards: SeedCard[];
  }> = [
    {
      licensePlate: '30A-999.88',
      type: VehicleType.CAR,
      brand: 'Mercedes-Benz',
      model: 'C200 Exclusive',
      color: 'Trắng',
      apartmentId: aptMap['A-1001'].id,
      residentId: residentProfileA1001.id,
      status: VehicleStatus.ACTIVE,
      registrationDocumentUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600',
      cards: [
        {
          cardCode: 'CARD-CAR-001',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2026-01-05'),
          expiresAt: new Date('2027-01-05'),
        },
      ],
    },
    {
      licensePlate: '29-G1 888.66',
      type: VehicleType.MOTORBIKE,
      brand: 'Honda',
      model: 'SH 150i ABS',
      color: 'Đen nhám',
      apartmentId: aptMap['A-1001'].id,
      residentId: residentProfileA1001.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-MOTO-001',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2026-01-05'),
          expiresAt: new Date('2027-01-05'),
        },
      ],
    },
    {
      licensePlate: '29-H2 334.55',
      type: VehicleType.ELECTRIC_BIKE,
      brand: 'VinFast',
      model: 'Klara S',
      color: 'Xanh dương',
      apartmentId: aptMap['A-1001'].id,
      residentId: residentProfileA1001_spouse.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-EBIKE-001',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2026-02-10'),
          expiresAt: new Date('2027-02-10'),
        },
      ],
    },
    {
      licensePlate: '29-AA 019.88',
      type: VehicleType.BICYCLE,
      brand: 'Giant',
      model: 'Escape 2 City Disc',
      color: 'Ghi xám',
      apartmentId: aptMap['A-1001'].id,
      residentId: residentProfileA1001.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-BIKE-001',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2026-01-05'),
          expiresAt: new Date('2027-01-05'),
        },
      ],
    },
    {
      licensePlate: '30H-123.45',
      type: VehicleType.CAR,
      brand: 'Toyota',
      model: 'Camry 2.5Q',
      color: 'Đen bóng',
      apartmentId: aptMap['A-1002'].id,
      residentId: residentProfileA1002.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-CAR-002',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2025-11-01'),
          expiresAt: new Date('2026-11-01'),
        },
      ],
    },
    {
      licensePlate: '29-E1 678.90',
      type: VehicleType.MOTORBIKE,
      brand: 'Honda',
      model: 'Air Blade 160',
      color: 'Xám xi măng',
      apartmentId: aptMap['A-1002'].id,
      residentId: residentProfileA1002.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-MOTO-002',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2025-11-01'),
          expiresAt: new Date('2026-11-01'),
        },
      ],
    },
    {
      licensePlate: '30K-456.78',
      type: VehicleType.CAR,
      brand: 'VinFast',
      model: 'VF8 Plus',
      color: 'Trắng ngọc trai',
      apartmentId: aptMap['A-1201'].id,
      residentId: null,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-CAR-003',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2026-03-01'),
          expiresAt: new Date('2027-03-01'),
        },
      ],
    },
    {
      licensePlate: '29-P1 999.11',
      type: VehicleType.MOTORBIKE,
      brand: 'Yamaha',
      model: 'Grande Hybrid',
      color: 'Trắng',
      apartmentId: aptMap['A-1201'].id,
      residentId: null,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-MOTO-003',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2026-03-01'),
          expiresAt: new Date('2027-03-01'),
        },
      ],
    },
    {
      licensePlate: '51H-555.22',
      type: VehicleType.CAR,
      brand: 'Mazda',
      model: 'CX-5 2.5 Signature',
      color: 'Đỏ pha lê',
      apartmentId: aptMap['B-2001'].id,
      residentId: residentProfileB2001.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-CAR-004',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2025-08-15'),
          expiresAt: new Date('2026-08-15'),
        },
      ],
    },
    {
      licensePlate: '59-B1 777.88',
      type: VehicleType.MOTORBIKE,
      brand: 'Piaggio',
      model: 'Vespa Sprint S 150',
      color: 'Vàng cát',
      apartmentId: aptMap['B-2001'].id,
      residentId: residentProfileB2001.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-MOTO-004-OLD',
          status: ParkingCardStatus.LOCKED,
          issuedAt: new Date('2025-08-15'),
          expiresAt: new Date('2026-08-15'),
          lockedAt: new Date('2026-08-01'),
          lockReason: 'Cư dân báo rơi mất thẻ vật lý, đã cấp đổi thẻ mới',
        },
        {
          cardCode: 'CARD-MOTO-004',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2026-08-03'),
          expiresAt: new Date('2027-08-03'),
        },
      ],
    },
    {
      licensePlate: '29-D2 456.12',
      type: VehicleType.MOTORBIKE,
      brand: 'Honda',
      model: 'Wave Alpha 110',
      color: 'Xanh ngọc',
      apartmentId: aptMap['B-2002'].id,
      residentId: residentProfileB2002.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-MOTO-005',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2025-09-15'),
          expiresAt: new Date('2026-09-15'),
        },
      ],
    },
    {
      licensePlate: '30F-889.90',
      type: VehicleType.CAR,
      brand: 'Hyundai',
      model: 'Tucson 2.0 AT',
      color: 'Đen',
      apartmentId: aptMap['B-2002'].id,
      residentId: residentProfileB2002.id,
      status: VehicleStatus.INACTIVE,
      cards: [
        {
          cardCode: 'CARD-CAR-005',
          status: ParkingCardStatus.LOCKED,
          issuedAt: new Date('2025-09-15'),
          expiresAt: new Date('2026-09-15'),
          lockedAt: new Date('2026-07-20'),
          lockReason: 'Chủ phương tiện đã bán xe, tạm dừng dịch vụ gửi xe',
        },
      ],
    },
    {
      licensePlate: '29-K1 223.34',
      type: VehicleType.MOTORBIKE,
      brand: 'Honda',
      model: 'Lead 125',
      color: 'Nâu be',
      apartmentId: aptMap['C-0501'].id,
      residentId: residentProfileC0501.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-MOTO-006',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2025-10-01'),
          expiresAt: new Date('2026-10-01'),
        },
      ],
    },
    {
      licensePlate: '30G-332.11',
      type: VehicleType.CAR,
      brand: 'Ford',
      model: 'Everest Titanium 4x2',
      color: 'Bạc',
      apartmentId: aptMap['C-0501'].id,
      residentId: residentProfileC0501.id,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-CAR-006',
          status: ParkingCardStatus.EXPIRED,
          issuedAt: new Date('2025-09-01'),
          expiresAt: new Date('2026-08-31'),
        },
      ],
    },
    {
      licensePlate: '29-M1 987.65',
      type: VehicleType.MOTORBIKE,
      brand: 'Yamaha',
      model: 'Exciter 155 VVA',
      color: 'Xanh GP',
      apartmentId: aptMap['C-0502'].id,
      residentId: null,
      status: VehicleStatus.ACTIVE,
      cards: [
        {
          cardCode: 'CARD-MOTO-007',
          status: ParkingCardStatus.ACTIVE,
          issuedAt: new Date('2026-01-15'),
          expiresAt: new Date('2027-01-15'),
        },
      ],
    },
    {
      licensePlate: '30L-678.99',
      type: VehicleType.CAR,
      brand: 'VinFast',
      model: 'VF9 Eco',
      color: 'Xám',
      apartmentId: aptMap['C-0502'].id,
      residentId: null,
      status: VehicleStatus.PENDING_APPROVAL,
      cards: [
        {
          cardCode: 'CARD-CAR-007',
          status: ParkingCardStatus.PENDING,
        },
      ],
    },
    {
      licensePlate: '29-X5 112.23',
      type: VehicleType.MOTORBIKE,
      brand: 'Honda',
      model: 'Vision 110',
      color: 'Đỏ đô',
      apartmentId: aptMap['C-0602'].id,
      residentId: null,
      status: VehicleStatus.PENDING_APPROVAL,
      cards: [
        {
          cardCode: 'CARD-MOTO-008',
          status: ParkingCardStatus.PENDING,
        },
      ],
    },
    {
      licensePlate: '30E-999.00',
      type: VehicleType.CAR,
      brand: 'Kia',
      model: 'Carnival Signature',
      color: 'Trắng',
      apartmentId: aptMap['C-0602'].id,
      residentId: null,
      status: VehicleStatus.REJECTED,
      cards: [],
    },
  ];

  for (const v of vehiclesData) {
    const { cards, ...vehicleData } = v;
    const vehicle = await prisma.vehicle.upsert({
      where: { licensePlate: vehicleData.licensePlate },
      update: {
        type: vehicleData.type,
        brand: vehicleData.brand,
        model: vehicleData.model,
        color: vehicleData.color,
        apartmentId: vehicleData.apartmentId,
        residentId: vehicleData.residentId,
        status: vehicleData.status,
        registrationDocumentUrl: vehicleData.registrationDocumentUrl || null,
      },
      create: vehicleData,
    });

    for (const card of cards) {
      await prisma.parkingCard.upsert({
        where: { cardCode: card.cardCode },
        update: {
          vehicleId: vehicle.id,
          status: card.status,
          issuedAt: card.issuedAt || null,
          expiresAt: card.expiresAt || null,
          lockedAt: (card as any).lockedAt || null,
          lockReason: (card as any).lockReason || null,
        },
        create: {
          cardCode: card.cardCode,
          vehicleId: vehicle.id,
          status: card.status,
          issuedAt: card.issuedAt || null,
          expiresAt: card.expiresAt || null,
          lockedAt: (card as any).lockedAt || null,
          lockReason: (card as any).lockReason || null,
        },
      });
    }
  }

  // 11. Building Assets & Preventive Maintenance
  console.log('--> Seeding Building Assets & Preventive Maintenance...');
  const buildingRef = await prisma.building.findFirst();

  const elevator1 = await prisma.asset.upsert({
    where: { code: 'AST-ELEV-001' },
    update: {},
    create: {
      code: 'AST-ELEV-001',
      name: 'Thang máy Tải khách số 1 - Tòa A (Sky)',
      category: AssetCategory.ELEVATOR,
      buildingId: buildingRef?.id || null,
      location: 'Tòa A (Sky) - Trục 1',
      supplier: 'Schindler Việt Nam',
      installDate: new Date('2024-03-15'),
      warrantyExpiry: new Date('2027-03-15'),
      status: AssetStatus.OPERATIONAL,
      description: 'Thang máy tải trọng 1000kg, tốc độ 2.5m/s, 25 điểm dừng',
      documents: ['https://schindler.com/manual-ast-elev-001.pdf'],
      images: ['https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=600'],
    },
  });

  const generator1 = await prisma.asset.upsert({
    where: { code: 'AST-GEN-001' },
    update: {},
    create: {
      code: 'AST-GEN-001',
      name: 'Máy phát điện dự phòng Cummins 1500kVA',
      category: AssetCategory.GENERATOR,
      buildingId: buildingRef?.id || null,
      location: 'Tầng hầm B2 - Phòng nguồn',
      supplier: 'Cummins Power Generation VN',
      installDate: new Date('2023-11-20'),
      warrantyExpiry: new Date('2026-11-20'),
      status: AssetStatus.MAINTENANCE,
      description: 'Máy phát điện công suất 1500kVA dự phòng cấp điện toàn bộ tòa nhà khi mất lưới',
      documents: ['https://cummins.com/doc-1500kva.pdf'],
      images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
    },
  });

  const pump1 = await prisma.asset.upsert({
    where: { code: 'AST-PUMP-001' },
    update: {},
    create: {
      code: 'AST-PUMP-001',
      name: 'Cụm máy bơm tăng áp sinh hoạt Ebara',
      category: AssetCategory.WATER_PUMP,
      buildingId: buildingRef?.id || null,
      location: 'Phòng kỹ thuật nước Tầng hầm B1',
      supplier: 'Ebara Pumps Vietnam',
      installDate: new Date('2024-01-10'),
      warrantyExpiry: new Date('2027-01-10'),
      status: AssetStatus.OPERATIONAL,
      description: 'Cụm 3 bơm biến tần duy trì áp lực nước 4.5 bar cho các tầng cao',
      images: ['https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600'],
    },
  });

  const barrier1 = await prisma.asset.upsert({
    where: { code: 'AST-BAR-001' },
    update: {},
    create: {
      code: 'AST-BAR-001',
      name: 'Barie tự động lối vào bãi đỗ xe Hầm B1',
      category: AssetCategory.BARRIER,
      buildingId: buildingRef?.id || null,
      location: 'Cổng kiểm soát xe Hầm B1',
      supplier: 'BFT Automation Italy',
      installDate: new Date('2024-05-01'),
      warrantyExpiry: new Date('2026-05-01'),
      status: AssetStatus.BROKEN,
      description: 'Cần barie dài 3.5m, tích hợp đầu đọc thẻ RFID tầm xa',
    },
  });

  const fireAlarm1 = await prisma.asset.upsert({
    where: { code: 'AST-FIRE-001' },
    update: {},
    create: {
      code: 'AST-FIRE-001',
      name: 'Tủ trung tâm báo cháy địa chỉ Hochiki FireNET',
      category: AssetCategory.FIRE_ALARM,
      buildingId: buildingRef?.id || null,
      location: 'Phòng điều hành an ninh Tầng 1',
      supplier: 'Hochiki Corp',
      installDate: new Date('2023-09-10'),
      warrantyExpiry: new Date('2026-09-10'),
      status: AssetStatus.OPERATIONAL,
      description: 'Hệ thống báo cháy địa chỉ 4 loop quản lý 500 đầu báo khói nhiệt',
    },
  });

  // Link first Feedback to Elevator 1 to showcase reactive integration!
  const firstFeedback = await prisma.feedback.findFirst();
  if (firstFeedback) {
    await prisma.feedback.update({
      where: { id: firstFeedback.id },
      data: { assetId: elevator1.id },
    });
  }

  // Seed Maintenance Schedules
  // 1. Upcoming in 2 days (<= 3 days -> Smart Alert WARNING!)
  const sch1 = await prisma.maintenanceSchedule.upsert({
    where: { code: 'SCH-2026-001' },
    update: {},
    create: {
      code: 'SCH-2026-001',
      assetId: elevator1.id,
      title: 'Kiểm định định kỳ cáp tải & thắng cơ an toàn',
      cycle: MaintenanceCycle.MONTHLY,
      lastMaintenance: new Date(Date.now() - 28 * 86400000),
      nextMaintenance: new Date(Date.now() + 2 * 86400000), // In 2 days!
      vendor: 'Schindler Việt Nam + Kỹ thuật tòa nhà',
      technicianId: techUser.id,
      status: MaintenanceStatus.PENDING,
      notes: 'Kiểm tra độ võng cáp, mòn puly và thử thả rơi thắng cơ',
    },
  });

  // 2. Overdue by 2 days (Trigger HIGH PRIORITY ALERT CRITICAL!)
  const sch2 = await prisma.maintenanceSchedule.upsert({
    where: { code: 'SCH-2026-002' },
    update: {},
    create: {
      code: 'SCH-2026-002',
      assetId: generator1.id,
      title: 'Chạy thử tải có hòa đồng bộ & thay lọc dầu nhớt',
      cycle: MaintenanceCycle.MONTHLY,
      lastMaintenance: new Date(Date.now() - 32 * 86400000),
      nextMaintenance: new Date(Date.now() - 2 * 86400000), // 2 days ago (OVERDUE!)
      vendor: 'Đội Kỹ thuật Tòa nhà',
      technicianId: techUser.id,
      status: MaintenanceStatus.OVERDUE,
      notes: 'Kiểm tra ắc quy đề nổ, mức dầu diesel và chạy thử tải 30 phút',
    },
  });

  // 3. Due tomorrow (<= 3 days)
  await prisma.maintenanceSchedule.upsert({
    where: { code: 'SCH-2026-003' },
    update: {},
    create: {
      code: 'SCH-2026-003',
      assetId: pump1.id,
      title: 'Kiểm tra rò rỉ van một chiều và căn chỉnh khớp nối mềm',
      cycle: MaintenanceCycle.WEEKLY,
      lastMaintenance: new Date(Date.now() - 6 * 86400000),
      nextMaintenance: new Date(Date.now() + 1 * 86400000), // Tomorrow!
      vendor: 'Đội Kỹ thuật Tòa nhà',
      technicianId: tech2User.id,
      status: MaintenanceStatus.PENDING,
      notes: 'Đo dòng khởi động động cơ bơm P1, P2',
    },
  });

  // 4. Completed Work Order for Elevator 1
  await prisma.workOrder.upsert({
    where: { code: 'WO-2026-001' },
    update: {},
    create: {
      code: 'WO-2026-001',
      scheduleId: sch1.id,
      assetId: elevator1.id,
      technicianId: techUser.id,
      title: 'Bảo dưỡng định kỳ tháng 8 thang máy TM-01',
      description: 'Đã hoàn tất bôi trơn ray và kiểm tra hệ thống cứu hộ tự động',
      findings: 'Thang hoạt động êm ái, các tiếp điểm cửa buồng thang tốt',
      cost: 1500000,
      status: MaintenanceStatus.COMPLETED,
      completedAt: new Date(Date.now() - 28 * 86400000),
    },
  });

  // 5. In-progress Work Order for Barrier
  await prisma.workOrder.upsert({
    where: { code: 'WO-2026-002' },
    update: {},
    create: {
      code: 'WO-2026-002',
      assetId: barrier1.id,
      technicianId: techUser.id,
      title: 'Xử lý sự cố cần barie hầm B1 bị kẹt motor',
      description: 'Tháo kiểm tra hộp số và căn chỉnh cảm biến hành trình',
      status: MaintenanceStatus.IN_PROGRESS,
    },
  });

  // 12. Facilities & Bookings
  console.log('--> Seeding Facilities & Bookings...');
  const pool = await prisma.facility.upsert({
    where: { id: 'fac-swimming-pool' },
    update: {},
    create: {
      id: 'fac-swimming-pool',
      name: 'Hồ bơi vô cực 4 mùa chân mây',
      type: FacilityType.SWIMMING_POOL,
      description: 'Hệ thống điện phân muối khoáng, nước ấm mùa đông, có cứu hộ trực 100% thời gian.',
      location: 'Tầng 5 - Tháp Sky Oasis',
      openTime: '06:00',
      closeTime: '21:00',
      slotDuration: 60,
      maxUsers: 25,
      fee: 0,
      status: FacilityStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80'],
      rules: '- Cư dân xuất trình thẻ cư dân hoặc mã đặt chỗ trước khi vào bể.\n- Bắt buộc mặc đồ bơi chuyên dụng.\n- Trẻ em dưới 12 tuổi phải có người lớn đi cùng.\n- Không mang thức ăn, đồ uống có cồn vào khu vực hồ bơi.',
    },
  });

  const gym = await prisma.facility.upsert({
    where: { id: 'fac-gym-fitness' },
    update: {},
    create: {
      id: 'fac-gym-fitness',
      name: 'Phòng Gym & Yoga Quốc tế TechnoGym',
      type: FacilityType.GYM,
      description: 'Trang thiết bị TechnoGym nhập khẩu Ý hiện đại, phòng tập Yoga sàn gỗ tự nhiên.',
      location: 'Tầng 4 - Tháp Ocean',
      openTime: '05:30',
      closeTime: '22:00',
      slotDuration: 60,
      maxUsers: 20,
      fee: 0,
      status: FacilityStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'],
      rules: '- Đi giày thể thao sạch và mang khăn tập cá nhân.\n- Thu dọn tạ về đúng vị trí sau khi tập.\n- Không gây ồn ào và nhường thiết bị khi đông người.',
    },
  });

  const bbq = await prisma.facility.upsert({
    where: { id: 'fac-bbq-garden' },
    update: {},
    create: {
      id: 'fac-bbq-garden',
      name: 'Vườn nướng BBQ Sky Garden (Chòi số 1)',
      type: FacilityType.BBQ_AREA,
      description: 'Bếp nướng điện âm bàn thông minh, bồn rửa inox và bàn tiệc 12 người nhìn ra thành phố.',
      location: 'Sân thượng Sky Garden - Tầng 26',
      openTime: '10:00',
      closeTime: '22:00',
      slotDuration: 120,
      maxUsers: 1,
      fee: 200000,
      status: FacilityStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
      rules: '- Đặt trước tối thiểu 4 tiếng để BQL chuẩn bị nguồn điện và bếp nướng.\n- Giữ gìn vệ sinh chung, dọn dẹp thức ăn thừa sau khi sử dụng.\n- Không đốt than củi hoặc chất gây cháy nổ, chỉ sử dụng bếp điện được trang bị sẵn.\n- Kết thúc tiệc trước 22:00 để đảm bảo sự yên tĩnh cho cư dân.',
    },
  });

  const communityRoom = await prisma.facility.upsert({
    where: { id: 'fac-community-room' },
    update: {},
    create: {
      id: 'fac-community-room',
      name: 'Phòng Sinh hoạt Cộng đồng đa năng',
      type: FacilityType.COMMUNITY_ROOM,
      description: 'Không gian tổ chức sinh nhật, hội thảo nhỏ, máy chiếu độ nét cao và dàn âm thanh hội nghị.',
      location: 'Tầng 1 - Sảnh chính Tháp Sky',
      openTime: '08:00',
      closeTime: '21:30',
      slotDuration: 120,
      maxUsers: 1,
      fee: 0,
      status: FacilityStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'],
      rules: '- Đăng ký trước 24h đối với sự kiện trên 20 người.\n- Giữ gìn trang thiết bị âm thanh, máy chiếu.\n- Nghiêm cấm tổ chức các hoạt động thương mại hoặc vi phạm pháp luật.',
    },
  });

  const tennisCourt = await prisma.facility.upsert({
    where: { id: 'fac-sports-court' },
    update: {},
    create: {
      id: 'fac-sports-court',
      name: 'Sân Pickleball & Tennis tiêu chuẩn',
      type: FacilityType.SPORTS_COURT,
      description: 'Mặt sân giảm chấn acrylic 5 lớp chuẩn thi đấu, giàn đèn LED chống chói 500 Lux.',
      location: 'Sân thượng Tháp Sky - Tầng mái',
      openTime: '06:00',
      closeTime: '22:00',
      slotDuration: 60,
      maxUsers: 1,
      fee: 80000,
      status: FacilityStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80'],
      rules: '- Chỉ đi giày thể thao đế kếp / không để lại vệt đen trên mặt sân.\n- Tôn trọng lượt đặt và rời sân đúng giờ khi hết khung giờ.',
    },
  });

  const meetingRoom = await prisma.facility.upsert({
    where: { id: 'fac-meeting-room' },
    update: {},
    create: {
      id: 'fac-meeting-room',
      name: 'Phòng họp & Co-working Cư dân',
      type: FacilityType.MEETING_ROOM,
      description: 'Bàn họp 10 chỗ, màn hình TV 75 inch kết nối không dây, bảng viết kính từ tính.',
      location: 'Tầng 2 - Khu thương mại dịch vụ',
      openTime: '08:00',
      closeTime: '20:00',
      slotDuration: 60,
      maxUsers: 1,
      fee: 50000,
      status: FacilityStatus.ACTIVE,
      images: ['https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80'],
      rules: '- Thích hợp làm việc yên tĩnh và họp nhóm.\n- Tắt thiết bị điện trước khi rời phòng.',
    },
  });

  // Seed sample bookings
  const todayStr = new Date().toISOString().split('T')[0];
  const startTodayBBQ = new Date(`${todayStr}T18:00:00.000Z`);
  const endTodayBBQ = new Date(`${todayStr}T20:00:00.000Z`);

  await prisma.facilityBooking.upsert({
    where: { bookingCode: 'BK-2026-001' },
    update: {},
    create: {
      bookingCode: 'BK-2026-001',
      facilityId: bbq.id,
      userId: residentUser.id,
      residentId: residentProfileA1001.id,
      apartmentId: aptMap['A-1001'].id,
      bookingDate: new Date(`${todayStr}T00:00:00.000Z`),
      startTime: '18:00',
      endTime: '20:00',
      startTimeDate: startTodayBBQ,
      endTimeDate: endTodayBBQ,
      numberOfUsers: 6,
      totalFee: 200000,
      status: BookingStatus.CONFIRMED,
      notes: 'Tiệc sinh nhật gia đình 6 người',
    },
  });

  const startTodayGym = new Date(`${todayStr}T07:00:00.000Z`);
  const endTodayGym = new Date(`${todayStr}T08:00:00.000Z`);

  await prisma.facilityBooking.upsert({
    where: { bookingCode: 'BK-2026-002' },
    update: {},
    create: {
      bookingCode: 'BK-2026-002',
      facilityId: gym.id,
      userId: residentUser.id,
      residentId: residentProfileA1001.id,
      apartmentId: aptMap['A-1001'].id,
      bookingDate: new Date(`${todayStr}T00:00:00.000Z`),
      startTime: '07:00',
      endTime: '08:00',
      startTimeDate: startTodayGym,
      endTimeDate: endTodayGym,
      numberOfUsers: 1,
      totalFee: 0,
      status: BookingStatus.COMPLETED,
      notes: 'Tập cardio buổi sáng',
    },
  });

  // 13. Visitor Passes & Access
  console.log('--> Seeding Visitor Passes...');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayDateOnly = new Date(`${todayStr}T00:00:00.000Z`);

  await prisma.visitorPass.upsert({
    where: { passCode: 'VP-2026-0001' },
    update: {},
    create: {
      passCode: 'VP-2026-0001',
      qrCode: 'QR-PASS-2026-0001-A1001',
      visitorName: 'Nguyễn Văn B (Bạn thân)',
      visitorPhone: '0912888999',
      visitDate: todayDateOnly,
      expectedTime: '19:00 - 22:00',
      licensePlate: '29B1-888.99',
      note: 'Khách ghé ăn tối gia đình',
      status: VisitorStatus.PENDING,
      apartmentId: aptMap['A-1001'].id,
      residentId: residentProfileA1001.id,
      createdById: residentUser.id,
    },
  });

  await prisma.visitorPass.upsert({
    where: { passCode: 'VP-2026-0002' },
    update: {},
    create: {
      passCode: 'VP-2026-0002',
      qrCode: 'QR-PASS-2026-0002-A1001',
      visitorName: 'Trần Thị Mai (Người thân)',
      visitorPhone: '0988112233',
      visitDate: todayDateOnly,
      expectedTime: '14:00 - 18:00',
      licensePlate: '30F2-123.45',
      note: 'Lên thăm gia đình',
      status: VisitorStatus.CHECKED_IN,
      checkInAt: new Date(Date.now() - 45 * 60 * 1000),
      checkedInById: securityUser.id,
      apartmentId: aptMap['A-1001'].id,
      residentId: residentProfileA1001.id,
      createdById: residentUser.id,
    },
  });

  await prisma.visitorPass.upsert({
    where: { passCode: 'VP-2026-0003' },
    update: {},
    create: {
      passCode: 'VP-2026-0003',
      qrCode: 'QR-PASS-2026-0003-A1001',
      visitorName: 'Shipper TikiNow (Giao hàng)',
      visitorPhone: '0977665544',
      visitDate: new Date(yesterday.toISOString().split('T')[0] + 'T00:00:00.000Z'),
      expectedTime: '10:00 - 11:00',
      licensePlate: '29A-666.88',
      note: 'Giao kiện hàng điện máy',
      status: VisitorStatus.CHECKED_OUT,
      checkInAt: new Date(yesterday.getTime() + 10 * 3600000 + 15 * 60000),
      checkOutAt: new Date(yesterday.getTime() + 10 * 3600000 + 40 * 60000),
      checkedInById: securityUser.id,
      checkedOutById: securityUser.id,
      apartmentId: aptMap['A-1001'].id,
      residentId: residentProfileA1001.id,
      createdById: residentUser.id,
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
