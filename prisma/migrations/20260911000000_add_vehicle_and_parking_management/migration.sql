-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORBIKE', 'BICYCLE', 'ELECTRIC_BIKE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ParkingCardStatus" AS ENUM ('ACTIVE', 'LOCKED', 'EXPIRED', 'PENDING');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL DEFAULT 'MOTORBIKE',
    "brand" TEXT NOT NULL,
    "model" TEXT,
    "color" TEXT,
    "apartmentId" TEXT NOT NULL,
    "residentId" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "registrationDocumentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_cards" (
    "id" TEXT NOT NULL,
    "cardCode" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "ParkingCardStatus" NOT NULL DEFAULT 'PENDING',
    "lockedAt" TIMESTAMP(3),
    "lockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_apartmentId_idx" ON "vehicles"("apartmentId");

-- CreateIndex
CREATE INDEX "vehicles_residentId_idx" ON "vehicles"("residentId");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_type_idx" ON "vehicles"("type");

-- CreateIndex
CREATE UNIQUE INDEX "parking_cards_cardCode_key" ON "parking_cards"("cardCode");

-- CreateIndex
CREATE INDEX "parking_cards_vehicleId_idx" ON "parking_cards"("vehicleId");

-- CreateIndex
CREATE INDEX "parking_cards_status_idx" ON "parking_cards"("status");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_cards" ADD CONSTRAINT "parking_cards_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
