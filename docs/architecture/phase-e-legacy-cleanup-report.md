# K-HOME — BÁO CÁO GIAI ĐOẠN E: DỌN DẸP DỮ LIỆU CŨ & CHUẨN HÓA SCHEMA TOÀN DIỆN
*(Phase E: Legacy Data Cleanup & Final Schema Normalization Report)*

**Ngày thực hiện:** 13/10/2026  
**Người phụ trách:** Senior Database Architect & Senior Full-Stack Engineer  
**Hệ thống:** K-Home Smart Apartment Management Platform  
**Trạng thái:** HOÀN TẤT CHUẨN BỊ VÀ XÁC MINH (Ready for Production Apply)

---

## 1. TỔNG QUAN VÀ MỤC TIÊU GIAI ĐOẠN E

Giai đoạn E đánh dấu bước kết thúc của lộ trình tái cấu trúc mô hình dữ liệu căn hộ, quyền sở hữu, quan hệ cư trú và giao dịch thanh toán trong hệ thống K-Home.

### Mục tiêu cốt lõi:
1. **Loại bỏ hoàn toàn 2 trường legacy** trên model và bảng `Resident` / `residents`:
   - `apartmentId`: Cột lưu căn hộ trực tiếp trước đây.
   - `relationshipToOwner`: Enum vai trò quan hệ với chủ hộ được đặt trực tiếp trên Resident profile.
2. **Chuyển giao 100% trách nhiệm** sang 2 thực thể chuyên biệt đã được thiết lập và backfill thành công trong Giai đoạn C & D:
   - `apartment_residents` (`ApartmentResident`): Quản lý quan hệ cư trú theo thời gian (`roleInHousehold`, `isLivingHere`, `startDate`, `endDate`).
   - `apartment_ownerships` (`ApartmentOwnership`): Quản lý quyền sở hữu tài sản pháp lý riêng biệt (`ownershipType`, `ownershipPercentage`, `isCurrent`, `legalDocType`, `legalDocNumber`).
3. **Triệt tiêu toàn bộ cơ chế Dual-Write và Dual-Read**: Mã nguồn tại tầng Repository, Service, API routes, NextAuth session, AI Context, và Frontend không còn fallback hoặc ghi nhận đồng thời vào các cột cũ.
4. **Bảo toàn 100% tính toàn vẹn dữ liệu và phân quyền**: Đảm bảo RBAC, building scope, bảo mật IDOR giữa các căn hộ không bị gián đoạn.

---

## 2. KẾT QUẢ XÁC MINH ĐIỀU KIỆN TIÊN QUYẾT (GIAI ĐOẠN D STABILITY)

Trước khi tiến hành sửa đổi schema và tạo migration phá hủy (destructive migration), hệ thống đã chạy script kiểm toán dữ liệu thực tế trên cơ sở dữ liệu (`scripts/verify-phase-e-preconditions.ts`).

### 2.1. Thống kê đối chiếu dữ liệu thực tế (Data Reconciliation)

| Chỉ số kiểm toán | Giá trị ghi nhận | Đánh giá an toàn |
| :--- | :--- | :--- |
| **Tổng số Residents** | **6** | Hợp lệ |
| **Số Residents có `apartmentId` legacy** | **6** | 100% đối tượng cần di chuyển |
| **Tổng số bản ghi `apartment_residents` mới** | **6** | 100% đang cư trú (`isLivingHere = true`) |
| **Tổng số bản ghi `apartment_ownerships` mới** | **4** | Đúng 4 chủ hộ có bằng chứng sở hữu xác minh |
| **Số Resident cũ chưa có trong `apartment_residents`** | **0** | **Không có thất thoát dữ liệu (0 records)** |
| **Quan hệ cư trú mâu thuẫn hoặc trỏ Apartment rác** | **0** | Toàn bộ trỏ tới căn hộ thực tế đang hoạt động |

### 2.2. Kiểm tra phân bổ vai trò `relationshipToOwner`
- `OWNER`: **4 bản ghi** (đã được chuyển thành `HEAD_OF_HOUSEHOLD` trong `apartment_residents` và tạo quyền sở hữu độc lập trong `apartment_ownerships`).
- `FAMILY`: **1 bản ghi** (đã được chuyển thành `FAMILY_MEMBER` trong `apartment_residents`).
- `TENANT`: **1 bản ghi** (đã được chuyển thành `TENANT` trong `apartment_residents`).

