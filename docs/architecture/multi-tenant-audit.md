# K-HOME MULTI-TENANT ARCHITECTURE AUDIT REPORT
> **Tài liệu:** Báo cáo Kiểm toán Kiến trúc Hiện trạng Hệ thống K-Home — Chuẩn hóa Mô hình Khách hàng, Tổ hợp Chung cư & Phân quyền Đa người thuê (Multi-Tenancy)  
> **Dự án:** K-Home — Enterprise Multi-Tenant Smart Living Platform  
> **Phiên bản:** 3.0  
> **Ngày lập:** 16/10/2026  
> **Tác giả:** Principal Software Architect & Senior Database Architect  

---

## 1. TỔNG QUAN HIỆN TRẠNG HỆ THỐNG

### 1.1. Hạ tầng kỹ thuật & Ngăn xếp Công nghệ (Tech Stack)
* **Framework:** Next.js 16.3.1 (App Router).
* **Language:** TypeScript 5.x.
* **Database Engine:** PostgreSQL trên Neon Cloud Serverless.
* **ORM:** Prisma ORM 5.22.0.
* **Authentication:** NextAuth.js 4.24.11 (JWT Strategy, 30 days maxAge).
* **Styling & UI:** Tailwind CSS 4, shadcn/ui, Radix UI primitives, Lucide React.
* **Data Fetching:** TanStack React Query 5.101.4.
* **Validation:** Zod 4.4.3.
* **Architecture Pattern:**
  $$\text{UI Components} \longrightarrow \text{React Query Hooks} \longrightarrow \text{Client Services} \longrightarrow \text{Next.js Route Handlers} \longrightarrow \text{Module Services} \longrightarrow \text{Repository / Prisma} \longrightarrow \text{Neon PostgreSQL}$$

### 1.2. Thống kê Dữ liệu & Lịch sử Migration Thực tế
Kiểm tra trực tiếp tại Neon PostgreSQL thông qua Prisma Client và PostgreSQL Information Schema:
* **Tổng số bảng cơ sở dữ liệu:** 45 bảng.
* **Lịch sử migrations trong `prisma/migrations`:** 5 migrations:
  1. `0_init`: Khởi tạo nền tảng cốt lõi (User, Building, Block, Floor, Apartment, Resident, Contract, Invoice, Feedback, Notification).
  2. `20260911000000_add_vehicle_and_parking_management`: Bổ sung quản lý phương tiện, vé xe, khu vực bãi đỗ xe.
  3. `20261004172500_sync_smart_apartment_schema`: Mở rộng tài sản, lịch bảo trì định kỳ, nhân sự, tiện ích, bưu kiện, khách thăm, khảo sát ý kiến cư dân.
  4. `20261012224000_add_apartment_ownership_residency_payment`: Tách quyền sở hữu (`ApartmentOwnership`), quan hệ cư trú (`ApartmentResident`) và giao dịch thanh toán (`PaymentTransaction`).
  5. `20261013210000_remove_resident_legacy_columns`: Migration dọn dẹp các cột cũ `apartmentId` và `relationshipToOwner` trên bảng `residents`.
* **Trạng thái bảng `residents`:** Bảng vẫn tồn tại 14 cột, trong đó runtime application (Service, Repository, NextAuth session) đã chuyển dịch 100% sang `apartment_residents` và `apartment_ownerships`.
* **Số lượng Tòa nhà (`Building`):** 2 tòa nhà trong database:
  - `SMART-CITY` ("Tổ hợp Chung cư SmartCity Landmark", ID: `cmuto7h4s000h1e0jwrlh7f56`)
  - `SUNRISE-TOWER` ("Tòa nhà Sunrise Tower", ID: `cmuto7x1000en1e0j2n9mnxfq`)
* **Số lượng Căn hộ (`Apartment`):** 203 căn hộ (201 căn hộ thuộc `SMART-CITY`, 2 căn hộ thử nghiệm giao tiếp `TEST-COMM-101/102`).
* **Số lượng Tài khoản (`User`):** 12 tài khoản trong production database.

---

## 2. PHÂN TÍCH LỖ HỔNG KIẾN TRÚC NGHIỆP VỤ (GAP ANALYSIS)

