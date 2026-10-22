# K-HOME MULTI-TENANT ARCHITECTURE MIGRATION & BACKFILL PLAN
> **Tài liệu:** Kế hoạch Migration Schema, Backfill Dữ liệu, Phân bổ Role & Kịch bản Rollback  
> **Dự án:** K-Home — Enterprise Multi-Tenant Smart Living Platform  
> **Phiên bản:** 3.0  
> **Hệ quản trị CSDL:** PostgreSQL trên Neon Cloud  
> **ORM:** Prisma ORM 5.22.0  
> **Ngày lập:** 16/10/2026  
> **Tác giả:** Principal Software Architect & Senior Database Architect  

---

## 1. NGUYÊN TẮC BẢO TOÀN DỮ LIỆU & AN TOÀN VẬN HÀNH

Tuân thủ nghiêm ngặt các nguyên tắc bảo mật và toàn vẹn cơ sở dữ liệu:
1. **Tuyệt đối KHÔNG chạy `prisma migrate reset`** hoặc drop bảng trên database Neon production.
2. **Tuyệt đối KHÔNG dùng `prisma db push`** trên production.
3. **Mọi thay đổi Schema phải theo phương pháp Bổ sung An toàn (Additive-First):**
   - Thêm enum values mới mà không xóa enum cũ.
   - Thêm bảng `tenants` mới.
   - Thêm cột `tenantId` dạng **nullable** (`String?`) trên bảng `buildings` và `users`.
4. **Quy trình 3 bước:**
   - Bước 1: Áp dụng Migration bổ sung schema.
   - Bước 2: Chạy Script Backfill dữ liệu có kiểm toán (Reconciliation & Audit).
   - Bước 3: Cập nhật Backend/Frontend và xác minh tính toàn vẹn 100%.

---

## 2. KẾ HOẠCH BACKFILL DỮ LIỆU THỰC TẾ TRÊN DATABASE

### 2.1. Phân bổ Khách hàng & Tòa nhà Hiện tại

Dữ liệu thực tế ghi nhận 2 Tòa nhà trong Database:
1. `SMART-CITY` ("Tổ hợp Chung cư SmartCity Landmark", ID: `cmuto7h4s000h1e0jwrlh7f56`).
2. `SUNRISE-TOWER` ("Tòa nhà Sunrise Tower", ID: `cmuto7x1000en1e0j2n9mnxfq`).

**Chiến lược Khởi tạo Tenant:**
* **Tenant 1: SmartCity Complex**
  - `code`: `SMART-CITY-CORP`
  - `name`: `Tổ hợp Chung cư SmartCity Landmark`
  - `address`: `Số 108 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh`
  - Gắn Tòa nhà `SMART-CITY` vào Tenant 1.
* **Tenant 2: Sunrise Property Holdings**
  - `code`: `SUNRISE-GROUP`
  - `name`: `Tập đoàn Bất động sản Sunrise (Sunrise Tower)`
  - `address`: `Số 25 Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh`
  - Gắn Tòa nhà `SUNRISE-TOWER` vào Tenant 2.

### 2.2. Ánh xạ Tài khoản Người dùng (User Role & Tenant Mapping)