*Kết luận kiểm toán:* Giai đoạn D đã hoàn tất backfill đầy đủ, dữ liệu đã được đối chiếu 1:1, không có sai lệch dữ liệu cư trú.

---

## 3. BẢO TOÀN NGHIỆP VỤ & ÁNH XẠ GIÁ TRỊ (MAPPING LOGIC)

### 3.1. Phân định giữa Cư trú (Residency) và Sở hữu (Ownership)
- **Quy tắc tuyệt đối:** Không đánh đồng người cư trú với người sở hữu tài sản. 
- Mối quan hệ giữa con người (`Resident`) và căn hộ (`Apartment`) được tách bạch hoàn toàn:
  - Một cư dân có thể cư trú tại căn hộ A (`ApartmentResident`) nhưng lại sở hữu căn hộ B hoặc nhiều căn hộ (`ApartmentOwnership`).
  - Khi chủ nhà cho thuê căn hộ, họ giữ `ApartmentOwnership` nhưng không còn bản ghi cư trú hiệu lực (`isLivingHere = false` hoặc không có) tại căn hộ đó.

### 3.2. Bảng ánh xạ giá trị vai trò trong hộ gia đình

| Giá trị Legacy (`relationshipToOwner`) | Mô hình đích mới | Trường lưu trữ mới | Vai trò sở hữu liên quan |
| :--- | :--- | :--- | :--- |
| `OWNER` | `apartment_residents` | `roleInHousehold: 'HEAD_OF_HOUSEHOLD'` | Tạo bản ghi tương ứng trong `apartment_ownerships` (`isCurrent: true`) |
| `FAMILY` | `apartment_residents` | `roleInHousehold: 'FAMILY_MEMBER'` | Không tạo quyền sở hữu |
| `TENANT` | `apartment_residents` | `roleInHousehold: 'TENANT'` | Không tạo quyền sở hữu |
| `TEMPORARY_RESIDENT` | `apartment_residents` | `roleInHousehold: 'TEMPORARY'` | Không tạo quyền sở hữu |

*Ghi chú quan trọng về Enum `ResidentRelationship`:*
Enum này vẫn được duy trì trong `prisma/schema.prisma` vì nó được sử dụng bởi module Tiếp nhận đơn đăng ký tạm trú / tạm vắng (`ResidenceRequest`). Việc giữ enum này không gây ảnh hưởng tới việc chuẩn hóa bảng `residents`.

---

## 4. CHI TIẾT REFACTOR TOÀN DIỆN MÃ NGUỒN (CODEBASE DECOUPLING)

Toàn bộ các tầng kiến trúc đã được rà soát và tái cấu trúc triệt để:

### 4.1. Core Authentication & Authorization
- **`src/lib/authorization.ts` (`getVerifiedResidentInfo`)**:
  - *Trước đây:* Đọc trực tiếp `resident.apartmentId`.
  - *Bây giờ:* Truy vấn trực tiếp quan hệ mới:
    ```typescript
    select: {
      id: true,
      occupancies: {
        where: { isLivingHere: true },
        select: { apartmentId: true },
        take: 1,
      },
      ownedApartments: {
        where: { isCurrent: true },
        select: { apartmentId: true },
        take: 1,
      },
    }
    ```
    Ưu tiên lấy căn hộ đang sinh sống (`occupancies`), sau đó đến căn hộ đang sở hữu (`ownedApartments`).
- **`src/lib/auth.ts` (NextAuth callback)**:
  - Không đọc `resident.apartmentId`. Nạp thông tin căn hộ đang hoạt động (`activeApartmentId`) dựa vào quan hệ cư trú / sở hữu mới.

### 4.2. Modules Nghiệp vụ Cốt lõi
- **`src/modules/resident/resident.repository.ts`**:
  - `findAll`: Lọc `apartmentId`, `buildingId`, `buildingIds`, `roleInHousehold` hoàn toàn thông qua quan hệ `occupancies`. Định dạng trả về `apartment` và `roleInHousehold` chuẩn hóa.
  - `findById`: Thay thế include `apartment` bằng `occupancies: { include: { apartment: true } }` và `ownedApartments: { include: { apartment: true } }`.
  - `create`: Loại bỏ hoàn toàn việc ghi `apartmentId` và `relationshipToOwner` vào `tx.resident.create()`. Tạo tự động `tx.apartmentResident.create()` và `tx.apartmentOwnership.create()` khi có thông tin tương ứng.
  - `update`: Đồng bộ thông tin căn hộ vào `apartmentResident`, không chạm vào cột trên bảng `residents`.
