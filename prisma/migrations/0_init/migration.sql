-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "FeeUnit" AS ENUM ('PER_M2', 'PER_MONTH', 'PER_VEHICLE', 'PER_KWH', 'PER_M3', 'FIXED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VNPAY', 'MOMO', 'BANK_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "ResidentRelationship" AS ENUM ('OWNER', 'FAMILY', 'TENANT');

-- CreateEnum
CREATE TYPE "ResidentStatus" AS ENUM ('RESIDING', 'MOVED_OUT', 'TEMPORARY_ABSENT');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'RESIDENT');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('ELECTRIC', 'WATER', 'ELEVATOR', 'SECURITY', 'CLEANLINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'PROCESSING', 'RESOLVED', 'REJECTED', 'ASSIGNED', 'CLOSED');

-- CreateTable
CREATE TABLE "apartments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL DEFAULT 2,
    "bathrooms" INTEGER NOT NULL DEFAULT 2,
    "area" DOUBLE PRECISION NOT NULL,
    "status" "ApartmentStatus" NOT NULL DEFAULT 'VACANT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contractCode" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "type" "ContractType" NOT NULL DEFAULT 'RENT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "monthlyRent" DOUBLE PRECISION,
    "deposit" DOUBLE PRECISION,
    "fileUrl" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "FeeUnit" NOT NULL DEFAULT 'PER_MONTH',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "responseContent" TEXT,
    "rating" INTEGER,
    "ratingComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedStaffId" TEXT,
    "closedAt" TIMESTAMP(3),
    "internalNote" TEXT,
    "rejectReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "slaDueAt" TIMESTAMP(3),

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "feeCategoryId" TEXT,
    "title" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "billingMonth" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "transactionId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_apartments" (
    "notificationId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,

    CONSTRAINT "notification_apartments_pkey" PRIMARY KEY ("notificationId","apartmentId")
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "targetRole" "Role",
    "senderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "apartmentId" TEXT,
    "fullName" TEXT NOT NULL,
    "identityCard" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "relationshipToOwner" "ResidentRelationship" NOT NULL DEFAULT 'OWNER',
    "status" "ResidentStatus" NOT NULL DEFAULT 'RESIDING',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_status_histories" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "fromStatus" "TicketStatus",
    "toStatus" "TicketStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "ticket_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'RESIDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "apartments_building_idx" ON "apartments"("building" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "apartments_code_key" ON "apartments"("code" ASC);

-- CreateIndex
CREATE INDEX "apartments_status_idx" ON "apartments"("status" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity" ASC, "entityId" ASC);

-- CreateIndex
CREATE INDEX "contracts_apartmentId_idx" ON "contracts"("apartmentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractCode_key" ON "contracts"("contractCode" ASC);

-- CreateIndex
CREATE INDEX "contracts_endDate_idx" ON "contracts"("endDate" ASC);

-- CreateIndex
CREATE INDEX "contracts_residentId_idx" ON "contracts"("residentId" ASC);

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "fee_categories_code_key" ON "fee_categories"("code" ASC);

-- CreateIndex
CREATE INDEX "feedbacks_apartmentId_idx" ON "feedbacks"("apartmentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_code_key" ON "feedbacks"("code" ASC);

-- CreateIndex
CREATE INDEX "feedbacks_priority_idx" ON "feedbacks"("priority" ASC);

-- CreateIndex
CREATE INDEX "feedbacks_residentId_idx" ON "feedbacks"("residentId" ASC);

-- CreateIndex
CREATE INDEX "feedbacks_slaDueAt_idx" ON "feedbacks"("slaDueAt" ASC);

-- CreateIndex
CREATE INDEX "feedbacks_status_idx" ON "feedbacks"("status" ASC);

-- CreateIndex
CREATE INDEX "invoices_apartmentId_idx" ON "invoices"("apartmentId" ASC);

-- CreateIndex
CREATE INDEX "invoices_billingMonth_idx" ON "invoices"("billingMonth" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_code_key" ON "invoices"("code" ASC);

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate" ASC);

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status" ASC);

-- CreateIndex
CREATE INDEX "notification_apartments_apartmentId_idx" ON "notification_apartments"("apartmentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "notification_reads_notificationId_userId_key" ON "notification_reads"("notificationId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "notifications_targetRole_idx" ON "notifications"("targetRole" ASC);

-- CreateIndex
CREATE INDEX "residents_apartmentId_idx" ON "residents"("apartmentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "residents_identityCard_key" ON "residents"("identityCard" ASC);

-- CreateIndex
CREATE INDEX "residents_phone_idx" ON "residents"("phone" ASC);

-- CreateIndex
CREATE INDEX "residents_status_idx" ON "residents"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "residents_userId_key" ON "residents"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email" ASC);

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_feeCategoryId_fkey" FOREIGN KEY ("feeCategoryId") REFERENCES "fee_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_apartments" ADD CONSTRAINT "notification_apartments_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_apartments" ADD CONSTRAINT "notification_apartments_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_status_histories" ADD CONSTRAINT "ticket_status_histories_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_status_histories" ADD CONSTRAINT "ticket_status_histories_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

