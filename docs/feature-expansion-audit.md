# Báo Cáo Khảo Sát & Audit Kiến Trúc Hệ Thống: Mở Rộng Module Quản Lý Phương Tiện & Hộ Gia Đình

> **Dự án**: Smart Apartment Management System (Hệ thống Quản lý Chung cư Thông minh)  
> **Mục tiêu**: Audit hiện trạng toàn bộ codebase và lập kế hoạch tích hợp 2 phân hệ: **Vehicle & Parking Management** và **Household & Family Members**.  
> **Nguyên tắc**: KHÔNG viết lại dự án, giữ nguyên kiến trúc 5 tầng chuẩn REST API, bảo toàn tính toàn vẹn của dữ liệu và hệ thống RBAC hiện hữu.

---

## 1. Existing Architecture

Hệ thống được xây dựng trên nền tảng **Next.js App Router (Full-stack TypeScript)** theo kiến trúc **API-First 5 tầng phân lập rõ ràng**:

```
[UI Layer: React Components]
       │
       ▼
[State & Data Layer: TanStack React Query Hooks (`src/hooks/use-*.ts`)]
       │
       ▼
[Client HTTP Service: Fetch Wrapper (`src/services/*.service.ts`)]
       │
       ▼
[API Route Handlers: REST API Endpoints (`src/app/api/**/route.ts`)]
       │
       ▼
[Domain Service: Nghiệp vụ & Business Logic (`src/modules/*/*.service.ts`)]
       │
       ▼
[Repository: Tương tác Cơ sở dữ liệu Prisma (`src/modules/*/*.repository.ts`)]
       │
       ▼
[PostgreSQL Database (qua Prisma ORM Client)]
```

### Công nghệ nền tảng & Thư viện sử dụng:
- **Framework**: Next.js App Router (React 19 / Next.js 15)
- **Database & ORM**: PostgreSQL + Prisma ORM (`prisma/schema.prisma`)
- **Authentication**: NextAuth.js (Credentials Provider, JWT Session token 30 ngày)
- **Validation**: Zod (chia sẻ dùng chung schema client form & server route handler)
- **Data Fetching & Cache**: TanStack Query v5 (`@tanstack/react-query`)
- **Styling & UI Kit**: TailwindCSS, Radix UI Primitives (shadcn/ui), Lucide Icons, Sonner (Toast)
- **Data Visualization**: Recharts (biểu đồ doanh thu, cơ cấu trạng thái căn hộ, sự cố)
- **Standardized API Response**: `apiSuccess`, `apiError`, `apiUnauthorized`, `apiForbidden`, `apiNotFound`, `apiServerError` (`src/lib/api-response.ts`)
- **Audit Logging**: Bảng `AuditLog` lưu vết mọi thao tác nhạy cảm (phát hành hóa đơn, thanh toán, thay đổi trạng thái ticket, hợp đồng).

---

## 2. Existing Database Relationships

Toàn bộ lược đồ dữ liệu hiện hữu được định nghĩa trong `prisma/schema.prisma`.

### 2.1 Chi tiết các Models chính:

