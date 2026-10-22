import { prisma } from '../src/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🔄 Starting Multi-Tenant Data Backfill & Reconciliation...');

  const defaultPassword = await bcrypt.hash('admin123', 10);

  // 1. Create or Find Tenants
  const tenantSmartCity = await prisma.tenant.upsert({
    where: { code: 'SMART-CITY-CORP' },
    update: {
      name: 'Tổ hợp Chung cư SmartCity Landmark',
      address: 'Số 108 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '02838221234',
      email: 'contact@smartcity.vn',
      status: 'ACTIVE',
    },
    create: {
      code: 'SMART-CITY-CORP',
      name: 'Tổ hợp Chung cư SmartCity Landmark',
      address: 'Số 108 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '02838221234',
      email: 'contact@smartcity.vn',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Tenant 1 ready:', tenantSmartCity.code, tenantSmartCity.id);

  const tenantSunrise = await prisma.tenant.upsert({
    where: { code: 'SUNRISE-GROUP' },
    update: {
      name: 'Tập đoàn Bất động sản Sunrise (Sunrise Tower)',
      address: 'Số 25 Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '02838995678',
      email: 'contact@sunrisetower.vn',
      status: 'ACTIVE',
    },
    create: {
      code: 'SUNRISE-GROUP',
      name: 'Tập đoàn Bất động sản Sunrise (Sunrise Tower)',
      address: 'Số 25 Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '02838995678',
      email: 'contact@sunrisetower.vn',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Tenant 2 ready:', tenantSunrise.code, tenantSunrise.id);

  // 2. Associate Buildings with Tenants
  const bldgSmartCity = await prisma.building.findUnique({
    where: { code: 'SMART-CITY' },
  });
  if (bldgSmartCity) {
    await prisma.building.update({
      where: { id: bldgSmartCity.id },
      data: { tenantId: tenantSmartCity.id },
    });
    console.log('✅ Building SMART-CITY linked to Tenant:', tenantSmartCity.name);
  }

  const bldgSunrise = await prisma.building.findUnique({
    where: { code: 'SUNRISE-TOWER' },
  });
  if (bldgSunrise) {
    await prisma.building.update({
      where: { id: bldgSunrise.id },
      data: { tenantId: tenantSunrise.id },
    });
    console.log('✅ Building SUNRISE-TOWER linked to Tenant:', tenantSunrise.name);
  }

  // 3. Fix any unlinked apartments (e.g. test communication apartments)
  if (bldgSmartCity) {
    const unlinkedApts = await prisma.apartment.updateMany({
      where: { buildingId: null as any },
      data: { buildingId: bldgSmartCity.id },
    });
    if (unlinkedApts.count > 0) {
      console.log(`✅ Backfilled ${unlinkedApts.count} unlinked apartments to SMART-CITY`);
    }
  }

  // 4. Update / Create Users
  // 4.1 Platform Admin (Platform Operator)
  await prisma.user.updateMany({
    where: { email: 'admin@building.com' },
    data: {
      role: Role.PLATFORM_ADMIN,
      tenantId: null, // Platform Admin has no single tenant restriction
    },
  });
  console.log('✅ admin@building.com set to PLATFORM_ADMIN');

  // 4.2 Customer Admin for Tenant 1 (SmartCity)
  const tenantAdmin1 = await prisma.user.upsert({
    where: { email: 'admin.smartcity@building.com' },
    update: {
      role: Role.TENANT_ADMIN,
      tenantId: tenantSmartCity.id,
      fullName: 'Trưởng Ban Quản Trị SmartCity',
    },
    create: {
      email: 'admin.smartcity@building.com',
      passwordHash: defaultPassword,
      fullName: 'Trưởng Ban Quản Trị SmartCity',
      phone: '0901112222',
      role: Role.TENANT_ADMIN,
      tenantId: tenantSmartCity.id,
      isActive: true,
    },
  });
  console.log('✅ Customer Admin for SmartCity ready:', tenantAdmin1.email);

  // 4.3 Customer Admin for Tenant 2 (Sunrise)
  const tenantAdmin2 = await prisma.user.upsert({
    where: { email: 'admin.sunrise@building.com' },
    update: {
      role: Role.TENANT_ADMIN,
      tenantId: tenantSunrise.id,
      fullName: 'Trưởng Ban Quản Trị Sunrise Tower',
    },
    create: {
      email: 'admin.sunrise@building.com',
      passwordHash: defaultPassword,
      fullName: 'Trưởng Ban Quản Trị Sunrise Tower',
      phone: '0903334444',
      role: Role.TENANT_ADMIN,
      tenantId: tenantSunrise.id,
      isActive: true,
    },
  });
  console.log('✅ Customer Admin for Sunrise ready:', tenantAdmin2.email);

  // 4.4 Manager 1 -> SmartCity
  await prisma.user.updateMany({
    where: { email: 'manager@building.com' },
    data: { tenantId: tenantSmartCity.id },
  });

  // 4.5 Manager 2 -> Sunrise
  await prisma.user.updateMany({
    where: { email: 'manager2@building.com' },
    data: { tenantId: tenantSunrise.id },
  });

  // 4.6 Operational Staff & Residents -> SmartCity
  const smartCityEmails = [
    'technician@building.com',
    'security@building.com',
    'receptionist@building.com',
    'tech2@building.com',
    'security2@building.com',
    'resident@building.com',
    'admin.comm.test@smartbuilding.local',
    'resident1.comm.test@smartbuilding.local',
    'resident2.comm.test@smartbuilding.local',
  ];

  await prisma.user.updateMany({
    where: { email: { in: smartCityEmails } },
    data: { tenantId: tenantSmartCity.id },
  });

  // Also convert any legacy admin.comm.test to TENANT_ADMIN
  await prisma.user.updateMany({
    where: { email: 'admin.comm.test@smartbuilding.local' },
    data: { role: Role.TENANT_ADMIN },
  });

  console.log('✅ Operational users backfilled to SmartCity Tenant');

  // 5. Verification & Reconciliation
  const totalTenants = await prisma.tenant.count();
  const buildingsWithoutTenant = await prisma.building.count({ where: { tenantId: null } });
  const usersWithTenant = await prisma.user.count({ where: { tenantId: { not: null } } });
  const platformAdmins = await prisma.user.count({ where: { role: Role.PLATFORM_ADMIN } });
  const tenantAdmins = await prisma.user.count({ where: { role: Role.TENANT_ADMIN } });

  console.log('\n================ DATA RECONCILIATION ================');
  console.log('• Total Tenants:', totalTenants);
  console.log('• Buildings without Tenant (must be 0):', buildingsWithoutTenant);
  console.log('• Users with assigned Tenant:', usersWithTenant);
  console.log('• Platform Admins:', platformAdmins);
  console.log('• Tenant Admins:', tenantAdmins);
  console.log('=====================================================\n');

  if (buildingsWithoutTenant > 0) {
    throw new Error('Data reconciliation failed: Buildings without Tenant still exist!');
  }
}

main()
  .then(() => {
    console.log('🎉 Multi-Tenant Backfill completed successfully!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  });
