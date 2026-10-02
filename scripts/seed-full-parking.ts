import {
  PrismaClient,
  SlotVehicleType,
  ParkingSlotStatus,
  ParkingRequestStatus,
  ParkingAssignmentStatus,
  ParkingLogDirection,
  ParkingLogStatus,
  VehicleType,
} from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCompleteParkingData() {
  console.log('🅿️  Starting Full Smart Parking Data Seeding (B1, B2, B3, OUTDOOR)...');

  const building = await prisma.building.findFirst();
  if (!building) {
    console.error('❌ No building found to seed parking into!');
    return;
  }

  // 1. Create or ensure all 4 Parking Areas
  console.log('--> Ensuring Parking Areas for building:', building.name);

  const areaB1 = await prisma.parkingArea.upsert({
    where: { buildingId_code: { buildingId: building.id, code: 'B1' } },
    update: {
      name: 'Tầng hầm B1 (Khu đỗ chính)',
      floor: -1,
      totalCapacity: 40,
      description: 'Hầm gửi xe ô tô và xe máy thường trú, trạm sạc điện EV thông minh',
      isActive: true,
    },
    create: {
      buildingId: building.id,
      code: 'B1',
      name: 'Tầng hầm B1 (Khu đỗ chính)',
      floor: -1,
      totalCapacity: 40,
      description: 'Hầm gửi xe ô tô và xe máy thường trú, trạm sạc điện EV thông minh',
      isActive: true,
    },
  });

  const areaB2 = await prisma.parkingArea.upsert({
    where: { buildingId_code: { buildingId: building.id, code: 'B2' } },
    update: {
      name: 'Tầng hầm B2 (Khu mở rộng & Dài hạn)',
      floor: -2,
      totalCapacity: 25,
      description: 'Hầm gửi xe ô tô dài hạn cho cư dân và trạm sạc EV mở rộng',
      isActive: true,
    },
    create: {
      buildingId: building.id,
      code: 'B2',
      name: 'Tầng hầm B2 (Khu mở rộng & Dài hạn)',
      floor: -2,
      totalCapacity: 25,
      description: 'Hầm gửi xe ô tô dài hạn cho cư dân và trạm sạc EV mở rộng',
      isActive: true,
    },
  });

  const areaB3 = await prisma.parkingArea.upsert({
    where: { buildingId_code: { buildingId: building.id, code: 'B3' } },
    update: {
      name: 'Tầng hầm B3 (Kỹ thuật & Dự phòng)',
      floor: -3,
      totalCapacity: 20,
      description: 'Khu vực đỗ xe dự phòng, trạm bảo dưỡng kỹ thuật và xe máy nhân viên',
      isActive: true,
    },
    create: {
      buildingId: building.id,
      code: 'B3',
      name: 'Tầng hầm B3 (Kỹ thuật & Dự phòng)',
      floor: -3,
      totalCapacity: 20,
      description: 'Khu vực đỗ xe dự phòng, trạm bảo dưỡng kỹ thuật và xe máy nhân viên',
      isActive: true,
    },
  });

  const areaOutdoor = await prisma.parkingArea.upsert({
    where: { buildingId_code: { buildingId: building.id, code: 'OUTDOOR' } },
    update: {
      name: 'Bãi đỗ ngoài trời & Khách vãng lai',
      floor: 0,
      totalCapacity: 18,
      description: 'Khu vực đón tiếp xe taxi, xe công nghệ, khách ghé thăm ngắn hạn và trạm sạc Solar EV',
      isActive: true,
    },
    create: {
      buildingId: building.id,
      code: 'OUTDOOR',
      name: 'Bãi đỗ ngoài trời & Khách vãng lai',
      floor: 0,
      totalCapacity: 18,
      description: 'Khu vực đón tiếp xe taxi, xe công nghệ, khách ghé thăm ngắn hạn và trạm sạc Solar EV',
      isActive: true,
    },
  });

  // 2. SEED B1 ZONES & SLOTS (Matching Figma P01 - P20, A-01, A-02, EV-01..EV-03, M01..M06)
  console.log('--> Seeding B1 Zones & Slots...');
  const b1ZoneA = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB1.id, code: 'ZONE-A' } },
    update: { name: 'Khu A - Ô tô & Suất ưu tiên', vehicleType: VehicleType.CAR, colorHex: '#0F6B4F', totalSlots: 11 },
    create: {
      areaId: areaB1.id,
      code: 'ZONE-A',
      name: 'Khu A - Ô tô & Suất ưu tiên',
      vehicleType: VehicleType.CAR,
      colorHex: '#0F6B4F',
      totalSlots: 11,
    },
  });

  const b1ZoneB = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB1.id, code: 'ZONE-B' } },
    update: { name: 'Khu B - Ô tô tiêu chuẩn', vehicleType: VehicleType.CAR, colorHex: '#22C55E', totalSlots: 11 },
    create: {
      areaId: areaB1.id,
      code: 'ZONE-B',
      name: 'Khu B - Ô tô tiêu chuẩn',
      vehicleType: VehicleType.CAR,
      colorHex: '#22C55E',
      totalSlots: 11,
    },
  });

  const b1ZoneEV = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB1.id, code: 'ZONE-EV' } },
    update: { name: 'Trạm sạc nhanh EV 22kW', vehicleType: VehicleType.CAR, colorHex: '#0F6B4F', totalSlots: 3 },
    create: {
      areaId: areaB1.id,
      code: 'ZONE-EV',
      name: 'Trạm sạc nhanh EV 22kW',
      vehicleType: VehicleType.CAR,
      colorHex: '#0F6B4F',
      totalSlots: 3,
    },
  });

  const b1ZoneMoto = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB1.id, code: 'ZONE-MOTO' } },
    update: { name: 'Khu xe máy & Xe điện 2 bánh', vehicleType: VehicleType.MOTORBIKE, colorHex: '#64748B', totalSlots: 6 },
    create: {
      areaId: areaB1.id,
      code: 'ZONE-MOTO',
      name: 'Khu xe máy & Xe điện 2 bánh',
      vehicleType: VehicleType.MOTORBIKE,
      colorHex: '#64748B',
      totalSlots: 6,
    },
  });

  // B1 Slots matching Figma
  const b1SlotsData = [
    // Zone A
    { code: 'P01', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id, note: 'Biển số: 30F-123.45' },
    { code: 'P02', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id },
    { code: 'P03', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id },
    { code: 'P04', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id, note: 'Biển số: 29A-567.89' },
    { code: 'P05', status: ParkingSlotStatus.RESERVED, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id, note: 'Đã cấp cho Căn hộ 12A' },
    { code: 'A-01', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.DISABLED, zoneId: b1ZoneA.id, note: 'Suất đỗ người khuyết tật' },
    { code: 'P06', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id },
    { code: 'P07', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id },
    { code: 'P08', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id, note: 'Biển số: 51H-901.23' },
    { code: 'P09', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id, note: 'Biển số: 30E-345.67' },
    { code: 'P10', status: ParkingSlotStatus.RESERVED, type: SlotVehicleType.CAR, zoneId: b1ZoneA.id, note: 'Đã cấp cho Căn hộ 8B' },
    // Zone B
    { code: 'P11', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id, note: 'Biển số: 29C-789.01' },
    { code: 'P12', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id },
    { code: 'P13', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id },
    { code: 'P14', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id, note: 'Biển số: 30G-234.56' },
    { code: 'P15', status: ParkingSlotStatus.BLOCKED, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id, note: 'Tạm khóa bảo dưỡng mặt sàn' },
    { code: 'A-02', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.DISABLED, zoneId: b1ZoneB.id, note: 'Biển số: 29D-456.78 (Ưu tiên)' },
    { code: 'P16', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id },
    { code: 'P17', status: ParkingSlotStatus.RESERVED, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id, note: 'Đã cấp cho Căn hộ 3C' },
    { code: 'P18', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id, note: 'Biển số: 51K-678.90' },
    { code: 'P19', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id },
    { code: 'P20', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b1ZoneB.id, note: 'Biển số: 30H-012.34' },
    // Zone EV
    { code: 'EV-01', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.EV, zoneId: b1ZoneEV.id, note: 'Trạm sạc nhanh EV 22kW' },
    { code: 'EV-02', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.EV, zoneId: b1ZoneEV.id, note: 'Trạm sạc nhanh EV 22kW' },
    { code: 'EV-03', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.EV, zoneId: b1ZoneEV.id, note: 'Trạm sạc nhanh EV 22kW' },
    // Zone Moto
    { code: 'M01', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.MOTORBIKE, zoneId: b1ZoneMoto.id, note: 'Biển số: 29B1-111.11' },
    { code: 'M02', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.MOTORBIKE, zoneId: b1ZoneMoto.id },
    { code: 'M03', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.MOTORBIKE, zoneId: b1ZoneMoto.id },
    { code: 'M04', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.MOTORBIKE, zoneId: b1ZoneMoto.id, note: 'Biển số: 29B1-222.22' },
    { code: 'M05', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.MOTORBIKE, zoneId: b1ZoneMoto.id },
    { code: 'M06', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.MOTORBIKE, zoneId: b1ZoneMoto.id, note: 'Biển số: 29B1-333.33' },
  ];

  for (const s of b1SlotsData) {
    await prisma.parkingSlot.upsert({
      where: { areaId_code: { areaId: areaB1.id, code: s.code } },
      update: { status: s.status, type: s.type, zoneId: s.zoneId, note: s.note, floor: -1 },
      create: {
        areaId: areaB1.id,
        zoneId: s.zoneId,
        code: s.code,
        status: s.status,
        type: s.type,
        floor: -1,
        note: s.note,
        isReservable: s.status === ParkingSlotStatus.AVAILABLE,
        isActive: true,
      },
    });
  }

  // 3. SEED B2 ZONES & SLOTS (Figma P21 - P30, A-03, EV-04..EV-05, M07..M09)
  console.log('--> Seeding B2 Zones & Slots...');
  const b2ZoneA = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB2.id, code: 'B2-ZONE-A' } },
    update: { name: 'Khu A - Ô tô cư dân định danh', vehicleType: VehicleType.CAR, colorHex: '#0F6B4F', totalSlots: 6 },
    create: {
      areaId: areaB2.id,
      code: 'B2-ZONE-A',
      name: 'Khu A - Ô tô cư dân định danh',
      vehicleType: VehicleType.CAR,
      colorHex: '#0F6B4F',
      totalSlots: 6,
    },
  });

  const b2ZoneB = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB2.id, code: 'B2-ZONE-B' } },
    update: { name: 'Khu B - Ô tô dài hạn', vehicleType: VehicleType.CAR, colorHex: '#22C55E', totalSlots: 5 },
    create: {
      areaId: areaB2.id,
      code: 'B2-ZONE-B',
      name: 'Khu B - Ô tô dài hạn',
      vehicleType: VehicleType.CAR,
      colorHex: '#22C55E',
      totalSlots: 5,
    },
  });

  const b2ZoneEV = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB2.id, code: 'B2-ZONE-EV' } },
    update: { name: 'Trạm sạc EV B2', vehicleType: VehicleType.CAR, colorHex: '#0F6B4F', totalSlots: 2 },
    create: {
      areaId: areaB2.id,
      code: 'B2-ZONE-EV',
      name: 'Trạm sạc EV B2',
      vehicleType: VehicleType.CAR,
      colorHex: '#0F6B4F',
      totalSlots: 2,
    },
  });

  const b2ZoneMoto = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB2.id, code: 'B2-ZONE-MOTO' } },
    update: { name: 'Khu xe máy mở rộng', vehicleType: VehicleType.MOTORBIKE, colorHex: '#64748B', totalSlots: 3 },
    create: {
      areaId: areaB2.id,
      code: 'B2-ZONE-MOTO',
      name: 'Khu xe máy mở rộng',
      vehicleType: VehicleType.MOTORBIKE,
      colorHex: '#64748B',
      totalSlots: 3,
    },
  });

  const b2SlotsData = [
    { code: 'P21', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b2ZoneA.id },
    { code: 'P22', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b2ZoneA.id, note: 'Biển số: 30A-111.11' },
    { code: 'P23', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b2ZoneA.id },
    { code: 'P24', status: ParkingSlotStatus.RESERVED, type: SlotVehicleType.CAR, zoneId: b2ZoneA.id, note: 'Đã cấp cho Căn hộ 15D' },
    { code: 'P25', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b2ZoneA.id, note: 'Biển số: 51F-222.22' },
    { code: 'A-03', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.DISABLED, zoneId: b2ZoneA.id, note: 'Suất đỗ ưu tiên B2' },
    { code: 'P26', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b2ZoneB.id },
    { code: 'P27', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b2ZoneB.id },
    { code: 'P28', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b2ZoneB.id, note: 'Biển số: 29H-333.33' },
    { code: 'P29', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b2ZoneB.id },
    { code: 'P30', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b2ZoneB.id, note: 'Biển số: 30K-444.44' },
    { code: 'EV-04', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.EV, zoneId: b2ZoneEV.id, note: 'Trạm sạc EV 22kW B2' },
    { code: 'EV-05', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.EV, zoneId: b2ZoneEV.id, note: 'Trạm sạc EV 22kW B2' },
    { code: 'M07', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.MOTORBIKE, zoneId: b2ZoneMoto.id },
    { code: 'M08', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.MOTORBIKE, zoneId: b2ZoneMoto.id, note: 'Biển số: 29B1-555.55' },
    { code: 'M09', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.MOTORBIKE, zoneId: b2ZoneMoto.id },
  ];

  for (const s of b2SlotsData) {
    await prisma.parkingSlot.upsert({
      where: { areaId_code: { areaId: areaB2.id, code: s.code } },
      update: { status: s.status, type: s.type, zoneId: s.zoneId, note: s.note, floor: -2 },
      create: {
        areaId: areaB2.id,
        zoneId: s.zoneId,
        code: s.code,
        status: s.status,
        type: s.type,
        floor: -2,
        note: s.note,
        isReservable: s.status === ParkingSlotStatus.AVAILABLE,
        isActive: true,
      },
    });
  }

  // 4. SEED B3 ZONES & SLOTS (Figma P31 - P40, A-04, EV-06, M10..M11)
  console.log('--> Seeding B3 Zones & Slots...');
  const b3ZoneA = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB3.id, code: 'B3-ZONE-A' } },
    update: { name: 'Khu A - Ô tô kỹ thuật & Lưu xe', vehicleType: VehicleType.CAR, colorHex: '#0F6B4F', totalSlots: 6 },
    create: {
      areaId: areaB3.id,
      code: 'B3-ZONE-A',
      name: 'Khu A - Ô tô kỹ thuật & Lưu xe',
      vehicleType: VehicleType.CAR,
      colorHex: '#0F6B4F',
      totalSlots: 6,
    },
  });

  const b3ZoneB = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB3.id, code: 'B3-ZONE-B' } },
    update: { name: 'Khu B - Ô tô dự phòng', vehicleType: VehicleType.CAR, colorHex: '#22C55E', totalSlots: 5 },
    create: {
      areaId: areaB3.id,
      code: 'B3-ZONE-B',
      name: 'Khu B - Ô tô dự phòng',
      vehicleType: VehicleType.CAR,
      colorHex: '#22C55E',
      totalSlots: 5,
    },
  });

  const b3ZoneEV = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB3.id, code: 'B3-ZONE-EV' } },
    update: { name: 'Trạm sạc chậm 7.4kW B3', vehicleType: VehicleType.CAR, colorHex: '#0F6B4F', totalSlots: 1 },
    create: {
      areaId: areaB3.id,
      code: 'B3-ZONE-EV',
      name: 'Trạm sạc chậm 7.4kW B3',
      vehicleType: VehicleType.CAR,
      colorHex: '#0F6B4F',
      totalSlots: 1,
    },
  });

  const b3ZoneMoto = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB3.id, code: 'B3-ZONE-MOTO' } },
    update: { name: 'Khu xe máy kỹ thuật', vehicleType: VehicleType.MOTORBIKE, colorHex: '#64748B', totalSlots: 2 },
    create: {
      areaId: areaB3.id,
      code: 'B3-ZONE-MOTO',
      name: 'Khu xe máy kỹ thuật',
      vehicleType: VehicleType.MOTORBIKE,
      colorHex: '#64748B',
      totalSlots: 2,
    },
  });

  const b3SlotsData = [
    { code: 'P31', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b3ZoneA.id },
    { code: 'P32', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b3ZoneA.id },
    { code: 'P33', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b3ZoneA.id, note: 'Biển số: 30E-666.66' },
    { code: 'P34', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b3ZoneA.id },
    { code: 'P35', status: ParkingSlotStatus.RESERVED, type: SlotVehicleType.CAR, zoneId: b3ZoneA.id, note: 'Đã cấp cho Căn hộ 20E' },
    { code: 'A-04', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.DISABLED, zoneId: b3ZoneA.id, note: 'Suất đỗ ưu tiên B3' },
    { code: 'P36', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b3ZoneB.id },
    { code: 'P37', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b3ZoneB.id },
    { code: 'P38', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b3ZoneB.id },
    { code: 'P39', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: b3ZoneB.id, note: 'Biển số: 29C-777.77' },
    { code: 'P40', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: b3ZoneB.id },
    { code: 'EV-06', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.EV, zoneId: b3ZoneEV.id, note: 'Trạm sạc chậm 7.4kW B3' },
    { code: 'M10', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.MOTORBIKE, zoneId: b3ZoneMoto.id },
    { code: 'M11', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.MOTORBIKE, zoneId: b3ZoneMoto.id },
  ];

  for (const s of b3SlotsData) {
    await prisma.parkingSlot.upsert({
      where: { areaId_code: { areaId: areaB3.id, code: s.code } },
      update: { status: s.status, type: s.type, zoneId: s.zoneId, note: s.note, floor: -3 },
      create: {
        areaId: areaB3.id,
        zoneId: s.zoneId,
        code: s.code,
        status: s.status,
        type: s.type,
        floor: -3,
        note: s.note,
        isReservable: s.status === ParkingSlotStatus.AVAILABLE,
        isActive: true,
      },
    });
  }

  // 5. SEED OUTDOOR ZONES & SLOTS (Visitor V01..V08, DROP-01, DROP-02, VIP-01, DELIV-01, EV-OUT-01, EV-OUT-02)
  console.log('--> Seeding OUTDOOR Zones & Slots...');
  const outZoneV = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaOutdoor.id, code: 'OUT-VISITOR' } },
    update: { name: 'Khu V - Xe Khách Ghé Thăm Ngắn Hạn', vehicleType: VehicleType.CAR, colorHex: '#3B82F6', totalSlots: 8 },
    create: {
      areaId: areaOutdoor.id,
      code: 'OUT-VISITOR',
      name: 'Khu V - Xe Khách Ghé Thăm Ngắn Hạn',
      vehicleType: VehicleType.CAR,
      colorHex: '#3B82F6',
      totalSlots: 8,
    },
  });

  const outZoneDrop = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaOutdoor.id, code: 'OUT-DROPOFF' } },
    update: { name: 'Làn Đón Trả Khách & Taxi (Max 15p)', vehicleType: VehicleType.CAR, colorHex: '#F59E0B', totalSlots: 2 },
    create: {
      areaId: areaOutdoor.id,
      code: 'OUT-DROPOFF',
      name: 'Làn Đón Trả Khách & Taxi (Max 15p)',
      vehicleType: VehicleType.CAR,
      colorHex: '#F59E0B',
      totalSlots: 2,
    },
  });

  const outZoneSpecial = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaOutdoor.id, code: 'OUT-SPECIAL' } },
    update: { name: 'Khu VIP & Giao Nhận Hàng Hoá', vehicleType: VehicleType.CAR, colorHex: '#0F6B4F', totalSlots: 2 },
    create: {
      areaId: areaOutdoor.id,
      code: 'OUT-SPECIAL',
      name: 'Khu VIP & Giao Nhận Hàng Hoá',
      vehicleType: VehicleType.CAR,
      colorHex: '#0F6B4F',
      totalSlots: 2,
    },
  });

  const outZoneEV = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaOutdoor.id, code: 'OUT-SOLAR-EV' } },
    update: { name: 'Trạm sạc năng lượng mặt trời Solar EV', vehicleType: VehicleType.CAR, colorHex: '#22C55E', totalSlots: 2 },
    create: {
      areaId: areaOutdoor.id,
      code: 'OUT-SOLAR-EV',
      name: 'Trạm sạc năng lượng mặt trời Solar EV',
      vehicleType: VehicleType.CAR,
      colorHex: '#22C55E',
      totalSlots: 2,
    },
  });

  const outdoorSlotsData = [
    { code: 'V01', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: outZoneV.id, note: 'Khách vãng lai' },
    { code: 'V02', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: outZoneV.id, note: 'Taxi vào đón khách' },
    { code: 'V03', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: outZoneV.id },
    { code: 'V04', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: outZoneV.id },
    { code: 'V05', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: outZoneV.id, note: 'Khách tham quan căn hộ' },
    { code: 'V06', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: outZoneV.id },
    { code: 'V07', status: ParkingSlotStatus.RESERVED, type: SlotVehicleType.CAR, zoneId: outZoneV.id, note: 'Xe đoàn đối tác làm việc' },
    { code: 'V08', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: outZoneV.id },
    { code: 'DROP-01', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: outZoneDrop.id, note: 'Dừng đỗ dưới 15 phút' },
    { code: 'DROP-02', status: ParkingSlotStatus.OCCUPIED, type: SlotVehicleType.CAR, zoneId: outZoneDrop.id, note: 'GrabCar trả khách sảnh A' },
    { code: 'VIP-01', status: ParkingSlotStatus.RESERVED, type: SlotVehicleType.CAR, zoneId: outZoneSpecial.id, note: 'Suất đỗ Ban quản trị / VIP' },
    { code: 'DELIV-01', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.CAR, zoneId: outZoneSpecial.id, note: 'Khu vực bốc dỡ hàng hoá' },
    { code: 'EV-OUT-01', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.EV, zoneId: outZoneEV.id, note: 'Trạm sạc Solar EV 50kW' },
    { code: 'EV-OUT-02', status: ParkingSlotStatus.AVAILABLE, type: SlotVehicleType.EV, zoneId: outZoneEV.id, note: 'Trạm sạc Solar EV 50kW' },
  ];

  for (const s of outdoorSlotsData) {
    await prisma.parkingSlot.upsert({
      where: { areaId_code: { areaId: areaOutdoor.id, code: s.code } },
      update: { status: s.status, type: s.type, zoneId: s.zoneId, note: s.note, floor: 0 },
      create: {
        areaId: areaOutdoor.id,
        zoneId: s.zoneId,
        code: s.code,
        status: s.status,
        type: s.type,
        floor: 0,
        note: s.note,
        isReservable: s.status === ParkingSlotStatus.AVAILABLE,
        isActive: true,
      },
    });
  }

  console.log('✅ Full Smart Parking seeding completed successfully for B1, B2, B3, and OUTDOOR!');
}

seedCompleteParkingData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