| Model | Khóa chính (PK) | Khóa ngoại (FK) & Quan hệ | Ràng buộc Unique | Cascade Delete Behavior |
|---|---|---|---|---|
| **User** | `id` (CUID) | `residentProfile` (0..1 Resident), `sentNotifications` (1..n Notification), `readNotifications` (1..n NotificationRead), `assignedTickets` (1..n Feedback) | `email` | Khi User bị xóa, Resident liên kết set `userId = null` (`onDelete: SetNull`). |
| **Apartment** | `id` (CUID) | `residents` (1..n Resident), `contracts` (1..n Contract), `invoices` (1..n Invoice), `feedbacks` (1..n Feedback), `notifications` (1..n NotificationApartment) | `code` (VD: "A-1001") | Xóa Apartment sẽ cascade xóa Contracts, Invoices, Feedbacks, NotificationApartments; Resident liên kết set `apartmentId = null` (`onDelete: SetNull`). |
| **Resident** | `id` (CUID) | `userId` (FK -> User, optional), `apartmentId` (FK -> Apartment, optional), `contracts` (1..n Contract), `feedbacks` (1..n Feedback) | `identityCard` (CCCD/CMND), `userId` | Xóa Resident sẽ cascade xóa Contracts, Feedbacks liên quan. |
| **Contract** | `id` (CUID) | `apartmentId` (FK -> Apartment), `residentId` (FK -> Resident) | `contractCode` | Cascade khi Apartment hoặc Resident bị xóa. |
| **FeeCategory** | `id` (CUID) | `invoiceItems` (1..n InvoiceItem) | `code` (VD: `MGMT`, `PARKING_MOTO`, `ELECTRIC`) | Xóa FeeCategory set `feeCategoryId = null` trên InvoiceItem (`onDelete: SetNull`). |
| **Invoice** | `id` (CUID) | `apartmentId` (FK -> Apartment), `items` (1..n InvoiceItem) | `code` (VD: `INV-202609-A1001`) | Cascade xóa toàn bộ InvoiceItem con khi Invoice bị xóa. |
| **InvoiceItem** | `id` (CUID) | `invoiceId` (FK -> Invoice), `feeCategoryId` (FK -> FeeCategory, optional) | Không | Xóa theo Invoice cha (`onDelete: Cascade`). |
| **Feedback** (Ticket) | `id` (CUID) | `residentId` (FK -> Resident), `apartmentId` (FK -> Apartment), `assignedStaffId` (FK -> User, optional), `statusHistory` (1..n), `comments` (1..n) | `code` (VD: `FB-2026-0001`) | Cascade xóa Feedback history và comments. Staff gán set `SetNull`. |
| **Notification** | `id` (CUID) | `senderId` (FK -> User), `apartments` (1..n), `reads` (1..n) | Không | Cascade xóa pivot tables `NotificationApartment`, `NotificationRead`. |
| **AuditLog** | `id` (CUID) | Không lưu khóa ngoại cứng để tránh ràng buộc phụ thuộc | Không | Độc lập, chỉ append. |

> **Lưu ý quan trọng về thực thể chưa có trong Database**:
> - **Building**: Không có model `Building` riêng biệt. Tòa nhà hiện được lưu dưới dạng cột chuỗi `building String` (VD: `"Tòa A (Sky)"`) trong bảng `Apartment`.
> - **Payment**: Không có bảng `Payment` riêng biệt. Thông tin thanh toán (`paidAt`, `paymentMethod`, `transactionId`) được lưu trực tiếp trên bản ghi `Invoice`.
> - **Vehicle**: **HOÀN TOÀN CHƯA CÓ** model `Vehicle` trong database hiện tại.

### 2.2 Các Enum hiện hữu:
- `Role`: `ADMIN`, `MANAGER`, `RESIDENT`
- `ApartmentStatus`: `VACANT`, `OCCUPIED`, `UNDER_MAINTENANCE`
- `ResidentStatus`: `RESIDING`, `MOVED_OUT`, `TEMPORARY_ABSENT`
- `ResidentRelationship`: `OWNER`, `FAMILY`, `TENANT`
- `ContractType`: `SALE`, `RENT`
- `ContractStatus`: `ACTIVE`, `EXPIRED`, `TERMINATED`
- `FeeUnit`: `PER_M2`, `PER_MONTH`, `PER_VEHICLE`, `PER_KWH`, `PER_M3`, `FIXED`
- `InvoiceStatus`: `UNPAID`, `PAID`, `OVERDUE`, `CANCELLED`
- `PaymentMethod`: `VNPAY`, `MOMO`, `BANK_TRANSFER`, `CASH`
- `TicketCategory`: `ELECTRIC`, `WATER`, `ELEVATOR`, `SECURITY`, `CLEANLINESS`, `OTHER`
- `TicketPriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`, `CRITICAL`
- `TicketStatus`: `NEW`, `ASSIGNED`, `PROCESSING`, `RESOLVED`, `CLOSED`, `REJECTED`

---

## 3. Current Billing Flow

Quy trình phát hành và tính toán hóa đơn hiện tại diễn ra như sau:

### 3.1 Nơi phát hành:
- **Giao diện**: Màn hình Quản lý Hóa đơn của BQL (`src/app/(management)/invoices/page.tsx`), nút **"Phát hành hóa đơn tháng"** kích hoạt Modal nhập `billingMonth` (VD: `2026-08`) và `dueDate`.
- **API Endpoint**: `POST /api/invoices/generate-monthly`
- **Controller/Service**: Gọi `invoiceService.generateMonthlyInvoices(dto, audit)` tại file [`src/modules/invoice/invoice.service.ts`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/modules/invoice/invoice.service.ts).

