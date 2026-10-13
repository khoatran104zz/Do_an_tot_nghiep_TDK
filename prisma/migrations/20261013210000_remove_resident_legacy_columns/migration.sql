-- DropForeignKey
ALTER TABLE "residents" DROP CONSTRAINT IF EXISTS "residents_apartmentId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "residents_apartmentId_idx";

-- AlterTable
ALTER TABLE "residents" DROP COLUMN IF EXISTS "apartmentId",
DROP COLUMN IF EXISTS "relationshipToOwner";
