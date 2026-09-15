import { PrismaClient, ApartmentStatus, ApartmentHistoryEvent } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting tower floors and apartments population...');

  // 1. Get or create master building
  let building = await prisma.building.findFirst({
    where: { code: 'SMART-CITY' },
  });

  if (!building) {
    building = await prisma.building.upsert({
      where: { code: 'SMART-CITY' },
      update: {},
      create: {
        code: 'SMART-CITY',
        name: 'Khu Đô Thị Thông Minh Smart City',
        address: '102 Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội',
        description: 'Tổ hợp chung cư cao cấp tích hợp IoT và quản lý vận hành số',
      },
    });
  }

  // 2. Define Tower / Block specifications
  const towerConfigs = [
    {
      code: 'BLOCK-A',
      name: 'Tháp A (Sky Tower)',
      prefix: 'A',
      totalFloors: 15, // 15 floors: 1 -> 15
      aptPerFloor: 4,  // 4 apartments/floor = 60 apartments
    },
    {
      code: 'BLOCK-B',
      name: 'Tháp B (Ocean Tower)',
      prefix: 'B',
      totalFloors: 25, // 25 floors: 1 -> 25 (includes existing B-2001..B-2003, B-2101)
      aptPerFloor: 4,  // 4 apartments/floor = 100 apartments
    },
    {
      code: 'BLOCK-C',
      name: 'Tháp C (Garden Tower)',
      prefix: 'C',
      totalFloors: 10, // 10 floors: 1 -> 10 (includes existing C-0501..C-0502, C-0601..C-0602)
      aptPerFloor: 4,  // 4 apartments/floor = 40 apartments
    },
  ];

  let totalFloorsCreated = 0;
  let totalAptsCreated = 0;
  let totalAptsUpdated = 0;

  for (const t of towerConfigs) {
    console.log(`\n🏢 Processing ${t.name} (${t.code}) - ${t.totalFloors} floors, ${t.aptPerFloor} apts/floor...`);

    // Upsert Block with correct totalFloors
    const block = await prisma.block.upsert({
      where: {
        buildingId_code: {
          buildingId: building.id,
          code: t.code,
        },
      },
      update: {
        name: t.name,
        totalFloors: t.totalFloors,
      },
      create: {
        buildingId: building.id,
        code: t.code,
        name: t.name,
        totalFloors: t.totalFloors,
      },
    });

    // Generate all floors from 1 to t.totalFloors
    for (let floorNum = 1; floorNum <= t.totalFloors; floorNum++) {
      const floorName = `Tầng ${floorNum.toString().padStart(2, '0')}`;

      const floor = await prisma.floor.upsert({
        where: {
          blockId_floorNumber: {
            blockId: block.id,
            floorNumber: floorNum,
          },
        },
        update: {
          name: floorName,
        },
        create: {
          blockId: block.id,
          floorNumber: floorNum,
          name: floorName,
        },
      });
      totalFloorsCreated++;

      // Generate apartments for this floor
      for (let aptIndex = 1; aptIndex <= t.aptPerFloor; aptIndex++) {
        const aptCode = `${t.prefix}-${floorNum.toString().padStart(2, '0')}${aptIndex.toString().padStart(2, '0')}`;

        // Check if apartment already exists
        const existingApt = await prisma.apartment.findUnique({
          where: { code: aptCode },
        });

        if (existingApt) {
          // Keep existing status, residents, data, just ensure FK hierarchy is linked
          await prisma.apartment.update({
            where: { id: existingApt.id },
            data: {
              buildingId: building.id,
              blockId: block.id,
              floorId: floor.id,
              building: t.name,
              floor: floorNum,
            },
          });
          totalAptsUpdated++;
        } else {
          // Determine realistic apartment specs
          let bedrooms = 2;
          let bathrooms = 2;
          let area = 72.0;

          if (aptIndex === 1) {
            bedrooms = 1;
            bathrooms = 1;
            area = 50.0;
          } else if (aptIndex === 2) {
            bedrooms = 2;
            bathrooms = 2;
            area = 75.0;
          } else if (aptIndex === 3) {
            bedrooms = 3;
            bathrooms = 2;
            area = 95.0;
          } else {
            bedrooms = 2;
            bathrooms = 2;
            area = 68.5;
          }

          // Distribute realistic status: ~70% OCCUPIED, ~20% VACANT, ~10% UNDER_MAINTENANCE
          const hash = (floorNum * 7 + aptIndex * 13) % 10;
          let status: ApartmentStatus = ApartmentStatus.OCCUPIED;
          if (hash === 1 || hash === 5) {
            status = ApartmentStatus.VACANT;
          } else if (hash === 9) {
            status = ApartmentStatus.UNDER_MAINTENANCE;
          }

          const newApt = await prisma.apartment.create({
            data: {
              code: aptCode,
              building: t.name,
              floor: floorNum,
              bedrooms,
              bathrooms,
              area,
              status,
              note: `Căn ${bedrooms}PN view ${aptIndex % 2 === 0 ? 'hồ bơi' : 'thành phố'}`,
              buildingId: building.id,
              blockId: block.id,
              floorId: floor.id,
            },
          });
          totalAptsCreated++;

          // Create an initial status event history
          await prisma.apartmentHistory.create({
            data: {
              apartmentId: newApt.id,
              event: ApartmentHistoryEvent.STATUS_CHANGE,
              title:
                status === ApartmentStatus.OCCUPIED
                  ? 'Bàn giao và đưa vào sử dụng'
                  : status === ApartmentStatus.VACANT
                  ? 'Sẵn sàng tiếp nhận cư dân'
                  : 'Bảo dưỡng trang thiết bị',
              description: `Hệ thống hoàn tất cấu trúc căn hộ ${aptCode} tại ${floorName}`,
              toStatus: status,
              performedBy: 'Hệ thống Quản trị',
              createdAt: new Date(Date.now() - (30 + floorNum) * 86400000),
            },
          });
        }
      }
    }
  }

  console.log('\n=================================================');
  console.log(`✅ Hoàn tất thiết lập cấu trúc tháp, tầng và căn hộ!`);
  console.log(`- Tổng số tầng được xác nhận: ${totalFloorsCreated}`);
  console.log(`- Căn hộ đã cập nhật liên kết: ${totalAptsUpdated}`);
  console.log(`- Căn hộ mới được tạo theo quy chuẩn logic: ${totalAptsCreated}`);
  console.log('=================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error populating tower data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