| Email | Role Cũ | Role Mới | Tenant Được Gán | Ghi chú Phân công |
| :--- | :--- | :--- | :--- | :--- |
| `admin@building.com` | `ADMIN` | `PLATFORM_ADMIN` | `null` (Toàn hệ thống) | Quản trị viên cấp cao của nền tảng K-Home |
| `admin.smartcity@building.com` *(Tạo mới/Onboard)* | N/A | `TENANT_ADMIN` | Tenant 1 (`SMART-CITY-CORP`) | Customer Admin của Tổ hợp SmartCity |
| `admin.sunrise@building.com` *(Tạo mới/Onboard)* | N/A | `TENANT_ADMIN` | Tenant 2 (`SUNRISE-GROUP`) | Customer Admin của Sunrise Tower |
| `manager@building.com` | `MANAGER` | `MANAGER` | Tenant 1 (`SMART-CITY-CORP`) | Quản lý tòa nhà SmartCity (`SMART-CITY`) |
| `manager2@building.com` | `MANAGER` | `MANAGER` | Tenant 2 (`SUNRISE-GROUP`) | Quản lý tòa nhà Sunrise (`SUNRISE-TOWER`) |
| `technician@building.com` | `STAFF_TECHNICIAN` | `STAFF_TECHNICIAN` | Tenant 1 (`SMART-CITY-CORP`) | Kỹ thuật viên trưởng SmartCity |
| `security@building.com` | `STAFF_SECURITY` | `STAFF_SECURITY` | Tenant 1 (`SMART-CITY-CORP`) | Đội trưởng an ninh SmartCity |
| `receptionist@building.com` | `STAFF_RECEPTIONIST` | `STAFF_RECEPTIONIST` | Tenant 1 (`SMART-CITY-CORP`) | Lễ tân SmartCity |
| `tech2@building.com` | `STAFF_TECHNICIAN` | `STAFF_TECHNICIAN` | Tenant 1 (`SMART-CITY-CORP`) | Kỹ thuật PCCC SmartCity |
| `security2@building.com` | `STAFF_SECURITY` | `STAFF_SECURITY` | Tenant 1 (`SMART-CITY-CORP`) | An ninh SmartCity |
| `resident@building.com` | `RESIDENT` | `RESIDENT` | Tenant 1 (`SMART-CITY-CORP`) | Cư dân Căn hộ A-1001 SmartCity |
| `admin.comm.test@smartbuilding.local` | `ADMIN` | `TENANT_ADMIN` | Tenant 1 (`SMART-CITY-CORP`) | Tài khoản test ban quản trị |
| `resident1.comm.test@smartbuilding.local` | `RESIDENT` | `RESIDENT` | Tenant 1 (`SMART-CITY-CORP`) | Cư dân test |
| `resident2.comm.test@smartbuilding.local` | `RESIDENT` | `RESIDENT` | Tenant 1 (`SMART-CITY-CORP`) | Cư dân test |

---

## 3. CHI TIẾT SCRIPT MIGRATION & BACKFILL

### 3.1. Prisma Migration SQL (`20261016220000_add_multi_tenant_core`)
```sql
-- 1. Thêm các giá trị enum mới nếu chưa tồn tại
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TENANT_ADMIN';

-- 2. Tạo bảng tenants
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_code_key" ON "tenants"("code");

-- 3. Bổ sung cột tenantId trên bảng buildings
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
CREATE INDEX IF NOT EXISTS "buildings_tenantId_idx" ON "buildings"("tenantId");
ALTER TABLE "buildings" DROP CONSTRAINT IF EXISTS "buildings_tenantId_fkey";
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Bổ sung cột tenantId trên bảng users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_tenantId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### 3.2. Script Backfill Tự động (`scripts/backfill-multi-tenant.ts`)
Script thực hiện tuần tự:
1. Tạo 2 Tenant (`SMART-CITY-CORP` và `SUNRISE-GROUP`).
2. Gán `tenantId` cho các Building tương ứng.
3. Cập nhật `tenantId` và `Role` cho các User hiện có.
4. Kiểm toán đối soát dữ liệu (Reconciliation): Đảm bảo 100% Building và User nghiệp vụ đều được gán đúng Tenant.

---

## 4. KỊCH BẢN ROLLBACK (ROLLBACK PROCEDURE)

Trong trường hợp phát sinh sự cố không mong muốn:
1. **Về mặt Codebase:** Git revert về commit trước đó; hệ thống vẫn hoạt động bình thường vì các cột `tenantId` và bảng `tenants` là dạng bổ sung (additive), không phá vỡ bất kỳ câu lệnh SELECT/INSERT nào của code cũ.
2. **Về mặt Database:**
   - Nếu cần khôi phục Role cũ: Cập nhật lại các tài khoản `PLATFORM_ADMIN` và `TENANT_ADMIN` thành `ADMIN`.
   - Giữ nguyên bảng `tenants` và cột `tenantId` mà không cần drop cột.

---

## 5. KẾ HOẠCH TRIỂN KHAI PRODUCTION (PRODUCTION DEPLOYMENT RUNBOOK)

1. **Pre-flight Check:** Chạy `npx prisma validate` và build thành công trên môi trường cục bộ.
2. **Database Apply:** Chạy migration trên Neon Cloud thông qua Prisma migrate hoặc SQL runner an toàn.
3. **Run Backfill:** Thực thi script backfill dữ liệu.
4. **Prisma Generation:** Chạy `npx prisma generate` để cập nhật TypeScript types.
5. **Code Deploy:** Triển khai code Next.js lên Vercel / server sản xuất.
6. **Smoke Testing & Audit:** Đăng nhập thử nghiệm bằng cả 3 vai trò (`PLATFORM_ADMIN`, `TENANT_ADMIN`, `MANAGER`) để xác minh IDOR protection và scope isolation.
