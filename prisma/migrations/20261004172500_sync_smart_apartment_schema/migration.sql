-- CreateEnum
CREATE TYPE "ApartmentHistoryEvent" AS ENUM ('OWNER_TRANSFER', 'TENANT_MOVE_IN', 'TENANT_MOVE_OUT', 'RESIDENT_MOVE_IN', 'RESIDENT_MOVE_OUT', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "ResidenceRequestType" AS ENUM ('TEMPORARY_RESIDENCE', 'TEMPORARY_ABSENCE', 'ADD_MEMBER', 'MOVE_IN', 'MOVE_OUT');

-- CreateEnum
CREATE TYPE "ResidenceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SlotVehicleType" AS ENUM ('CAR', 'MOTORBIKE', 'BICYCLE', 'EV', 'DISABLED', 'VISITOR');

-- CreateEnum
CREATE TYPE "ParkingSlotStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'BLOCKED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ParkingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ParkingAssignmentStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ParkingLogDirection" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "ParkingLogStatus" AS ENUM ('SUCCESS', 'REJECTED', 'ALERT');

-- CreateEnum
CREATE TYPE "StaffShift" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('ELEVATOR', 'WATER_PUMP', 'FIRE_ALARM', 'FIRE_EXTINGUISHER', 'GENERATOR', 'CCTV', 'BARRIER', 'AIR_CONDITIONER', 'ELECTRICAL_SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('OPERATIONAL', 'MAINTENANCE', 'BROKEN', 'RETIRED');

-- CreateEnum
CREATE TYPE "MaintenanceCycle" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('GYM', 'SWIMMING_POOL', 'BBQ_AREA', 'COMMUNITY_ROOM', 'SPORTS_COURT', 'MEETING_ROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "FacilityStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('PENDING', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('RECEIVED', 'NOTIFIED', 'COLLECTED', 'RETURNED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('GENERAL', 'EMERGENCY', 'MAINTENANCE', 'BILLING', 'EVENT', 'PARCEL', 'VISITOR', 'POLL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "NotificationTargetScope" AS ENUM ('ALL', 'BUILDING', 'BLOCK', 'FLOOR', 'APARTMENT');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PollTargetScope" AS ENUM ('ALL_APARTMENTS', 'BUILDING', 'BLOCK', 'FLOOR', 'SELECTED_APARTMENTS');

-- CreateEnum
CREATE TYPE "IoTSensorType" AS ENUM ('TEMPERATURE', 'SMOKE', 'WATER_LEVEL', 'WATER_LEAKAGE', 'PUMP_PRESSURE', 'POWER', 'ELEVATOR');

-- CreateEnum
CREATE TYPE "IoTSensorStatus" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SmartAlertSource" AS ENUM ('IOT', 'SLA', 'INVOICE', 'CONTRACT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SmartAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- AlterEnum
ALTER TYPE "ResidentRelationship" ADD VALUE 'TEMPORARY_RESIDENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'STAFF_TECHNICIAN';
ALTER TYPE "Role" ADD VALUE 'STAFF_SECURITY';
ALTER TYPE "Role" ADD VALUE 'STAFF_RECEPTIONIST';

-- AlterTable
ALTER TABLE "apartments" ADD COLUMN     "blockId" TEXT,
ADD COLUMN     "buildingId" TEXT,
ADD COLUMN     "floorId" TEXT;

-- AlterTable
ALTER TABLE "feedbacks" ADD COLUMN     "assetId" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "publishAt" TIMESTAMP(3),
ADD COLUMN     "relatedEntityId" TEXT,
ADD COLUMN     "relatedEntityType" TEXT,
ADD COLUMN     "targetScope" "NotificationTargetScope" NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_buildings" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalFloors" INTEGER NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartment_histories" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "event" "ApartmentHistoryEvent" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fromStatus" "ApartmentStatus",
    "toStatus" "ApartmentStatus",
    "residentId" TEXT,
    "residentName" TEXT,
    "performedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apartment_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_areas" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT -1,
    "totalCapacity" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_zones" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'CAR',
    "colorHex" TEXT DEFAULT '#0F6B4F',
    "totalSlots" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_slots" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "type" "SlotVehicleType" NOT NULL DEFAULT 'CAR',
    "status" "ParkingSlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "floor" INTEGER NOT NULL DEFAULT -1,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION DEFAULT 1,
    "height" DOUBLE PRECISION DEFAULT 1,
    "isReservable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_registration_requests" (
    "id" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "preferredAreaId" TEXT,
    "preferredZoneId" TEXT,
    "slotId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "ParkingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "rejectionReason" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_assignments" (
    "id" TEXT NOT NULL,
    "assignmentCode" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "residentId" TEXT,
    "apartmentId" TEXT NOT NULL,
    "requestId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "ParkingAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthlyFee" DOUBLE PRECISION DEFAULT 0,
    "qrToken" TEXT NOT NULL,
    "assignedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_access_logs" (
    "id" TEXT NOT NULL,
    "slotId" TEXT,
    "vehicleId" TEXT,
    "licensePlate" TEXT NOT NULL,
    "cardCode" TEXT,
    "gateName" TEXT NOT NULL,
    "direction" "ParkingLogDirection" NOT NULL DEFAULT 'ENTRY',
    "status" "ParkingLogStatus" NOT NULL DEFAULT 'SUCCESS',
    "operatorId" TEXT,
    "imageSnapshotUrl" TEXT,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residence_requests" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ResidenceRequestType" NOT NULL,
    "status" "ResidenceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "apartmentId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "identityCard" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" "ResidentRelationship" NOT NULL DEFAULT 'FAMILY',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "note" TEXT,
    "attachmentUrl" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residence_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "currentShift" "StaffShift" NOT NULL DEFAULT 'MORNING',
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedZone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL DEFAULT 'OTHER',
    "buildingId" TEXT,
    "location" TEXT NOT NULL,
    "supplier" TEXT,
    "installDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "status" "AssetStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "description" TEXT,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cycle" "MaintenanceCycle" NOT NULL DEFAULT 'MONTHLY',
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT,
    "technicianId" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "scheduleId" TEXT,
    "assetId" TEXT NOT NULL,
    "technicianId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "findings" TEXT,
    "cost" DOUBLE PRECISION DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FacilityType" NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "buildingId" TEXT,
    "openTime" TEXT NOT NULL DEFAULT '06:00',
    "closeTime" TEXT NOT NULL DEFAULT '22:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 60,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "FacilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_bookings" (
    "id" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "residentId" TEXT,
    "apartmentId" TEXT,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startTimeDate" TIMESTAMP(3) NOT NULL,
    "endTimeDate" TIMESTAMP(3) NOT NULL,
    "numberOfUsers" INTEGER NOT NULL DEFAULT 1,
    "totalFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facility_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_passes" (
    "id" TEXT NOT NULL,
    "passCode" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "expectedTime" TEXT NOT NULL,
    "licensePlate" TEXT,
    "note" TEXT,
    "status" "VisitorStatus" NOT NULL DEFAULT 'PENDING',
    "apartmentId" TEXT NOT NULL,
    "residentId" TEXT,
    "createdById" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkedInById" TEXT,
    "checkOutAt" TIMESTAMP(3),
    "checkedOutById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_deliveries" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "carrier" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "pickupCode" TEXT NOT NULL,
    "photoUrl" TEXT,
    "location" TEXT,
    "note" TEXT,
    "status" "ParcelStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3),
    "receivedById" TEXT,
    "collectedById" TEXT,
    "collectedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcel_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PollStatus" NOT NULL DEFAULT 'DRAFT',
    "targetScope" "PollTargetScope" NOT NULL DEFAULT 'ALL_APARTMENTS',
    "targetValue" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "voterResidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_sensors" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IoTSensorType" NOT NULL,
    "location" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentValue" TEXT NOT NULL,
    "thresholdMin" DOUBLE PRECISION,
    "thresholdMax" DOUBLE PRECISION,
    "status" "IoTSensorStatus" NOT NULL DEFAULT 'NORMAL',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iot_sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smart_alerts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "source" "SmartAlertSource" NOT NULL,
    "status" "SmartAlertStatus" NOT NULL DEFAULT 'OPEN',
    "location" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "actionUrl" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "sensorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smart_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buildings_code_key" ON "buildings"("code");

-- CreateIndex
CREATE INDEX "manager_buildings_managerId_idx" ON "manager_buildings"("managerId");

-- CreateIndex
CREATE INDEX "manager_buildings_buildingId_idx" ON "manager_buildings"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "manager_buildings_managerId_buildingId_key" ON "manager_buildings"("managerId", "buildingId");

-- CreateIndex
CREATE INDEX "blocks_buildingId_idx" ON "blocks"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_buildingId_code_key" ON "blocks"("buildingId", "code");

-- CreateIndex
CREATE INDEX "floors_blockId_idx" ON "floors"("blockId");

-- CreateIndex
CREATE UNIQUE INDEX "floors_blockId_floorNumber_key" ON "floors"("blockId", "floorNumber");

-- CreateIndex
CREATE INDEX "apartment_histories_apartmentId_createdAt_idx" ON "apartment_histories"("apartmentId", "createdAt");

-- CreateIndex
CREATE INDEX "parking_areas_buildingId_idx" ON "parking_areas"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "parking_areas_buildingId_code_key" ON "parking_areas"("buildingId", "code");

-- CreateIndex
CREATE INDEX "parking_zones_areaId_idx" ON "parking_zones"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "parking_zones_areaId_code_key" ON "parking_zones"("areaId", "code");

-- CreateIndex
CREATE INDEX "parking_slots_areaId_idx" ON "parking_slots"("areaId");

-- CreateIndex
CREATE INDEX "parking_slots_zoneId_idx" ON "parking_slots"("zoneId");

-- CreateIndex
CREATE INDEX "parking_slots_status_idx" ON "parking_slots"("status");

-- CreateIndex
CREATE INDEX "parking_slots_type_idx" ON "parking_slots"("type");

-- CreateIndex
CREATE UNIQUE INDEX "parking_slots_areaId_code_key" ON "parking_slots"("areaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "parking_registration_requests_requestCode_key" ON "parking_registration_requests"("requestCode");

-- CreateIndex
CREATE INDEX "parking_registration_requests_residentId_idx" ON "parking_registration_requests"("residentId");

-- CreateIndex
CREATE INDEX "parking_registration_requests_apartmentId_idx" ON "parking_registration_requests"("apartmentId");

-- CreateIndex
CREATE INDEX "parking_registration_requests_vehicleId_idx" ON "parking_registration_requests"("vehicleId");

-- CreateIndex
CREATE INDEX "parking_registration_requests_status_idx" ON "parking_registration_requests"("status");

-- CreateIndex
CREATE INDEX "parking_registration_requests_slotId_idx" ON "parking_registration_requests"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "parking_assignments_assignmentCode_key" ON "parking_assignments"("assignmentCode");

-- CreateIndex
CREATE UNIQUE INDEX "parking_assignments_requestId_key" ON "parking_assignments"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "parking_assignments_qrToken_key" ON "parking_assignments"("qrToken");

-- CreateIndex
CREATE INDEX "parking_assignments_slotId_idx" ON "parking_assignments"("slotId");

-- CreateIndex
CREATE INDEX "parking_assignments_vehicleId_idx" ON "parking_assignments"("vehicleId");

-- CreateIndex
CREATE INDEX "parking_assignments_residentId_idx" ON "parking_assignments"("residentId");

-- CreateIndex
CREATE INDEX "parking_assignments_apartmentId_idx" ON "parking_assignments"("apartmentId");

-- CreateIndex
CREATE INDEX "parking_assignments_status_idx" ON "parking_assignments"("status");

-- CreateIndex
CREATE INDEX "parking_assignments_qrToken_idx" ON "parking_assignments"("qrToken");

-- CreateIndex
CREATE INDEX "parking_access_logs_timestamp_idx" ON "parking_access_logs"("timestamp");

-- CreateIndex
CREATE INDEX "parking_access_logs_licensePlate_idx" ON "parking_access_logs"("licensePlate");

-- CreateIndex
CREATE INDEX "parking_access_logs_status_idx" ON "parking_access_logs"("status");

-- CreateIndex
CREATE INDEX "parking_access_logs_vehicleId_idx" ON "parking_access_logs"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "residence_requests_code_key" ON "residence_requests"("code");

-- CreateIndex
CREATE INDEX "residence_requests_apartmentId_idx" ON "residence_requests"("apartmentId");

-- CreateIndex
CREATE INDEX "residence_requests_status_idx" ON "residence_requests"("status");

-- CreateIndex
CREATE INDEX "residence_requests_type_idx" ON "residence_requests"("type");

-- CreateIndex
CREATE INDEX "residence_requests_requesterId_idx" ON "residence_requests"("requesterId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_userId_key" ON "staff_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_employeeCode_key" ON "staff_profiles"("employeeCode");

-- CreateIndex
CREATE INDEX "staff_profiles_userId_idx" ON "staff_profiles"("userId");

-- CreateIndex
CREATE INDEX "staff_profiles_employeeCode_idx" ON "staff_profiles"("employeeCode");

-- CreateIndex
CREATE INDEX "staff_profiles_currentShift_idx" ON "staff_profiles"("currentShift");

-- CreateIndex
CREATE INDEX "staff_profiles_status_idx" ON "staff_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "assets_code_key" ON "assets"("code");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_buildingId_idx" ON "assets"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_schedules_code_key" ON "maintenance_schedules"("code");

-- CreateIndex
CREATE INDEX "maintenance_schedules_assetId_idx" ON "maintenance_schedules"("assetId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_technicianId_idx" ON "maintenance_schedules"("technicianId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_status_idx" ON "maintenance_schedules"("status");

-- CreateIndex
CREATE INDEX "maintenance_schedules_nextMaintenance_idx" ON "maintenance_schedules"("nextMaintenance");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_code_key" ON "work_orders"("code");

-- CreateIndex
CREATE INDEX "work_orders_assetId_idx" ON "work_orders"("assetId");

-- CreateIndex
CREATE INDEX "work_orders_technicianId_idx" ON "work_orders"("technicianId");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "facilities_type_idx" ON "facilities"("type");

-- CreateIndex
CREATE INDEX "facilities_status_idx" ON "facilities"("status");

-- CreateIndex
CREATE INDEX "facilities_buildingId_idx" ON "facilities"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "facility_bookings_bookingCode_key" ON "facility_bookings"("bookingCode");

-- CreateIndex
CREATE INDEX "facility_bookings_facilityId_bookingDate_idx" ON "facility_bookings"("facilityId", "bookingDate");

-- CreateIndex
CREATE INDEX "facility_bookings_userId_idx" ON "facility_bookings"("userId");

-- CreateIndex
CREATE INDEX "facility_bookings_apartmentId_idx" ON "facility_bookings"("apartmentId");

-- CreateIndex
CREATE INDEX "facility_bookings_status_idx" ON "facility_bookings"("status");

-- CreateIndex
CREATE INDEX "facility_bookings_startTimeDate_endTimeDate_idx" ON "facility_bookings"("startTimeDate", "endTimeDate");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_passes_passCode_key" ON "visitor_passes"("passCode");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_passes_qrCode_key" ON "visitor_passes"("qrCode");

-- CreateIndex
CREATE INDEX "visitor_passes_apartmentId_idx" ON "visitor_passes"("apartmentId");

-- CreateIndex
CREATE INDEX "visitor_passes_status_idx" ON "visitor_passes"("status");

-- CreateIndex
CREATE INDEX "visitor_passes_visitDate_idx" ON "visitor_passes"("visitDate");

-- CreateIndex
CREATE INDEX "visitor_passes_createdById_idx" ON "visitor_passes"("createdById");

-- CreateIndex
CREATE INDEX "parcel_deliveries_apartmentId_idx" ON "parcel_deliveries"("apartmentId");

-- CreateIndex
CREATE INDEX "parcel_deliveries_recipientId_idx" ON "parcel_deliveries"("recipientId");

-- CreateIndex
CREATE INDEX "parcel_deliveries_status_idx" ON "parcel_deliveries"("status");

-- CreateIndex
CREATE INDEX "parcel_deliveries_pickupCode_idx" ON "parcel_deliveries"("pickupCode");

-- CreateIndex
CREATE INDEX "parcel_deliveries_receivedAt_idx" ON "parcel_deliveries"("receivedAt");

-- CreateIndex
CREATE INDEX "polls_status_idx" ON "polls"("status");

-- CreateIndex
CREATE INDEX "polls_startAt_idx" ON "polls"("startAt");

-- CreateIndex
CREATE INDEX "polls_endAt_idx" ON "polls"("endAt");

-- CreateIndex
CREATE INDEX "polls_createdById_idx" ON "polls"("createdById");

-- CreateIndex
CREATE INDEX "poll_options_pollId_idx" ON "poll_options"("pollId");

-- CreateIndex
CREATE INDEX "poll_votes_pollId_idx" ON "poll_votes"("pollId");

-- CreateIndex
CREATE INDEX "poll_votes_apartmentId_idx" ON "poll_votes"("apartmentId");

-- CreateIndex
CREATE INDEX "poll_votes_optionId_idx" ON "poll_votes"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_pollId_apartmentId_key" ON "poll_votes"("pollId", "apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "iot_sensors_code_key" ON "iot_sensors"("code");

-- CreateIndex
CREATE INDEX "iot_sensors_type_idx" ON "iot_sensors"("type");

-- CreateIndex
CREATE INDEX "iot_sensors_status_idx" ON "iot_sensors"("status");

-- CreateIndex
CREATE INDEX "smart_alerts_status_idx" ON "smart_alerts"("status");

-- CreateIndex
CREATE INDEX "smart_alerts_severity_idx" ON "smart_alerts"("severity");

-- CreateIndex
CREATE INDEX "smart_alerts_source_idx" ON "smart_alerts"("source");

-- CreateIndex
CREATE INDEX "apartments_buildingId_idx" ON "apartments"("buildingId");

-- CreateIndex
CREATE INDEX "apartments_blockId_idx" ON "apartments"("blockId");

-- CreateIndex
CREATE INDEX "apartments_floorId_idx" ON "apartments"("floorId");

-- CreateIndex
CREATE INDEX "feedbacks_assetId_idx" ON "feedbacks"("assetId");

-- CreateIndex
CREATE INDEX "notifications_category_idx" ON "notifications"("category");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_publishAt_idx" ON "notifications"("publishAt");

-- AddForeignKey
ALTER TABLE "manager_buildings" ADD CONSTRAINT "manager_buildings_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_buildings" ADD CONSTRAINT "manager_buildings_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_histories" ADD CONSTRAINT "apartment_histories_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_areas" ADD CONSTRAINT "parking_areas_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_zones" ADD CONSTRAINT "parking_zones_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "parking_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_slots" ADD CONSTRAINT "parking_slots_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "parking_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_slots" ADD CONSTRAINT "parking_slots_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "parking_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_registration_requests" ADD CONSTRAINT "parking_registration_requests_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_registration_requests" ADD CONSTRAINT "parking_registration_requests_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_registration_requests" ADD CONSTRAINT "parking_registration_requests_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_registration_requests" ADD CONSTRAINT "parking_registration_requests_preferredAreaId_fkey" FOREIGN KEY ("preferredAreaId") REFERENCES "parking_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_registration_requests" ADD CONSTRAINT "parking_registration_requests_preferredZoneId_fkey" FOREIGN KEY ("preferredZoneId") REFERENCES "parking_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_registration_requests" ADD CONSTRAINT "parking_registration_requests_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "parking_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_registration_requests" ADD CONSTRAINT "parking_registration_requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "parking_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "parking_registration_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_access_logs" ADD CONSTRAINT "parking_access_logs_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "parking_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_access_logs" ADD CONSTRAINT "parking_access_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_access_logs" ADD CONSTRAINT "parking_access_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residence_requests" ADD CONSTRAINT "residence_requests_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residence_requests" ADD CONSTRAINT "residence_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residence_requests" ADD CONSTRAINT "residence_requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "maintenance_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_passes" ADD CONSTRAINT "visitor_passes_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_passes" ADD CONSTRAINT "visitor_passes_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_passes" ADD CONSTRAINT "visitor_passes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_passes" ADD CONSTRAINT "visitor_passes_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_passes" ADD CONSTRAINT "visitor_passes_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_deliveries" ADD CONSTRAINT "parcel_deliveries_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_deliveries" ADD CONSTRAINT "parcel_deliveries_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_deliveries" ADD CONSTRAINT "parcel_deliveries_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_deliveries" ADD CONSTRAINT "parcel_deliveries_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_voterResidentId_fkey" FOREIGN KEY ("voterResidentId") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_alerts" ADD CONSTRAINT "smart_alerts_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "iot_sensors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