### 2.1. Lỗ hổng Cốt lõi: Thiếu Thực thể Khách hàng / Tổ hợp (`Tenant`)
* **Thực trạng:**
  - Chưa tồn tại model `Tenant` trong `prisma/schema.prisma` và không có bảng `tenants` trong database.
  - Model `Building` đứng độc lập ở đỉnh phân cấp bất động sản mà không gắn liền với bất kỳ pháp nhân khách hàng (Tenant) nào.
  - Hai tòa nhà hoàn toàn khác nhau (`SMART-CITY` và `SUNRISE-TOWER`) đang cùng nằm chung trong một kho dữ liệu phẳng mà không có ranh giới tổ chức.
* **Hậu quả:** Không thể cung cấp phần mềm dạng SaaS/B2B cho nhiều đơn vị quản lý vận hành hoặc chủ đầu tư khác nhau mà không bị lẫn lộn dữ liệu tài chính, cư dân và phương tiện.

### 2.2. Lỗ hổng Vai trò: Nhầm lẫn giữa Platform Admin và Customer Admin
* **Thực trạng Enum `Role` hiện tại:**
  ```prisma
  enum Role {
    ADMIN
    MANAGER
    STAFF_TECHNICIAN
    STAFF_SECURITY
    STAFF_RECEPTIONIST
    RESIDENT
  }
  ```
  Chỉ có một role duy nhất là `ADMIN`.
* **Các vấn đề phát hiện:**
  1. **Đặc quyền Wildcard toàn năng (`*`):** Trong `src/lib/permissions.ts`, `ROLE_PERMISSIONS.ADMIN` được cấu hình là `['*']`. Mọi tài khoản có role `ADMIN` đều có thể đọc/ghi bất kỳ bản ghi nào trong toàn bộ database.
  2. **Không phân định phạm vi quản trị:** Tài khoản Admin của Khách hàng A (ví dụ: Ban Quản Trị SmartCity) có cùng quyền lực tối cao với người phát triển/vận hành nền tảng K-Home (Platform Admin). Họ có thể nhìn thấy dữ liệu của Sunrise Tower.
  3. **Thiếu Role `PLATFORM_ADMIN`:** Đơn vị vận hành sản phẩm K-Home không có không gian quản trị độc lập để tạo Tenant, quản lý vòng đời thuê bao/hợp đồng của khách hàng và cấp tài khoản Tenant Admin ban đầu.
  4. **Thiếu Role `TENANT_ADMIN`:** Khách hàng không có tài khoản quản trị bị đóng khung nghiêm ngặt trong tổ hợp chung cư của họ.

### 2.3. Lỗ hổng Quản lý Manager Scope & Phân công Tòa nhà
* **Thực trạng Model `ManagerBuilding`:**
  - Model `ManagerBuilding` hiện tại gồm: `id`, `managerId`, `buildingId`, `assignedAt`.
  - Thiếu trạng thái phân công (`isActive` hoặc `status: ACTIVE | REVOKED`).
  - Thiếu phân định vai trò quản lý chính (`isPrimary: Boolean`) hoặc ghi chú phân công.
* **Lỗ hổng phân công đa tòa nhà:**
  - `src/lib/auth.ts` nạp `assignedBuildingIds: string[]`. Nếu Manager được gán vào 2 tòa nhà thuộc 2 khách hàng khác nhau, Manager đó vô tình trở thành cầu nối làm rò rỉ thông tin chéo Tenant.
  - Manager chưa được liên kết với `tenantId`.

### 2.4. Lỗ hổng API Route Handlers (Data Leakage & Inadequate Authorization)
Rà soát toàn bộ các API Route Handlers trong `src/app/api/`:
1. **`/api/buildings` (GET):**
   ```typescript
   if (isAdmin(user.role)) {
     const buildings = await apartmentService.getBuildingsList();
     return apiSuccess(buildings, 'Lấy danh sách tòa nhà thành công');
   }
   ```
   *Lỗ hổng:* Trả về toàn bộ danh sách tất cả các tòa nhà trong database cho bất kỳ ai có role `ADMIN`, bất kể họ thuộc khách hàng nào.
2. **`/api/buildings` (POST):**
   Cho phép `ADMIN` tạo tòa nhà mà không yêu cầu hoặc ràng buộc `tenantId`.
3. **`/api/managers` (GET & POST):**
   - GET: Trả về danh sách tất cả Manager trên toàn hệ thống.
   - POST: Tạo Manager và gán vào bất kỳ tòa nhà nào mà không kiểm tra xem tòa nhà đó có thuộc Tenant của người tạo hay không.
4. **`/api/dashboard` & `/api/reports`:**
   Truy vấn tổng doanh thu, tỷ lệ lấp đầy, số lượng căn hộ trên toàn bộ database khi người dùng là `ADMIN`, không lọc theo `tenantId`.
