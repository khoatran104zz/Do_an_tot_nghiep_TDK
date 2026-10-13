-- CreateTable
CREATE TABLE "apartment_ownerships" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "ownerResidentId" TEXT NOT NULL,
    "ownershipType" TEXT NOT NULL DEFAULT 'SOLE',
    "ownershipPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "certificateNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apartment_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartment_residents" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "roleInHousehold" TEXT NOT NULL DEFAULT 'HEAD_OF_HOUSEHOLD',
    "isLivingHere" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apartment_residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "transactionCode" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "gatewayTransactionNo" TEXT,
    "bankCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "transactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "apartment_ownerships_apartmentId_isCurrent_idx" ON "apartment_ownerships"("apartmentId", "isCurrent");

-- CreateIndex
CREATE INDEX "apartment_ownerships_ownerResidentId_idx" ON "apartment_ownerships"("ownerResidentId");

-- CreateIndex
CREATE UNIQUE INDEX "apartment_residents_apartmentId_residentId_startDate_key" ON "apartment_residents"("apartmentId", "residentId", "startDate");

-- CreateIndex
CREATE INDEX "apartment_residents_apartmentId_isLivingHere_idx" ON "apartment_residents"("apartmentId", "isLivingHere");

-- CreateIndex
CREATE INDEX "apartment_residents_residentId_idx" ON "apartment_residents"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transactionCode_key" ON "payment_transactions"("transactionCode");

-- CreateIndex
CREATE INDEX "payment_transactions_invoiceId_idx" ON "payment_transactions"("invoiceId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_transactedAt_idx" ON "payment_transactions"("transactedAt");

-- AddForeignKey
ALTER TABLE "apartment_ownerships" ADD CONSTRAINT "apartment_ownerships_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_ownerships" ADD CONSTRAINT "apartment_ownerships_ownerResidentId_fkey" FOREIGN KEY ("ownerResidentId") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_residents" ADD CONSTRAINT "apartment_residents_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_residents" ADD CONSTRAINT "apartment_residents_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