- **`src/modules/apartment/apartment.repository.ts`**:
  - `findAll`: Loại bỏ include `residents`, tính toán `owner`, `residentsCount`, `residents` dựa trên `ownerships` và `occupancies`. Tìm kiếm tên cư dân thông qua `occupancies.some.resident.fullName`.
  - `findById`: Truy vấn riêng biệt `owners` (`ownerships`) và `occupancies`.
  - `findFloorById` & `getHierarchy`: Thay thế include `residents` bằng `occupancies` và `ownerships`, map danh sách cư dân chuẩn hóa phục vụ UI và sơ đồ mặt bằng.
- **`src/modules/household/household.repository.ts`**:
  - `getHouseholdByApartmentId`: Truy vấn từ bảng `apartmentResident` (kèm `resident`) và `apartmentOwnership` thay vì `resident.findMany({ where: { apartmentId } })`.
- **`src/modules/household/household.service.ts`**:
  - Xử lý phê duyệt hồ sơ tạm trú / chuyển khẩu / bổ sung thành viên (`applyApprovalSideEffects`): Thao tác trực tiếp trên bảng `apartmentResident`, không ghi vào bảng `residents`.
- **`src/modules/vehicle/vehicle.service.ts`**:
  - Kiểm tra cư dân thuộc căn hộ (`INVALID_RESIDENT`) bằng cách tra cứu sự tồn tại trong `apartmentResident` (`isLivingHere: true`), không so sánh `resident.apartmentId`.
- **`src/modules/visitor/visitor.service.ts` & `src/modules/parcel/parcel.service.ts`**:
  - Dùng `getVerifiedResidentInfo(user.id)` để xác định căn hộ hợp lệ và bảo vệ IDOR.
- **`src/modules/poll/poll.service.ts`**:
  - Lấy căn hộ biểu quyết từ `getVerifiedResidentInfo(user.id)`.
- **`src/modules/resident-dashboard/resident-dashboard.service.ts`**:
  - Tính toán số thành viên cư trú (`activeMembersCount`) và thông tin căn hộ từ `occupancies` và `ownedApartments`.
- **`src/modules/report/report.service.ts`**:
  - Báo cáo dân cư và tỷ lệ lấp đầy dựa trên `apartmentResident` và `apartmentOwnership`.
- **`src/modules/ai/ai-safe-context.service.ts`**:
  - Cung cấp ngữ cảnh căn hộ an toàn cho Trợ lý AI từ `occupancies` và `ownedApartments`.
- **`src/modules/invoice/invoice.repository.ts`**:
  - Định dạng thông tin căn hộ và người nhận hóa đơn từ `occupancies` và `ownerships`.
- **`src/app/api/dashboard/manager/route.ts` & `src/app/api/search/route.ts`**:
  - Đếm số lượng cư dân và tìm kiếm cư dân thông qua quan hệ `occupancies`.

---

## 5. CẬP NHẬT PRISMA SCHEMA

File `prisma/schema.prisma` đã được chuẩn hóa:

```prisma
// 2.1 Apartment
model Apartment {
  id        String          @id @default(cuid())
  code      String          @unique // e.g. "A-1001"
  ...
  // Ownership & Residency History
  history     ApartmentHistory[]
  ownerships  ApartmentOwnership[]
  occupancies ApartmentResident[]

  // [ĐÃ LOẠI BỎ] residents Resident[]
  contracts     Contract[]
  ...
}

// 3. Resident Profile
model Resident {
  id                  String               @id @default(cuid())
  userId              String?              @unique
  user                User?                @relation(fields: [userId], references: [id], onDelete: SetNull)
  // [ĐÃ LOẠI BỎ] apartmentId String?
  // [ĐÃ LOẠI BỎ] apartment Apartment? @relation(...)
  fullName            String
  identityCard        String               @unique
  phone               String
  email               String?
  dateOfBirth         DateTime?
  gender              String?
  // [ĐÃ LOẠI BỎ] relationshipToOwner ResidentRelationship @default(OWNER)
  status              ResidentStatus       @default(RESIDING)
  avatarUrl           String?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  contracts           Contract[]
  feedbacks           Feedback[]
  vehicles            Vehicle[]
  parkingAssignments  ParkingAssignment[]
  parkingRequests     ParkingRegistrationRequest[]
  ownedApartments     ApartmentOwnership[]
  occupancies         ApartmentResident[]

  // [ĐÃ LOẠI BỎ] @@index([apartmentId])
  @@index([status])
  @@index([phone])
  @@map("residents")
}
```