### 3.2 Vị trí Hardcode số lượng xe (`quantity = 2`):
Trong file [`src/modules/invoice/invoice.service.ts`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/modules/invoice/invoice.service.ts#L85-L98):

```typescript
// Calculate items based on active Fee Categories
for (const fee of feeCategories) {
  let quantity = 1;
  const unitPrice = fee.unitPrice;

  if (fee.unit === 'PER_M2') {
    quantity = apt.area;
  } else if (fee.unit === 'PER_VEHICLE') {
    quantity = 2; // Default 2 vehicles per apartment  <--- HARDCODE Ở ĐÂY (Dòng 91-92)
  } else if (fee.unit === 'PER_KWH') {
    quantity = 150; // Standard nominal unit consumption
  } else if (fee.unit === 'PER_M3') {
    quantity = 15; // Standard nominal unit consumption
  }

  items.push({
    feeCategoryId: fee.id,
    title: fee.name,
    quantity,
    unitPrice,
    note: `${fee.unit === 'PER_M2' ? `Diện tích ${apt.area} m²` : ''}`,
  });
}
```

### 3.3 Hạn chế của luồng tính toán hiện tại:
1. **Bất kỳ căn hộ nào** (dù không có xe hoặc có 5 xe, dù căn hộ đang trống `VACANT`) cũng bị tính mặc định 2 phương tiện.
2. Danh mục phí có 2 loại phí giữ xe: `PARKING_MOTO` (100.000đ/tháng) và `PARKING_CAR` (1.200.000đ/tháng) đều dùng đơn vị `PER_VEHICLE`. Vòng lặp trên sẽ tạo ra cả dòng phí xe máy (x2) và cả dòng phí ô tô (x2) cho tất cả căn hộ!
3. Trong `prisma/seed.ts` (dòng 344), khi tạo hóa đơn mẫu cho căn hộ `A-1001`, code cũng đang gán cứng:
   `{ feeCategoryId: motoFee.id, title: 'Phí xe máy (2 xe)', quantity: 2, unitPrice: 100000, amount: 200000 }`.

---

## 4. Current Resident-Apartment Relationship

Hiện trạng quan hệ giữa Cư dân và Căn hộ:

1. **Liên kết cơ sở dữ liệu**:
   - `Apartment` có quan hệ 1-Nhiều với `Resident` (`residents: Resident[]`).
   - `Resident` có trường `apartmentId String?` (cho phép cư dân chưa nhận nhà hoặc đã chuyển đi có `apartmentId = null`).
2. **Quan hệ nhân thân**:
   - `relationshipToOwner`: Enum `[OWNER, FAMILY, TENANT]`.
   - `status`: Enum `[RESIDING, MOVED_OUT, TEMPORARY_ABSENT]`.
3. **Thực trạng nghiệp vụ & Giao diện**:
   - **Chưa có khái niệm "Sổ hộ khẩu điện tử"**: CSDL chưa có cờ phân định rõ ai là **Chủ hộ duy nhất** (`isHouseholdHead`) đại diện cho căn hộ. Mặc dù có `relationshipToOwner = OWNER`, nhưng một căn hộ hiện có thể có nhiều bản ghi gắn `OWNER`.
   - **Giao diện BQL** (`/apartments` & `/residents`): BQL quản lý cư dân theo danh sách bảng phẳng (flat table). Khi xem chi tiết căn hộ qua `DetailDrawer`, chỉ có danh sách tên cư dân; không thể thêm trực tiếp thành viên gia đình vào căn hộ ngay tại màn hình Căn hộ mà phải chuyển sang màn hình Cư dân tạo mới rồi chọn dropdown `apartmentId`.
   - **Giao diện Cư dân** (`/home`): Cư dân có thể xem danh sách thành viên trong căn hộ (`members: resident.apartment.residents`), nhưng chỉ là hiển thị tĩnh (read-only modal). Chủ hộ không thể khai báo thêm thành viên, không thể gửi yêu cầu báo tạm vắng hay cập nhật thông tin người thân.

---

## 5. Existing RBAC

Hệ thống phân quyền đang hoạt động dựa trên 3 lớp:

### 5.1 RBAC Roles:
- **`ADMIN`**: Toàn quyền cấu hình hệ thống, quản lý tòa nhà, tài khoản, biểu phí, duyệt xóa dữ liệu nhạy cảm.
- **`MANAGER`**: Quản lý vận hành hàng ngày, gạch nợ hóa đơn, phân công và xử lý sự cố kỹ thuật, lập hợp đồng.
- **`RESIDENT`**: Xem thông tin căn hộ của mình, thanh toán hóa đơn bằng QR, gửi báo sự cố, đọc thông báo tòa nhà.

### 5.2 Next.js Route Guard Middleware (`src/middleware.ts`):
- Sử dụng `getToken({ req, secret })` từ `next-auth/jwt`.
- Bảo vệ các đường dẫn quản lý (`/dashboard`, `/apartments`, `/residents`, `/contracts`, `/fees`, `/invoices`, `/feedbacks`, `/notifications`): Chỉ cho phép `ADMIN` hoặc `MANAGER`. Nếu `RESIDENT` truy cập sẽ tự động chuyển hướng về `/home`.
- Bảo vệ cổng cư dân (`/home`, `/resident/**`): Chỉ cho phép tài khoản đăng nhập.
- Chưa đăng nhập: Redirect về `/login?callbackUrl=...`.

### 5.3 IDOR & Object-Level Authorization (`src/lib/authorization.ts`):
Hệ thống đã triển khai các hàm kiểm tra bảo mật chống tấn công IDOR rất chặt chẽ:
- `requireRole(user, allowedRoles)`: Kiểm tra vai trò.
- `getVerifiedResidentInfo(userId)`: Truy vấn trực tiếp từ database lấy `residentId` và `apartmentId` đã xác thực (không tin tưởng tham số từ client).
- `authorizeApartmentAccess(user, targetApartmentId)`: Cư dân chỉ được xem căn hộ của mình.
- `authorizeInvoiceAccess(user, invoiceApartmentId)`: Cư dân chỉ được xem hóa đơn căn hộ mình.
- `authorizeFeedbackAccess(user, feedback)`: Cư dân chỉ được xem ticket sự cố của căn hộ mình.
- `authorizeResidentProfileAccess(user, targetResident)`: Cư dân chỉ được xem hồ sơ của mình và các thành viên cùng căn hộ.

---

## 6. Current Frontend Structure

### 6.1 Layout & Navigation:
- **Sidebar** ([`src/components/layout/Sidebar.tsx`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/components/layout/Sidebar.tsx)):
  - Hỗ trợ đóng mở (collapsed/expanded), responsive sheet trên mobile.
  - Render menu động theo Role: `adminGroups`, `managerGroups`, `residentGroups`.
- **Topbar** ([`src/components/layout/Topbar.tsx`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/components/layout/Topbar.tsx)):
  - Menu người dùng (Avatar, Tên, Role badge, Đăng xuất).
  - Dark mode toggle, chuông thông báo với số lượng chưa đọc, phím tắt tìm kiếm toàn cục (Command/Ctrl + K).

### 6.2 Bảng dữ liệu & Dialog dùng chung (`src/components/shared/`):
- `DataTable.tsx`: Hỗ trợ phân trang server-side, sắp xếp cột, chọn dòng hàng loạt, ẩn/hiện cột, skeleton loading và empty state.
- `DetailDrawer.tsx`: Drawer trượt hiển thị danh sách trường key-value có gắn badge trạng thái.
- `FormDialog.tsx`: Modal form tiêu chuẩn với submit button loading state.
- `ConfirmDialog.tsx`: Hộp thoại xác nhận thao tác nguy hiểm (xóa bản ghi).
- `FilterBar.tsx`: Thanh công cụ tìm kiếm và lọc dữ liệu.
- `StatusBadge.tsx`: Hiển thị badge màu chuẩn theo từng loại trạng thái (Apartment, Resident, Invoice, Ticket...).

### 6.3 Phân hệ Ban Quản Lý (Management):
- `/apartments`: Quản lý căn hộ (CRUD, lọc theo tòa, tầng, trạng thái).
- `/residents`: Quản lý cư dân (CRUD, CCCD, SĐT, quan hệ chủ hộ).
- `/contracts`: Quản lý hợp đồng thuê/bán, cảnh báo hết hạn thông minh.
- `/fees`: Cấu hình biểu phí vận hành tòa nhà.
- `/invoices`: Quản lý hóa đơn, phát hành hóa đơn hàng loạt, xem chi tiết và in ấn.
- `/feedbacks`: Quản lý sự cố, quy trình SLA, trao đổi bình luận nội bộ.
- `/notifications`: Soạn thảo và phát thông báo tòa nhà.

### 6.4 Phân hệ Cư Dân (Resident):
- `/home`: Dashboard tổng hợp của cư dân (Căn hộ, Hóa đơn mới nhất, QR Pay mô phỏng, Phản ánh sự cố, Danh sách người thân, Tin tức tòa nhà).
- `/resident/invoices`: Danh sách hóa đơn của căn hộ.
- `/resident/feedback`: Báo cáo sự cố và đánh giá sao dịch vụ.
- `/resident/notifications`: Hộp thư thông báo.

---

## 7. Vehicle Integration Points

Để tích hợp module **Quản lý Phương tiện & Thẻ Gửi Xe** một cách chuẩn xác:

### 7.1 Lược đồ Dữ liệu mới (Prisma Schema):
- **Model `Vehicle`**:
  - `id`: String (PK, CUID)
  - `plateNumber`: String (Unique, e.g. "29A-123.45" hoặc "51F-999.88")
  - `type`: Enum `VehicleType` (`CAR`, `MOTORBIKE`, `ELECTRIC_BIKE`, `BICYCLE`)
  - `brand`: String? (VD: "Honda", "Toyota", "VinFast")
  - `model`: String? (VD: "Wave Alpha", "Vios", "VF8")
  - `color`: String?
  - `parkingCardNumber`: String? (Unique/Index, mã thẻ từ RFID gửi xe)
  - `status`: Enum `VehicleStatus` (`PENDING`, `ACTIVE`, `LOCKED`, `REJECTED`)
  - `registrationDate`: DateTime (mặc định `now()`)
  - `apartmentId`: String (FK -> `Apartment.id`, `onDelete: Cascade`)
  - `residentId`: String? (FK -> `Resident.id`, chủ phương tiện, `onDelete: SetNull`)
  - `images`: String[] (ảnh cavet / đăng ký xe)
  - `createdAt`, `updatedAt`: DateTime

### 7.2 Điểm tích hợp luồng Tính Hóa Đơn (Billing Engine) — *Quan Trọng Nhất*:
Trong [`src/modules/invoice/invoice.service.ts`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/modules/invoice/invoice.service.ts):
- Khi duyệt qua danh mục phí:
  - Nếu `fee.code === 'PARKING_CAR'`: Đếm số xe của căn hộ có `type === 'CAR'` và `status === 'ACTIVE'`.
  - Nếu `fee.code === 'PARKING_MOTO'`: Đếm số xe của căn hộ có `type in ['MOTORBIKE', 'ELECTRIC_BIKE']` và `status === 'ACTIVE'`.
  - Nếu phí là loại chung `fee.unit === 'PER_VEHICLE'`: Đếm tổng số phương tiện đang hoạt động của căn hộ đó.
  - **Quy tắc tính**:
    - Nếu số lượng xe = 0: Không tạo dòng phí trông giữ xe cho căn hộ đó (hoặc hiển thị quantity = 0 với amount = 0).
    - Nếu số lượng xe > 0: `quantity = count`, `amount = count * unitPrice`. Ghi chú rõ: `note: "Gồm ${count} xe ô tô/xe máy: [danh sách biển số]"`.
  - **Triệt tiêu hoàn toàn code hardcode `quantity = 2`**.

### 7.3 Backend Module mới (`src/modules/vehicle/`):
- `vehicle.types.ts`: Định nghĩa filter, DTO tạo mới, cập nhật.
- `vehicle.schema.ts`: Zod schema kiểm tra biển số xe Việt Nam hợp lệ, loại xe, mã thẻ.
- `vehicle.repository.ts`: Truy vấn CRUD, đếm xe theo căn hộ, tìm theo biển số xe/mã thẻ.
- `vehicle.service.ts`: Nghiệp vụ cấp thẻ, duyệt đăng ký xe, khóa/mở thẻ xe.

### 7.4 API Route Handlers:
- `GET /api/vehicles`: Lấy danh sách xe (BQL xem tất cả, Cư dân chỉ xem xe căn hộ mình).
- `POST /api/vehicles`: Đăng ký phương tiện mới (BQL tạo trực tiếp hoặc Cư dân gửi đơn đăng ký).
- `GET /api/vehicles/[id]`: Chi tiết xe.
- `PATCH /api/vehicles/[id]`: Cập nhật thông tin phương tiện.
- `PATCH /api/vehicles/[id]/status`: BQL duyệt/khóa/kích hoạt thẻ xe (`status: ACTIVE | LOCKED | REJECTED`).
- `DELETE /api/vehicles/[id]`: Xóa phương tiện / hủy đăng ký gửi xe.

### 7.5 Giao diện Người dùng (UI):
- **Phía BQL**:
  - Trang mới `/vehicles`: Quản lý danh sách phương tiện toàn tòa nhà, thống kê tổng số ô tô, xe máy, tỷ lệ lấp đầy bãi đỗ xe; duyệt đơn đăng ký xe mới, gán mã thẻ từ RFID.
  - Menu Sidebar: Thêm mục **"Quản lý Phương tiện"** với icon `Car` vào nhóm *Vận hành*.
- **Phía Cư Dân**:
  - Trang Cư dân `/home`: Bổ sung Card **"Phương tiện căn hộ"** hiển thị các xe đã đăng ký, biển số, mã thẻ gửi xe và trạng thái thẻ.
  - Modal **"Đăng ký gửi xe mới"**: Cư dân tự nhập thông tin xe và biển số để gửi BQL duyệt.

---

## 8. Household Integration Points

Để nâng cấp quản lý nhân khẩu thành **Sổ Hộ Khẩu Điện Tử**:

### 8.1 Cải tiến CSDL (Prisma Schema):
- Bổ sung trường trên model `Resident`:
  - `isHouseholdHead`: Boolean (mặc định `false`). Đảm bảo mỗi căn hộ chỉ có duy nhất 1 chủ hộ đại diện.
  - `stayStartDate`: DateTime? (ngày bắt đầu cư trú / chuyển đến).
  - `stayEndDate`: DateTime? (hạn tạm trú đối với khách thuê hoặc người tạm trú).
  - `temporaryAbsentReason`: String? (lý do tạm vắng: đi học, công tác nước ngoài...).

### 8.2 Backend Module & Nghiệp vụ:
- Trong `apartment.repository.ts`: Mở rộng query `findById` và `findAll` để include chi tiết danh sách thành viên hộ gia đình (`residents`) sắp xếp ưu tiên Chủ hộ lên đầu (`isHouseholdHead: desc`).
- Trong `resident.service.ts`:
  - Nghiệp vụ thêm thành viên vào căn hộ: Tự động đồng bộ quan hệ nhân thân, kiểm tra nếu căn hộ đã có chủ hộ thì thành viên mới phải có vai trò `FAMILY` hoặc `TENANT`.
  - Nghiệp vụ chuyển quyền chủ hộ: Hoán đổi vai trò `isHouseholdHead` giữa các thành viên một cách an toàn trong `prisma.$transaction`.
  - Nghiệp vụ khai báo tạm trú / tạm vắng: Cập nhật trạng thái `ResidentStatus: TEMPORARY_ABSENT` hoặc `MOVED_OUT`.

### 8.3 Giao diện BQL (Management Portal):
- Nâng cấp màn hình Căn hộ `/apartments`:
  - Trong `DetailDrawer` (hoặc mở rộng modal chi tiết): Bổ sung tab **"Sổ Hộ Khẩu / Thành viên"** trực quan.
  - Cho phép BQL bấm **"Thêm thành viên vào căn hộ"** ngay tại đây mà không cần rời màn hình Căn hộ.
  - Hiển thị rõ danh sách thành viên: Ai là chủ hộ (Head badge), CCCD, SĐT, quan hệ, trạng thái tạm trú/thường trú.

### 8.4 Giao diện Cư Dân (Resident Portal):
- Trong trang `/home`:
  - Nâng cấp modal "Thành viên gia đình" hiện tại từ chế độ chỉ xem (read-only) thành giao diện quản lý hộ gia đình tương tác.
  - Chủ hộ có thể bấm **"Khai báo thêm thành viên"** (nhập họ tên, CCCD, quan hệ, SĐT) để đăng ký cho người thân.
  - Chủ hộ có thể gửi thông báo **"Báo tạm vắng"** cho thành viên đi xa.

---

## 9. Potential Breaking Changes & Rủi ro Cần kiểm soát

1. **Rủi ro tính sai hóa đơn khi xóa hardcode `quantity = 2`**:
   - *Rủi ro*: Nếu đổi sang đếm xe tự động mà căn hộ mẫu chưa được seed dữ liệu xe, hóa đơn tháng có thể bị thiếu dòng tiền gửi xe hoặc phát sinh lỗi `NaN`/`null`.
   - *Biện pháp kiểm soát*: Triển khai fallback an toàn: Nếu căn hộ có 0 xe loại đó, số tiền = 0. Cập nhật `prisma/seed.ts` để gán sẵn xe thực tế cho các căn hộ `A-1001`, `A-1002`, `B-2001` trước khi sinh hóa đơn mẫu.
2. **Rủi ro Migration Database Schema**:
   - *Rủi ro*: Thêm model `Vehicle` và các trường mới vào `Resident` có thể làm ảnh hưởng dữ liệu đang có nếu các trường mới là bắt buộc (non-nullable).
   - *Biện pháp kiểm soát*: Mọi trường bổ sung trên `Resident` (`stayStartDate`, `isHouseholdHead`, v.v.) đều có giá trị mặc định `@default(...)` hoặc là nullable `?`. Sử dụng `npx prisma db push` an toàn trong môi trường phát triển.
3. **Rủi ro Route Guard Middleware**:
   - *Rủi ro*: Thêm route mới `/vehicles` và `/api/vehicles/**` nếu không cấu hình trong `src/middleware.ts` thì route có thể bị truy cập trái phép hoặc bị chặn nhầm.
   - *Biện pháp kiểm soát*: Bổ sung đường dẫn `/vehicles/:path*` vào danh sách `isManagerRoute` và matcher của middleware.
4. **Bảo mật IDOR trên dữ liệu Phương tiện**:
   - *Rủi ro*: Cư dân có thể xem trộm hoặc đăng ký xe gán vào căn hộ của người khác.
   - *Biện pháp kiểm soát*: Viết hàm `authorizeVehicleAccess` trong `src/lib/authorization.ts` để kiểm tra quyền sở hữu căn hộ trước khi thực hiện bất kỳ thao tác nào.

---

## 10. Recommended Implementation Order (Lộ trình Thực hiện Khuyến nghị)

Để đảm bảo hệ thống luôn ổn định và không làm gián đoạn các chức năng đang chạy, các bước triển khai nên tuân theo trình tự:

```
[Bước 1: Audit & Thống nhất Kế hoạch (HIỆN TẠI)]
                    │
                    ▼
[Bước 2: Cập nhật Database Schema (`prisma/schema.prisma`)]
  - Thêm model Vehicle, enums VehicleType, VehicleStatus
  - Mở rộng fields cho Resident (isHouseholdHead, stayDates)
  - Chạy `npx prisma db push` và `npx prisma generate`
                    │
                    ▼
[Bước 3: Xây dựng Backend Module Vehicle & Household APIs]
  - Viết `src/modules/vehicle/*` (Types, Schema, Repo, Service)
  - Viết route handlers `src/app/api/vehicles/**` và IDOR authorization
  - Bổ sung helper quản lý thành viên căn hộ trong `src/modules/apartment/*`
                    │
                    ▼
[Bước 4: Cải tiến Engine Tính Hóa Đơn (`invoice.service.ts`)]
  - Thay thế `quantity = 2` bằng truy vấn đếm xe thực tế theo từng loại
  - Cập nhật seed script (`prisma/seed.ts`) đồng bộ xe và hóa đơn
                    │
                    ▼
[Bước 5: Xây dựng Client Service & React Query Hooks]
  - `src/services/vehicle.service.ts`
  - `src/hooks/use-vehicles.ts`
                    │
                    ▼
[Bước 6: Phát triển Giao diện Quản Lý Ban Quản Lý (Admin/Manager)]
  - Trang Quản lý Phương tiện `/vehicles` (DataTable, Drawer, Form cấp thẻ)
  - Cập nhật Sidebar navigation (`Sidebar.tsx`)
  - Bổ sung tab/drawer Hộ gia đình trong `/apartments`
                    │
                    ▼
[Bước 7: Nâng cấp Giao diện Cư Dân (Resident Portal)]
  - Card Phương tiện & Modal Đăng ký xe mới trên `/home`
  - Quản lý thành viên gia đình & Khai báo tạm trú/tạm vắng trên `/home`
                    │
                    ▼
[Bước 8: Kiểm thử & Hoàn thiện Tài liệu (Testing & Verification)]
  - Test luồng tính tiền hóa đơn xe tự động
  - Test IDOR security và chạy kiểm thử tự động
  - Cập nhật tài liệu ERD (`docs/erd.md`)
```

---

## 11. Files That Will Need Modification

### 11.1 Các file hiện hữu cần cập nhật:
1. `prisma/schema.prisma`: Thêm model `Vehicle`, các enum `VehicleType`, `VehicleStatus`, liên kết quan hệ vào `Apartment` và `Resident`.
2. `prisma/seed.ts`: Seed dữ liệu mẫu các phương tiện (ô tô, xe máy) gán vào căn hộ `A-1001`, `A-1002`, `B-2001`, thay thế dữ liệu hóa đơn hardcode cũ.
3. `src/modules/invoice/invoice.service.ts`: Xóa dòng hardcode `quantity = 2` (dòng 91-92), thay bằng hàm đếm phương tiện active thực tế của căn hộ.
4. `src/modules/apartment/apartment.repository.ts`: Bổ sung include `vehicles` và `residents` có cấu trúc hộ gia đình.
5. `src/modules/resident/resident.schema.ts`: Bổ sung validation cho các trường `isHouseholdHead`, `stayStartDate`.
6. `src/modules/resident-dashboard/resident-dashboard.service.ts`: Trả thêm mảng `vehicles` của căn hộ cho cổng cư dân.
7. `src/lib/authorization.ts`: Thêm hàm bảo vệ `authorizeVehicleAccess`.
8. `src/middleware.ts`: Bổ sung `/vehicles/:path*` vào danh sách route được bảo vệ.
9. `src/components/layout/Sidebar.tsx`: Thêm mục menu "Quản lý Phương tiện" cho BQL và Cư dân.
10. `src/app/(management)/apartments/page.tsx`: Thêm hiển thị danh sách thành viên hộ gia đình và phương tiện trong `DetailDrawer`.
11. `src/app/(resident)/home/page.tsx`: Thêm khối hiển thị xe của căn hộ và chức năng đăng ký thêm thành viên / đăng ký thêm xe.
12. `docs/erd.md`: Cập nhật sơ đồ ERD mới.

### 11.2 Các file mới cần tạo:
1. `src/modules/vehicle/vehicle.types.ts`
2. `src/modules/vehicle/vehicle.schema.ts`
3. `src/modules/vehicle/vehicle.repository.ts`
4. `src/modules/vehicle/vehicle.service.ts`
5. `src/app/api/vehicles/route.ts`
6. `src/app/api/vehicles/[id]/route.ts`
7. `src/app/api/vehicles/[id]/status/route.ts`
8. `src/services/vehicle.service.ts`
9. `src/hooks/use-vehicles.ts`
10. `src/app/(management)/vehicles/page.tsx`

---

## 12. Files That Should NOT Be Modified

Để đảm bảo tính ổn định và tính cô lập của hệ thống, các file sau **TUYỆT ĐỐI GIỮ NGUYÊN**:
1. `src/lib/auth.ts`: Cấu hình xác thực NextAuth JWT & Credentials đã ổn định và đầy đủ session metadata (`id`, `role`, `apartmentId`, `residentId`).
2. `src/lib/api-response.ts`: Cấu trúc format phản hồi API (`apiSuccess`, `apiError`, sanitize error) đang hoạt động chuẩn cho toàn bộ hệ thống.
3. `src/lib/prisma.ts`: Singleton Prisma client, không cần chỉnh sửa.
4. `src/modules/auth/*`: Phân hệ xác thực đăng nhập / đăng ký.
5. `src/modules/contract/*` & `src/app/(management)/contracts/*`: Quản lý hợp đồng thuê/bán căn hộ, hoạt động độc lập và không liên quan đến phương tiện.
6. `src/modules/feedback/*` & `src/app/(management)/feedbacks/*`: Quy trình quản lý sự cố và SLA tickets.
7. `src/modules/notification/*` & `src/app/(management)/notifications/*`: Hệ thống thông báo.
8. `src/components/ui/*`: Toàn bộ các UI component nguyên tử shadcn (Button, Dialog, Dropdown, Table, Input...) giữ nguyên để bảo đảm tính nhất quán giao diện.
9. `src/modules/dashboard/*`: Thống kê tài chính và analytics tổng quan.

---
*Báo cáo Audit hoàn tất ngày 11/09/2026 bởi Antigravity Agent. Sẵn sàng cho việc xem xét và phê duyệt kế hoạch Phase 1.*
