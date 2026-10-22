import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🚀 Applying Multi-Tenant Additive Migration to Database...');
  
  const migrationSql = fs.readFileSync(
    path.join(__dirname, '../prisma/migrations/20261016220000_add_multi_tenant_core/migration.sql'),
    'utf-8'
  );

  // Split and execute statements
  const statements = [
    `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';`,
    `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TENANT_ADMIN';`,
    `CREATE TABLE IF NOT EXISTS "tenants" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "address" TEXT,
      "phone" TEXT,
      "email" TEXT,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "tenants_code_key" ON "tenants"("code");`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;`,
    `ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;`,
    `CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");`,
    `CREATE INDEX IF NOT EXISTS "buildings_tenantId_idx" ON "buildings"("tenantId");`,
    `DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'users_tenantId_fkey'
        ) THEN
            ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END $$;`,
    `DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'buildings_tenantId_fkey'
        ) THEN
            ALTER TABLE "buildings" ADD CONSTRAINT "buildings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END $$;`
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('✅ Executed statement successfully');
    } catch (err: any) {
      console.error('Statement error:', err.message);
      throw err;
    }
  }

  console.log('🎉 Additive Multi-Tenant migration successfully executed!');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  });