- Lệnh `npx prisma validate` hoàn thành với mã thoát 0: `The schema at prisma\schema.prisma is valid 🚀`.
- Lệnh `npx prisma generate` hoàn tất thành công (Client v5.22.0).

---

## 6. MIGRATION DỌN DẸP DỮ LIỆU CUỐI CÙNG (CLEANUP MIGRATION)

### 6.1. File Migration được khởi tạo
Đường dẫn: `prisma/migrations/20261013210000_remove_resident_legacy_columns/migration.sql`

Nội dung SQL:
```sql
-- DropForeignKey
ALTER TABLE "residents" DROP CONSTRAINT IF EXISTS "residents_apartmentId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "residents_apartmentId_idx";

-- AlterTable
ALTER TABLE "residents" DROP COLUMN IF EXISTS "apartmentId",
DROP COLUMN IF EXISTS "relationshipToOwner";
```

### 6.2. Kế hoạch Backup & Rollback An toàn
1. **Phương án sao lưu (Backup Plan) trước khi chạy trên Production:**
   - Tạo Neon Database Branch riêng biệt hoặc Point-In-Time Restore (PITR) snapshot trước khi apply.
   - Xuất dữ liệu bảng `residents` dạng backup:
     ```sql
     CREATE TABLE residents_backup_phase_e AS SELECT * FROM residents;
     ```
2. **Kế hoạch hoàn tác (Rollback Plan) nếu phát sinh sự cố:**
   - Trường hợp cần phục hồi schema cũ:
     ```sql
     ALTER TABLE "residents" 
       ADD COLUMN "apartmentId" TEXT,
       ADD COLUMN "relationshipToOwner" "ResidentRelationship" NOT NULL DEFAULT 'OWNER';

     CREATE INDEX "residents_apartmentId_idx" ON "residents"("apartmentId" ASC);
     ALTER TABLE "residents" ADD CONSTRAINT "residents_apartmentId_fkey" 
       FOREIGN KEY ("apartmentId") REFERENCES "apartments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

     -- Khôi phục dữ liệu từ quan hệ mới sang cột cũ nếu cần
     UPDATE "residents" r
     SET "apartmentId" = ar."apartmentId",
         "relationshipToOwner" = CASE 
           WHEN ar."roleInHousehold" = 'HEAD_OF_HOUSEHOLD' THEN 'OWNER'::"ResidentRelationship"
           WHEN ar."roleInHousehold" = 'FAMILY_MEMBER' THEN 'FAMILY'::"ResidentRelationship"
           WHEN ar."roleInHousehold" = 'TENANT' THEN 'TENANT'::"ResidentRelationship"
           ELSE 'TEMPORARY_RESIDENT'::"ResidentRelationship"
         END
     FROM "apartment_residents" ar
     WHERE r.id = ar."residentId" AND ar."isLivingHere" = true;
     ```

---

## 7. KẾT QUẢ KIỂM THỬ VÀ XÁC MINH TOÀN DIỆN

### 7.1. TypeScript Compilation Check
- Lệnh: `npx tsc --noEmit`
- Kết quả: **0 lỗi** (Exit code: 0). Toàn bộ dự án tuân thủ nghiêm ngặt hệ thống type mới.

### 7.2. Kết quả chạy Test Suite tự động
- Lệnh: `npx tsx --test tests/household-workflow.test.ts tests/resident-authorization.test.ts tests/property-hierarchy.test.ts tests/domain-refactor-phase-c.test.ts`
- **Kết quả:**
  - Tổng số tests: **35 tests**
  - Suites: **18 suites**
  - **Passed: 35 / 35 (100% Passed)**
  - Failed: **0**
  - Thời gian chạy: 14.03 giây.

Chi tiết nhóm test chính:
- `Phase C — Domain Model Refactor Tests`:
  - `MUST query apartment_ownerships table without error`: PASS
  - `MUST only contain verified owners with valid ownerResident and isCurrent`: PASS
  - `MUST NOT create ownership record for tenants or family members`: PASS
  - `MUST query apartment_residents table without error`: PASS
  - `MUST accurately reflect residing status and role in household`: PASS
  - `apartmentRepository.findById MUST return separated owners and occupancies`: PASS
  - `residentRepository.findById MUST include ownedApartments and occupancies`: PASS
  - `invoiceRepository.findById MUST include payments list`: PASS
