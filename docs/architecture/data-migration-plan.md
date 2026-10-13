# K-HOME DATA MIGRATION PLAN (CHIẾN LƯỢC CHUYỂN ĐỔI DỮ LIỆU AN TOÀN)

> **Tài liệu:** Kế hoạch Migration, Backfill Dữ liệu & Kịch bản Rollback Hệ thống K-Home  
> **Dự án:** K-Home — Smart Property Management System  
> **Phiên bản:** 2.0  
> **Hệ quản trị CSDL:** PostgreSQL trên Neon Cloud  
> **ORM:** Prisma ORM 5.22.0  
> **Ngày lập:** 12/10/2026  

---

## 1. NGUYÊN TẮC BẤT DI BẤT DỊCH (CORE SAFETY PRINCIPLES)

Nhằm đảm bảo tính toàn vẹn 100% của cơ sở dữ liệu sản xuất trên Neon Cloud, toàn bộ quá trình refactor phải tuân thủ tuyệt đối các nguyên tắc:

1. **KHÔNG CHẠY `prisma migrate reset`** dưới bất kỳ hình thức nào.
2. **KHÔNG DÙNG `prisma db push --force-reset`** để ép cấu trúc schema.
3. **KHÔNG XÓA THỦ CÔNG bảng `_prisma_migrations`** hoặc các thư mục migration lịch sử đã áp dụng (`0_init`, `20260911000000`, `20261004172500`).
4. **MỌI THAY ĐỔI SCHEMA PHẢI THEO HƯỚNG BỔ SUNG (ADDITIVE-FIRST):** Thêm bảng mới, cột mới (nullable), chạy migration an toàn, sau đó backfill dữ liệu, kiểm tra tính toàn vẹn, rồi mới chuyển đổi code ứng dụng.
5. **DỮ LIỆU CŨ PHẢI ĐƯỢC GIỮ LẠI (DUAL-READ / DUAL-WRITE)** trong suốt giai đoạn chuyển tiếp để có thể Rollback ngay lập tức khi phát sinh sự cố.

---

## 2. LỘ TRÌNH 5 GIAI ĐOẠN CHUYỂN ĐỔI (5-PHASE TRANSITION STRATEGY)

```
[Giai đoạn 1: Additive Migration]
      │ Thêm bảng mới (ApartmentOwnership, ApartmentResident, PaymentTransaction)
      │ Thêm cột nullable (FloorId, PayerResidentId, FeedbackId trong WorkOrder)
      ▼
[Giai đoạn 2: Data Backfill & Integrity Check]
      │ Chạy script sao chép quan hệ hiện tại sang bảng mới
      │ Rà soát bản ghi mồ côi (Orphan records), trùng lặp
      ▼
[Giai đoạn 3: Dual-Write / Dual-Read Application Layer]
      │ Cập nhật Repository & Service: Đọc dữ liệu mới nếu có, ghi đồng thời cả 2 nơi
      │ Đảm bảo 100% API và Frontend không bị gián đoạn
      ▼
[Giai đoạn 4: Full Code Switch & Validation]
      │ Chuyển hoàn toàn sang cấu trúc mới
      │ Chạy test suite, kiểm tra báo cáo tài chính, biểu đồ lấp đầy
      ▼
[Giai đoạn 5: Safe Cleanup & Deprecation]
      │ Chỉ sau khi môi trường ổn định tối thiểu 1 kỳ hóa đơn
      │ Đề xuất migration DROP cột legacy trong phiên bản kế tiếp
```

---

## 3. CHI TIẾT CÁC BƯỚC THỰC THI (MIGRATION SCRIPTS & BACKFILL)

### Bước 1: Migration Bổ sung Cấu trúc (Additive Migration)
Tạo migration mới bằng lệnh:
```bash
npx prisma migrate dev --create-only --name add_domain_refactor_entities
```