5. **`/api/apartments`, `/api/residents`, `/api/invoices`, `/api/fees`:**
   Nhận `buildingId` dạng optional query param; nếu không truyền `buildingId`, truy vấn trả về dữ liệu của tất cả tòa nhà trên toàn hệ thống cho `ADMIN`.

### 2.5. Lỗ hổng Giao diện Người dùng (Frontend Navigation & Switcher)
1. **`BuildingSwitcher.tsx`:**
   - Hiển thị nhãn `Super Admin` kèm lựa chọn `🌐 Toàn hệ thống` (`isAllSelected = true`) cho mọi tài khoản `ADMIN`.
   - Một Tenant Admin của SmartCity khi đăng nhập sẽ thấy tùy chọn xem dữ liệu toàn hệ thống bao gồm cả Sunrise Tower.
2. **`Sidebar.tsx`:**
   - Cung cấp nhóm menu `Quản trị Tối cao` gồm: `Bảng điều khiển hệ thống`, `Phân quyền & Managers` (`/settings/access-control`), `Cấu hình Biểu phí Chuẩn` (`/fees` gắn nhãn `Toàn cục`).
   - Tenant Admin không có dashboard tổng quan tổ hợp của riêng mình, mà bị hiển thị giao diện của Platform Admin.
   - Không có màn hình quản lý Tenant/Khách hàng dành cho Platform Admin.

---

## 3. BẢNG TỔNG HỢP RỦI RO & MỨC ĐỘ ẢNH HƯỞNG

| STT | Vấn đề Kiến trúc | Điểm lỗi phát hiện | Rủi ro An ninh / Nghiệp vụ | Mức độ |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Thiếu Model Tenant** | Database phẳng, chỉ có `Building` | Không thể cô lập dữ liệu theo khách hàng | **CRITICAL** |
| 2 | **Gộp chung Role ADMIN** | `ADMIN` có wildcard `*` xuyên tòa nhà | Khách hàng này xem và sửa được dữ liệu khách hàng khác (IDOR) | **CRITICAL** |
| 3 | **Building không có Tenant FK** | `Building` không chứa `tenantId` | Nguy cơ tạo Building mồ côi hoặc tranh chấp sở hữu | **CRITICAL** |
| 4 | **User không có Tenant FK** | `User` không chứa `tenantId` | Không xác định được nhân sự và Admin thuộc khách hàng nào | **CRITICAL** |
| 5 | **API Buildings không có Tenant Scope** | `GET /api/buildings` trả tất cả | Rò rỉ danh mục tài sản giữa các đối thủ cạnh tranh | **HIGH** |
| 6 | **BuildingSwitcher cho phép xem toàn sàn** | Toggle `🌐 Toàn hệ thống` trên UI | Gây hiểu nhầm quyền hạn và hiển thị sai số liệu KPI | **HIGH** |
| 7 | **Manager thiếu ràng buộc Tenant** | `manager_buildings` không check tenant | Nguy cơ phân công Manager vào tòa nhà của khách hàng khác | **HIGH** |
| 8 | **Hóa đơn và Báo cáo tài chính** | `GET /api/invoices` không chặn chéo Tenant | Rò rỉ thông tin doanh thu, công nợ nhạy cảm | **CRITICAL** |

---

## 4. KẾT LUẬN & ĐỊNH HƯỚNG BẮT BUỘC CHO ĐỢT REFACTOR

Để đảm bảo đáp ứng đầy đủ yêu cầu kinh doanh của K-Home:
1. **Bổ sung Model `Tenant`** và liên kết `Building.tenantId`, `User.tenantId` theo phương pháp Additive Migration an toàn.
2. **Tách biệt rạch ròi 2 role quản trị:** `PLATFORM_ADMIN` (quản trị nền tảng) và `TENANT_ADMIN` (quản trị tổ hợp khách hàng), giữ `ADMIN` làm alias tương thích ngược trong giai đoạn chuyển tiếp.
3. **Chuẩn hóa Server-side Scope Enforcement:** Mọi Route Handler và Service phải xác thực `tenantId` của người dùng từ Session/Token, không tin cậy tham số do client gửi lên.
4. **Cải tổ Frontend:** Xây dựng Platform Admin Console riêng biệt (`/admin/tenants`), cập nhật Tenant Admin Dashboard, gỡ bỏ chế độ xem "Toàn hệ thống" đối với Tenant Admin và Manager.
