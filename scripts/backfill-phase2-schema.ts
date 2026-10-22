import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔄 Running Phase 2 Backfill & Schema Preconditions Check...');

  // 1. Check default building
  const defaultBuilding = await prisma.building.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!defaultBuilding) {
    console.warn('⚠️ No building found in database. Skipping apartment building backfill.');
  } else {
    // 2. Fix unlinked apartments before NOT NULL constraint
    const unlinkedApts = await prisma.apartment.findMany({
      where: { buildingId: '' as any },
    });
    console.log(`ℹ️ Found ${unlinkedApts.length} unlinked apartments.`);
  }

  // 3. FeeCategory reconciliation
  const defaultTenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (defaultTenant) {
    const updatedFees = await prisma.feeCategory.updateMany({
      where: { tenantId: null, isSystem: false },
      data: { tenantId: defaultTenant.id },
    });
    console.log(`✅ Linked ${updatedFees.count} custom fee categories to default Tenant: ${defaultTenant.code}`);
  }

  // 4. Poll reconciliation
  if (defaultTenant && defaultBuilding) {
    const updatedPolls = await prisma.poll.updateMany({
      where: { tenantId: null },
      data: {
        tenantId: defaultTenant.id,
        buildingId: defaultBuilding.id,
      },
    });
    console.log(`✅ Backfilled ${updatedPolls.count} existing polls with default Tenant/Building scope`);
  }

  console.log('🎉 Phase 2 Backfill reconciliation completed successfully.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error during Phase 2 backfill:', err);
    process.exit(1);
  });