Nội dung SQL bổ sung các bảng và cột mới:
```sql
-- 1. Tạo bảng quyền sở hữu căn hộ
CREATE TABLE IF NOT EXISTS "apartment_ownerships" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "apartment_ownerships_pkey" PRIMARY KEY ("id")
);

-- 2. Tạo bảng quan hệ cư trú có thời hạn
CREATE TABLE IF NOT EXISTS "apartment_residents" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "roleInHousehold" TEXT NOT NULL DEFAULT 'HEAD_OF_HOUSEHOLD',
    "isLivingHere" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "apartment_residents_pkey" PRIMARY KEY ("id")
);

-- 3. Tạo bảng nhật ký giao dịch thanh toán hóa đơn
CREATE TABLE IF NOT EXISTS "payment_transactions" (
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

-- 4. Bổ sung liên kết giữa WorkOrder và Feedback
ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "feedbackId" TEXT;

-- 5. Bổ sung chỉ mục tối ưu
CREATE INDEX IF NOT EXISTS "apartment_ownerships_apartmentId_isCurrent_idx" ON "apartment_ownerships"("apartmentId", "isCurrent");
CREATE INDEX IF NOT EXISTS "apartment_ownerships_ownerResidentId_idx" ON "apartment_ownerships"("ownerResidentId");
CREATE UNIQUE INDEX IF NOT EXISTS "apartment_residents_apartmentId_residentId_startDate_key" ON "apartment_residents"("apartmentId", "residentId", "startDate");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_transactionCode_key" ON "payment_transactions"("transactionCode");
CREATE INDEX IF NOT EXISTS "payment_transactions_invoiceId_idx" ON "payment_transactions"("invoiceId");
CREATE INDEX IF NOT EXISTS "work_orders_feedbackId_idx" ON "work_orders"("feedbackId");

-- 6. Khóa ngoại an toàn (onDelete Restrict / SetNull)
ALTER TABLE "apartment_ownerships" ADD CONSTRAINT "apartment_ownerships_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "apartment_ownerships" ADD CONSTRAINT "apartment_ownerships_ownerResidentId_fkey" FOREIGN KEY ("ownerResidentId") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "apartment_residents" ADD CONSTRAINT "apartment_residents_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "apartment_residents" ADD CONSTRAINT "apartment_residents_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedbacks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

---

### Bước 2: Kịch bản Chuyển dữ liệu (Backfill Data Script)

Chạy script chuyển dữ liệu hiện có trong bảng `residents` sang `apartment_ownerships` và `apartment_residents`:

```sql
-- A. Backfill Quyền Sở Hữu từ các Resident có relationshipToOwner = 'OWNER'
INSERT INTO "apartment_ownerships" (
    "id",
    "apartmentId",
    "ownerResidentId",
    "ownershipType",
    "ownershipPercentage",
    "isCurrent",
    "startDate",
    "createdAt",
    "updatedAt"
)
SELECT 
    'own_' || md5(random()::text || clock_timestamp()::text),
    r."apartmentId",
    r."id",
    'SOLE',
    100.0,
    true,
    COALESCE(r."createdAt", CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "residents" r
WHERE r."apartmentId" IS NOT NULL 
  AND r."relationshipToOwner" = 'OWNER'
  AND NOT EXISTS (
      SELECT 1 FROM "apartment_ownerships" ao 
      WHERE ao."apartmentId" = r."apartmentId" AND ao."ownerResidentId" = r."id"
  );

-- B. Backfill Quan Hệ Cư Trú thực tế từ toàn bộ Resident đang có trạng thái RESIDING
INSERT INTO "apartment_residents" (
    "id",
    "apartmentId",
    "residentId",
    "roleInHousehold",
    "isLivingHere",
    "startDate",
    "createdAt",
    "updatedAt"
)
SELECT 
    'occ_' || md5(random()::text || clock_timestamp()::text),
    r."apartmentId",
    r."id",
    CASE 
        WHEN r."relationshipToOwner" = 'OWNER' THEN 'HEAD_OF_HOUSEHOLD'
        WHEN r."relationshipToOwner" = 'FAMILY' THEN 'FAMILY_MEMBER'
        WHEN r."relationshipToOwner" = 'TENANT' THEN 'TENANT'
        ELSE 'TEMPORARY'
    END,
    CASE WHEN r."status" = 'RESIDING' THEN true ELSE false END,
    COALESCE(r."createdAt", CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "residents" r
WHERE r."apartmentId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM "apartment_residents" ar 
      WHERE ar."apartmentId" = r."apartmentId" AND ar."residentId" = r."id"
  );

-- C. Backfill Lịch sử Thanh toán từ các Invoice đã PAID
INSERT INTO "payment_transactions" (
    "id",
    "invoiceId",
    "transactionCode",
    "amount",
    "paymentMethod",
    "gatewayTransactionNo",
    "status",
    "transactedAt",
    "createdAt"
)
SELECT 
    'tx_' || md5(random()::text || clock_timestamp()::text),
    i."id",
    'TXN-' || replace(i."code", 'INV-', '') || '-AUTO',
    i."totalAmount",
    COALESCE(i."paymentMethod", 'BANK_TRANSFER'),
    i."transactionId",
    'SUCCESS',
    COALESCE(i."paidAt", CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
FROM "invoices" i
WHERE i."status" = 'PAID'
  AND NOT EXISTS (
      SELECT 1 FROM "payment_transactions" pt WHERE pt."invoiceId" = i."id"
  );
```

---

### Bước 3: Câu lệnh Kiểm tra Tính Toàn Vẹn (Integrity Verification Queries)

Trước khi chuyển đổi code, chạy các câu query sau để đảm bảo không có bản ghi mồ côi hoặc sai lệch:

```sql
-- 1. Kiểm tra căn hộ nào có cư dân nhưng chưa có bản ghi ApartmentResident
SELECT a."code", count(r."id") AS "missing_residents"
FROM "apartments" a
JOIN "residents" r ON r."apartmentId" = a."id"
LEFT JOIN "apartment_residents" ar ON ar."apartmentId" = a."id" AND ar."residentId" = r."id"
WHERE ar."id" IS NULL
GROUP BY a."code";
-- KỲ VỌNG: 0 dòng.

-- 2. Kiểm tra hóa đơn PAID nào chưa có bản ghi PaymentTransaction
SELECT count(*) AS "untracked_paid_invoices"
FROM "invoices" i
LEFT JOIN "payment_transactions" pt ON pt."invoiceId" = i."id"
WHERE i."status" = 'PAID' AND pt."id" IS NULL;
-- KỲ VỌNG: 0.

-- 3. Kiểm tra các slot đỗ xe có bị gán trùng 2 bản ghi ACTIVE không
SELECT "slotId", count(*) AS "active_count"
FROM "parking_assignments"
WHERE "status" = 'ACTIVE'
GROUP BY "slotId"
HAVING count(*) > 1;
-- KỲ VỌNG: 0 dòng.
```

---

## 4. KẾ HOẠCH ROLLBACK (PHƯƠNG ÁN KHÔI PHỤC KHI PHÁT SINH SỰ CỐ)

Nếu phát sinh lỗi trong quá trình triển khai, thực hiện rollback theo các kịch bản:

* **Sự cố ở mức Ứng dụng (Code Level):**
  * Nhờ nguyên tắc Dual-Read/Dual-Write, các trường cũ (`residents.apartmentId`, `invoices.paidAt`, `apartments.building`, `apartments.floor`) vẫn được đồng bộ liên tục.
  * Chỉ cần checkout lại commit code trước đó của backend/frontend và khởi động lại container, hệ thống ngay lập tức hoạt động bình thường trên các trường legacy mà không mất bất kỳ dữ liệu nào.

* **Sự cố ở mức Database Schema (Migration Level):**
  * Do toàn bộ migration ở Giai đoạn 1 là **Additive (chỉ thêm bảng/cột mới)**, không có bảng hoặc cột cũ nào bị sửa hay xóa, nên database production không bị phá vỡ tương thích ngược.
  * Nếu cần gỡ bỏ các bảng mới:
    ```sql
    DROP TABLE IF EXISTS "payment_transactions";
    DROP TABLE IF EXISTS "apartment_residents";
    DROP TABLE IF EXISTS "apartment_ownerships";
    ALTER TABLE "work_orders" DROP COLUMN IF EXISTS "feedbackId";
    ```

---

## 5. HƯỚNG DẪN TRIỂN KHAI PRODUCTION (DEPLOYMENT CHECKLIST)

1. [ ] Thực hiện backup database trên Neon Cloud Console (Tạo một Database Branch mới làm điểm khôi phục snapshot).
2. [ ] Áp dụng migration bằng lệnh: `npx prisma migrate deploy`.
3. [ ] Chạy script Backfill dữ liệu qua Neon SQL Editor hoặc Prisma Client script.
4. [ ] Chạy bộ truy vấn kiểm tra toàn vẹn (Integrity Queries).
5. [ ] Deploy bản build mới của ứng dụng K-Home lên Vercel/Production.
6. [ ] Thực hiện Smoke test trên các chức năng: Căn hộ, Cư dân, Hóa đơn, Bãi đỗ xe.
