import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BackfillStats {
  scanned: number;
  created: number;
  skipped: number;
  failed: number;
}

async function runBackfill() {
  const isApply = process.argv.includes('--apply');
  const mode = isApply ? 'APPLY (GHI VÀO CƠ SỞ DỮ LIỆU)' : 'DRY-RUN (CHỈ KIỂM TRA, KHÔNG GHI)';

  console.log('================================================================');
  console.log(`🚀 K-HOME DOMAIN REFACTOR: DATA BACKFILL SCRIPT`);
  console.log(`📌 Chế độ hoạt động: ${mode}`);
  console.log('================================================================\n');

  const ownershipStats: BackfillStats = { scanned: 0, created: 0, skipped: 0, failed: 0 };
  const residentStats: BackfillStats = { scanned: 0, created: 0, skipped: 0, failed: 0 };
  const paymentStats: BackfillStats = { scanned: 0, created: 0, skipped: 0, failed: 0 };

  // =========================================================================
  // 1. BACKFILL APARTMENT_RESIDENTS
  // =========================================================================
  console.log('👉 [1/3] Kiểm tra và backfill quan hệ cư trú (apartment_residents)...');
  const allResidents: any[] = await (prisma.resident as any).findMany({
    include: {
      apartment: true,
    },
  });

  for (const resident of allResidents) {
    residentStats.scanned++;

    if (!resident.apartmentId || !resident.apartment) {
      residentStats.skipped++;
      continue;
    }

    try {
      // Kiểm tra xem đã tồn tại bản ghi cư trú chưa
      const existing = await prisma.apartmentResident.findFirst({
        where: {
          apartmentId: resident.apartmentId,
          residentId: resident.id,
        },
      });

      if (existing) {
        residentStats.skipped++;
        continue;
      }

      // Xác định role trong hộ gia đình
      let roleInHousehold = 'TEMPORARY';
      if (resident.relationshipToOwner === 'OWNER') {
        roleInHousehold = 'HEAD_OF_HOUSEHOLD';
      } else if (resident.relationshipToOwner === 'FAMILY') {
        roleInHousehold = 'FAMILY_MEMBER';
      } else if (resident.relationshipToOwner === 'TENANT') {
        roleInHousehold = 'TENANT';
      }

      const isLivingHere = resident.status === 'RESIDING';

      if (isApply) {
        await prisma.apartmentResident.create({
          data: {
            apartmentId: resident.apartmentId,
            residentId: resident.id,
            roleInHousehold,
            isLivingHere,
            startDate: resident.createdAt || new Date(),
          },
        });
      }

      residentStats.created++;
    } catch (err: any) {
      residentStats.failed++;
      console.error(`❌ Lỗi cư trú Resident [${resident.id}]:`, err?.message || err);
    }
  }

  console.log(`   ✔️ Cư trú: Quét ${residentStats.scanned} | Tạo mới ${residentStats.created} | Bỏ qua ${residentStats.skipped} | Lỗi ${residentStats.failed}\n`);

  // =========================================================================
  // 2. BACKFILL APARTMENT_OWNERSHIPS (CHỈ KHI CÓ BẰNG CHỨNG XÁC MINH SỞ HỮU)
  // =========================================================================
  console.log('👉 [2/3] Kiểm tra và backfill quyền sở hữu (apartment_ownerships)...');
  for (const resident of allResidents) {
    ownershipStats.scanned++;

    // QUY TẮC NGHIỆP VỤ: Không suy đoán quyền sở hữu nếu không có bằng chứng
    if (!resident.apartmentId || !resident.apartment) {
      ownershipStats.skipped++;
      continue;
    }

    if (resident.relationshipToOwner !== 'OWNER') {
      // Ghi nhận bản ghi chưa đủ bằng chứng sở hữu
      ownershipStats.skipped++;
      continue;
    }

    try {
      // Kiểm tra trùng lặp
      const existing = await prisma.apartmentOwnership.findFirst({
        where: {
          apartmentId: resident.apartmentId,
          ownerResidentId: resident.id,
        },
      });

      if (existing) {
        ownershipStats.skipped++;
        continue;
      }

      if (isApply) {
        await prisma.apartmentOwnership.create({
          data: {
            apartmentId: (resident as any).apartmentId,
            ownerResidentId: resident.id,
            ownershipType: 'SOLE',
            ownershipPercentage: 100,
            isCurrent: true,
            startDate: resident.createdAt || new Date(),
          },
        });
      }

      ownershipStats.created++;
    } catch (err: any) {
      ownershipStats.failed++;
      console.error(`❌ Lỗi sở hữu Resident [${resident.id}]:`, err?.message || err);
    }
  }

  console.log(`   ✔️ Sở hữu: Quét ${ownershipStats.scanned} | Tạo mới ${ownershipStats.created} | Bỏ qua ${ownershipStats.skipped} | Lỗi ${ownershipStats.failed}\n`);

  // =========================================================================
  // 3. BACKFILL PAYMENT_TRANSACTIONS (CHỈ TỪ INVOICE ĐÃ THANH TOÁN THỰC TẾ)
  // =========================================================================
  console.log('👉 [3/3] Kiểm tra và backfill giao dịch thanh toán (payment_transactions)...');
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      status: 'PAID',
    },
  });

  for (const invoice of paidInvoices) {
    paymentStats.scanned++;

    try {
      // Kiểm tra xem invoice đã có giao dịch chưa
      const existing = await prisma.paymentTransaction.findFirst({
        where: {
          invoiceId: invoice.id,
        },
      });

      if (existing) {
        paymentStats.skipped++;
        continue;
      }

      const transactionCode = `TXN-${invoice.code || invoice.id.slice(-8)}-${invoice.paidAt ? invoice.paidAt.getTime() : Date.now()}`;
      const amount = invoice.totalAmount || 0;
      const paymentMethod = invoice.paymentMethod || 'BANK_TRANSFER';
      const transactedAt = invoice.paidAt || invoice.updatedAt || new Date();

      if (isApply) {
        await prisma.paymentTransaction.create({
          data: {
            invoiceId: invoice.id,
            transactionCode,
            amount,
            paymentMethod,
            status: 'SUCCESS',
            transactedAt,
          },
        });
      }

      paymentStats.created++;
    } catch (err: any) {
      paymentStats.failed++;
      console.error(`❌ Lỗi giao dịch Invoice [${invoice.id}]:`, err?.message || err);
    }
  }

  console.log(`   ✔️ Thanh toán: Quét ${paymentStats.scanned} | Tạo mới ${paymentStats.created} | Bỏ qua ${paymentStats.skipped} | Lỗi ${paymentStats.failed}\n`);

  // =========================================================================
  // BÁO CÁO TỔNG HỢP
  // =========================================================================
  console.log('================================================================');
  console.log('📊 TỔNG KẾT TIẾN TRÌNH BACKFILL');
  console.log('================================================================');
  console.table({
    'Apartment Residents': residentStats,
    'Apartment Ownerships': ownershipStats,
    'Payment Transactions': paymentStats,
  });

  if (!isApply) {
    console.log('💡 Ghi chú: Đây là chế độ DRY-RUN. Để thực hiện ghi dữ liệu thực tế, chạy:');
    console.log('   npx ts-node scripts/backfill-domain-refactor.ts --apply');
  } else {
    console.log('🎉 Đã hoàn tất ghi dữ liệu backfill an toàn vào cơ sở dữ liệu!');
  }
}

runBackfill()
  .catch((e) => {
    console.error('💥 Lỗi nghiêm trọng khi thực thi script backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