- `Household Management & Residence Request Workflow Tests`:
  - Phân loại hộ gia đình theo `roleInHousehold`: PASS
  - Side-effects phê duyệt đơn tạm trú/chuyển đi tác động vào `apartmentResident`: PASS
- `Property Management Hierarchy & History Tests`:
  - Kiểm tra cây phân cấp Tòa nhà -> Khối tháp -> Tầng -> Căn hộ: PASS
  - Tính toán chỉ số chủ sở hữu, số nhân khẩu, công nợ: PASS
- `Resident Portal Authorization Security Tests`:
  - Chống truy cập IDOR căn hộ, hóa đơn, sự cố kỹ thuật ngoài phạm vi sở hữu/cư trú: PASS

### 7.3. Next.js Production Build
- Lệnh: `npx next build`
- Phiên bản Next.js: `16.3.1 (Turbopack)`
- **Kết quả:**
  - Compile: `Compiled successfully in 23.5s`
  - TypeScript: `Finished TypeScript in 15.9s`
  - Sinh trang tĩnh: `Generating static pages using 7 workers (107/107) in 2.1s`
  - **Trạng thái: 107/107 routes biên dịch thành công 100% với Exit code 0.**

---

## 8. DANH MỤC TRƯỜNG CÒN KHỚP VỚI `apartmentId` TRONG CODEBASE VÀ PHÂN LOẠI

Toàn bộ các chuỗi tìm kiếm còn chứa `apartmentId` trong codebase hiện tại đã được phân loại:
1. **Khóa ngoại hợp lệ trỏ tới Căn hộ ở các bảng nghiệp vụ khác:**
   - `apartment_residents.apartmentId`
   - `apartment_ownerships.apartmentId`
   - `contracts.apartmentId`
   - `invoices.apartmentId`
   - `feedbacks.apartmentId`
   - `vehicles.apartmentId`
   - `visitor_passes.apartmentId`
   - `parcel_deliveries.apartmentId`
   - `notification_apartments.apartmentId`
2. **Context người dùng đã được xác minh:**
   - `user.apartmentId` hoặc `residentInfo.apartmentId`: Được phân giải động thông qua `getVerifiedResidentInfo(userId)` từ bảng `apartment_residents` hoặc `apartment_ownerships`.
3. **Mã nguồn và Model `Resident`:**
   - **HOÀN TOÀN KHÔNG CÒN** bất kỳ runtime dependency, Prisma query hay DTO nào đọc/ghi `resident.apartmentId` hoặc `resident.relationshipToOwner`.

---

## 9. QUY TRÌNH TRIỂN KHAI PRODUCTION (NEON DATABASE)

Để đảm bảo an toàn tuyệt đối và tuân thủ nguyên tắc không phá hủy ngoài kế hoạch, các bước triển khai lên môi trường Neon production được quy định như sau:

1. **Bước 1: Tạo Neon Branch thử nghiệm**
   - Tạo branch `preview-phase-e-cleanup` trên Neon console.
   - Chạy `npx prisma migrate deploy` trên branch này để xác thực SQL migration.
2. **Bước 2: Triển khai Codebase**
   - Đẩy codebase mới lên môi trường staging / production. Ứng dụng đã hoàn toàn không còn sử dụng 2 cột cũ nên có thể hoạt động song song.
3. **Bước 3: Thực thi Migration dọn dẹp**
   - Chạy `npx prisma migrate deploy` trên Neon production database để hoàn tất drop 2 cột `apartmentId` và `relationshipToOwner`.

---

## 10. KẾT LUẬN VÀ DEFINITION OF DONE

Dự án K-Home đã chính thức hoàn thành toàn bộ các tiêu chí nghiệm thu của Giai đoạn E:
- [x] Model `Resident` không còn chứa 2 field legacy.
- [x] Toàn bộ quan hệ cư trú được quản lý qua `apartment_residents`.
- [x] Toàn bộ quan hệ sở hữu được quản lý qua `apartment_ownerships`.
- [x] Dual-Write và Dual-Read đã được loại bỏ 100%.
- [x] API, DTO, forms, hooks, services, seed data đã tách biệt độc lập.
- [x] Migration dọn dẹp đã được tạo đúng chuẩn PostgreSQL.
- [x] RBAC và building scope hoạt động ổn định và chính xác.
- [x] Prisma validation, TypeScript type-check, 35/35 Unit & Integration tests, và Next.js production build đạt 100%.
