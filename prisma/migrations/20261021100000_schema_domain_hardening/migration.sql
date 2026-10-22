-- Migration: 20261021100000_schema_domain_hardening
-- Phase 2 Domain Schema Normalization & Constraint Hardening

-- 1. APARTMENT REFACTOR (DB-001, DB-002)
-- Drop global unique constraint on apartment code
DROP INDEX IF EXISTS "apartments_code_key";

-- Create compound unique constraint on (buildingId, code)
CREATE UNIQUE INDEX IF NOT EXISTS "apartments_buildingId_code_key" ON "apartments"("buildingId", "code");

-- Ensure buildingId column is NOT NULL
ALTER TABLE "apartments" ALTER COLUMN "buildingId" SET NOT NULL;

-- Ensure foreign key constraint uses ON DELETE RESTRICT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'apartments_buildingId_fkey'
    ) THEN
        ALTER TABLE "apartments" DROP CONSTRAINT "apartments_buildingId_fkey";
    END IF;
    ALTER TABLE "apartments" ADD CONSTRAINT "apartments_buildingId_fkey" 
        FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
END $$;

-- 2. FEE CATEGORY REFACTOR (DB-003)
-- Add tenantId column
ALTER TABLE "fee_categories" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Drop global unique constraint on fee category code
DROP INDEX IF EXISTS "fee_categories_code_key";

-- Create unique index on (tenantId, code)
CREATE UNIQUE INDEX IF NOT EXISTS "fee_categories_tenantId_code_key" ON "fee_categories"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "fee_categories_tenantId_idx" ON "fee_categories"("tenantId");

-- Add foreign key to tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fee_categories_tenantId_fkey'
    ) THEN
        ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_tenantId_fkey" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. POLL MULTI-TENANT & SCOPE REFACTOR (DB-004)
ALTER TABLE "polls" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "polls" ADD COLUMN IF NOT EXISTS "buildingId" TEXT;

CREATE INDEX IF NOT EXISTS "polls_tenantId_idx" ON "polls"("tenantId");
CREATE INDEX IF NOT EXISTS "polls_buildingId_idx" ON "polls"("buildingId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'polls_tenantId_fkey'
    ) THEN
        ALTER TABLE "polls" ADD CONSTRAINT "polls_tenantId_fkey" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'polls_buildingId_fkey'
    ) THEN
        ALTER TABLE "polls" ADD CONSTRAINT "polls_buildingId_fkey" 
            FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. AUDIT LOG TENANT SCOPE (DB-006)
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_tenantId_fkey'
    ) THEN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. IOT SENSOR CLEANUP (DB-005)
-- Drop foreign key from smart_alerts if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'smart_alerts_sensorId_fkey'
    ) THEN
        ALTER TABLE "smart_alerts" DROP CONSTRAINT "smart_alerts_sensorId_fkey";
    END IF;
END $$;

-- Drop table iot_sensors and types
DROP TABLE IF EXISTS "iot_sensors";
DROP TYPE IF EXISTS "IoTSensorStatus";
DROP TYPE IF EXISTS "IoTSensorType";
