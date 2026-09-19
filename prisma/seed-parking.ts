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
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function seedParkingData() {
  console.log('🅿️  Starting Smart Parking Management Seeding...');

  // 1. Get primary building
  const building = await prisma.building.findFirst();
  if (!building) {
    console.error('❌ No building found to seed parking into!');
    return;
  }

  // 2. Create Parking Areas
  console.log('--> Seeding Parking Areas for building:', building.name);
  const areaB1 = await prisma.parkingArea.upsert({
    where: { buildingId_code: { buildingId: building.id, code: 'B1' } },
    update: {},
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
    update: {},
    create: {
      buildingId: building.id,
      code: 'B2',
      name: 'Tầng hầm B2 (Khu mở rộng)',
      floor: -2,
      totalCapacity: 30,
      description: 'Hầm gửi xe ô tô dài hạn và bãi đỗ xe máy phụ',
      isActive: true,
    },
  });

  const areaOutdoor = await prisma.parkingArea.upsert({
    where: { buildingId_code: { buildingId: building.id, code: 'OUTDOOR' } },
    update: {},
    create: {
      buildingId: building.id,
      code: 'OUTDOOR',
      name: 'Bãi đỗ ngoài trời & Khách vãng lai',
      floor: 0,
      totalCapacity: 20,
      description: 'Khu vực đón tiếp xe taxi, xe công nghệ và khách ghé thăm ngắn hạn',
      isActive: true,
    },
  });

  // 3. Create Zones in B1
  console.log('--> Seeding Zones in B1...');
  const zoneA = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB1.id, code: 'ZONE-A' } },
    update: {},
    create: {
      areaId: areaB1.id,
      code: 'ZONE-A',
      name: 'Khu A - Ô tô & EV Charging',
      vehicleType: VehicleType.CAR,
      colorHex: '#0F6B4F',
      totalSlots: 20,
    },
  });

  const zoneB = await prisma.parkingZone.upsert({
    where: { areaId_code: { areaId: areaB1.id, code: 'ZONE-B' } },
    update: {},
    create: {
      areaId: areaB1.id,
      code: 'ZONE-B',
      name: 'Khu B - Xe máy & Xe điện 2 bánh',
      vehicleType: VehicleType.MOTORBIKE,
      colorHex: '#22C55E',
      totalSlots: 20,
    },
  });

  // 4. Create Slots in B1 Zone A (Slots A01 to A20)
  console.log('--> Seeding Slots in B1 Zone A (A01 - A20)...');
  for (let i = 1; i <= 20; i++) {
    const code = `A${String(i).padStart(2, '0')}`;
    const isEV = i === 1 || i === 2;
    const isMaintenance = i === 9;
    const isReserved = i === 4;

    const initialStatus = isMaintenance
      ? ParkingSlotStatus.MAINTENANCE
      : isReserved
      ? ParkingSlotStatus.RESERVED
      : ParkingSlotStatus.AVAILABLE;

    await prisma.parkingSlot.upsert({
      where: { areaId_code: { areaId: areaB1.id, code } },
      update: {},
      create: {
        areaId: areaB1.id,
        zoneId: zoneA.id,
        code,
        type: isEV ? SlotVehicleType.EV : SlotVehicleType.CAR,
        status: initialStatus,
        floor: -1,
        positionX: (i - 1) % 10,
        positionY: Math.floor((i - 1) / 10),
        width: 1,
        height: 1,
        isReservable: true,
        isActive: true,
        note: isEV ? 'Trạm sạc nhanh EV 60kW' : undefined,
      },
    });
  }

  // 5. Create Slots in B1 Zone B (Slots B01 to B20)
  console.log('--> Seeding Slots in B1 Zone B (B01 - B20)...');
  for (let i = 1; i <= 20; i++) {
    const code = `B${String(i).padStart(2, '0')}`;
    const isMaintenance = i === 8;

    await prisma.parkingSlot.upsert({
      where: { areaId_code: { areaId: areaB1.id, code } },
      update: {},
      create: {
        areaId: areaB1.id,
        zoneId: zoneB.id,
        code,
        type: SlotVehicleType.MOTORBIKE,
        status: isMaintenance ? ParkingSlotStatus.MAINTENANCE : ParkingSlotStatus.AVAILABLE,
        floor: -1,
        positionX: (i - 1) % 10,
        positionY: 2 + Math.floor((i - 1) / 10),
        width: 0.8,
        height: 0.8,
        isReservable: true,
        isActive: true,
      },
    });
  }

  // 6. Assign sample vehicles to slots
  console.log('--> Creating sample active parking assignments...');
  const activeCar = await prisma.vehicle.findFirst({
    where: { type: VehicleType.CAR, status: 'ACTIVE' },
    include: { apartment: true, resident: true },
  });

  const slotA02 = await prisma.parkingSlot.findUnique({
    where: { areaId_code: { areaId: areaB1.id, code: 'A02' } },
  });

  if (activeCar && slotA02) {
    const existingAssign = await prisma.parkingAssignment.findFirst({
      where: { vehicleId: activeCar.id },
    });

    if (!existingAssign) {
      await prisma.parkingAssignment.create({
        data: {
          assignmentCode: 'PASS-2026-0001',
          slotId: slotA02.id,
          vehicleId: activeCar.id,
          residentId: activeCar.residentId || '',
          apartmentId: activeCar.apartmentId,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          status: ParkingAssignmentStatus.ACTIVE,
          monthlyFee: 1200000,
          qrToken: 'KHOME-PARK-CAR-DEMO-001',
        },
      });

      await prisma.parkingSlot.update({
        where: { id: slotA02.id },
        data: { status: ParkingSlotStatus.OCCUPIED },
      });
    }
  }

  // Sample pending registration request
  console.log('--> Seeding sample pending parking registration request...');
  const motoVehicle = await prisma.vehicle.findFirst({
    where: { type: VehicleType.MOTORBIKE, status: 'ACTIVE' },
    include: { apartment: true, resident: true },
  });

  const slotB03 = await prisma.parkingSlot.findUnique({
    where: { areaId_code: { areaId: areaB1.id, code: 'B03' } },
  });

  if (motoVehicle && slotB03 && motoVehicle.residentId) {
    const existingReq = await prisma.parkingRegistrationRequest.findFirst({
      where: { vehicleId: motoVehicle.id },
    });

    if (!existingReq) {
      await prisma.parkingRegistrationRequest.create({
        data: {
          requestCode: 'REQ-PARK-2026-0001',
          residentId: motoVehicle.residentId,
          apartmentId: motoVehicle.apartmentId,
          vehicleId: motoVehicle.id,
          preferredAreaId: areaB1.id,
          preferredZoneId: zoneB.id,
          slotId: slotB03.id,
          startDate: new Date(),
          status: ParkingRequestStatus.PENDING,
          notes: 'Cư dân xin cấp chỗ đỗ xe máy gần lối thang máy tháp A',
        },
      });
    }
  }

  // 7. Seed Sample Gate Access Logs
  console.log('--> Seeding sample Gate Access Logs...');
  const logCount = await prisma.parkingAccessLog.count();
  if (logCount === 0 && activeCar) {
    await prisma.parkingAccessLog.createMany({
      data: [
        {
          licensePlate: activeCar.licensePlate,
          gateName: 'Cổng VÀO 01 (Hầm B1)',
          direction: ParkingLogDirection.ENTRY,
          status: ParkingLogStatus.SUCCESS,
          timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
          notes: 'Hợp lệ - Mở barie tự động',
          slotId: slotA02?.id,
          vehicleId: activeCar.id,
        },
        {
          licensePlate: '29B1-776.54',
          gateName: 'Cổng VÀO 01 (Hầm B1)',
          direction: ParkingLogDirection.ENTRY,
          status: ParkingLogStatus.SUCCESS,
          timestamp: new Date(Date.now() - 3600000 * 1), // 1 hour ago
          notes: 'Hợp lệ - Xe máy cư dân',
        },
        {
          licensePlate: '51H-999.99',
          gateName: 'Cổng VÀO 02 (Hầm B2)',
          direction: ParkingLogDirection.ENTRY,
          status: ParkingLogStatus.ALERT,
          timestamp: new Date(Date.now() - 1800000), // 30 mins ago
          notes: 'Cảnh báo: Xe vãng lai chưa đăng ký',
        },
      ],
    });
  }

  console.log('✅ Smart Parking seeding completed successfully!');
}

if (require.main === module) {
  seedParkingData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
