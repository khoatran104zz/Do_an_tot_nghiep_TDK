-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TENANT_ADMIN';

-- CreateTable
CREATE TABLE IF NOT EXISTS "tenants" (
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
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- AlterTable
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "buildings_tenantId_idx" ON "buildings"("tenantId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_tenantId_fkey'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'buildings_tenantId_fkey'
    ) THEN
        ALTER TABLE "buildings" ADD CONSTRAINT "buildings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
