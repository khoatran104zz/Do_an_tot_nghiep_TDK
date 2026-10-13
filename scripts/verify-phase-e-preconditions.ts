import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('🔍 PHASE E PRE-MIGRATION AUDIT: DATA VERIFICATION');
  console.log('================================================================\n');

  // 1. Total records in Resident
  const totalResidents = await prisma.resident.count();
  const residentsWithApartmentId = await (prisma.resident as any).count({
    where: { apartmentId: { not: null } },
  });

  // 2. Total records in ApartmentResident
  const totalOccupancies = await prisma.apartmentResident.count();
  const activeOccupancies = await prisma.apartmentResident.count({
    where: { isLivingHere: true },
  });

  // 3. Total records in ApartmentOwnership
  const totalOwnerships = await prisma.apartmentOwnership.count();
  const currentOwnerships = await prisma.apartmentOwnership.count({
    where: { isCurrent: true },
  });

  // 4. Check for un-migrated residents
  const allResidentsWithApt = await (prisma.resident as any).findMany({
    where: { apartmentId: { not: null } },
    select: { id: true, fullName: true, apartmentId: true, relationshipToOwner: true, status: true },
  });

  const unmigratedOccupancies: any[] = [];
  for (const r of allResidentsWithApt) {
    const exists = await prisma.apartmentResident.findFirst({
      where: {
        apartmentId: r.apartmentId!,
        residentId: r.id,
      },
    });
    if (!exists) {
      unmigratedOccupancies.push(r);
    }
  }

  // 5. Relationship values in Resident
  const relationshipCounts = await (prisma.resident as any).groupBy({
    by: ['relationshipToOwner'],
    _count: { id: true },
  });

  console.log('📊 THỐNG KÊ ĐỐI CHIẾU DỮ LIỆU:');
  console.log(`- Tổng số Residents: ${totalResidents}`);
  console.log(`- Số Residents có apartmentId (legacy): ${residentsWithApartmentId}`);
  console.log(`- Tổng số bản ghi apartment_residents (mới): ${totalOccupancies} (Đang ở: ${activeOccupancies})`);
  console.log(`- Tổng số bản ghi apartment_ownerships (mới): ${totalOwnerships} (Hiện hành: ${currentOwnerships})`);
  console.log(`- Số Residents có apartmentId cũ chưa có trong apartment_residents: ${unmigratedOccupancies.length}`);
  
  console.log('\n📋 PHÂN BỔ GIÁ TRỊ relationshipToOwner (LEGACY):');
  for (const item of relationshipCounts) {
    console.log(`  • ${item.relationshipToOwner}: ${item._count.id} bản ghi`);
  }

  if (unmigratedOccupancies.length > 0) {
    console.log('\n⚠️ CẢNH BÁO: Phát hiện bản ghi chưa được chuyển đổi:');
    console.dir(unmigratedOccupancies, { depth: null });
  } else {
    console.log('\n✅ 100% dữ liệu cư trú hợp lệ đã có mặt trong apartment_residents!');
  }
}

main()
  .catch((e) => {
    console.error('Lỗi khi kiểm tra dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
