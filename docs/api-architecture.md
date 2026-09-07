# TÀI LIỆU THIẾT KẾ KIẾN TRÚC API VÀ MA TRẬN ÁNH XẠ DỮ LIỆU FRONTEND - BACKEND

> **Dự án:** Smart Apartment Management System  
> **Phiên bản:** 2.0 (Harden Architecture Edition)  
> **Mục tiêu:** Định nghĩa chuẩn mực kỹ thuật, luồng dữ liệu, quy tắc phân lớp và ma trận ánh xạ trường dữ liệu (Data Field Mapping) chi tiết giữa Giao diện (Frontend) và Cơ sở dữ liệu (Backend/Database).

---

## 1. QUY CHUẨN KIẾN TRÚC PHÂN LỚP (LAYERED SYSTEM ARCHITECTURE)

Hệ thống được tổ chức phân lớp nghiêm ngặt, mỗi lớp có trách nhiệm riêng biệt và không vượt cấp:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UI Components (React Server / Client Components, Tailwind)│
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 2. Data Fetching & Caching (TanStack React Query Hooks)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Client API Services (src/services/*.service.ts)          │
│    - Sử dụng apiClient chuẩn hóa                             │
│    - Tự động đính kèm Token và xử lý ApiResponse wrapper     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│ 4. Route Handlers (src/app/api/**/route.ts)                 │
│    - Kiểm tra Session (NextAuth getServerSession)           │
│    - Rate Limiting (Token Bucket)                           │
│    - Xác thực Role & Ownership (RBAC & IDOR Protection)     │
│    - Validate Body/Query/Params bằng Zod Schemas            │
│    - Gọi Service nghiệp vụ tương ứng                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 5. Domain Services (src/modules/*/*.service.ts)             │
│    - Xử lý toàn bộ Business Logic & Quy tắc nghiệp vụ       │
│    - Tính toán tài chính (Total = Sum of item amounts)      │
│    - Điều phối Atomic Database Transactions (prisma.$tx)    │
│    - Ghi nhận nhật ký kiểm toán (AuditLogService)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 6. Repositories (src/modules/*/*.repository.ts)             │
│    - Tương tác với Prisma ORM Client                        │
│    - Cung cấp Atomic Conditional Updates                    │
│    - Nhận optional Prisma.TransactionClient                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQL (via Prisma Engine)
┌──────────────────────────────▼──────────────────────────────┐
│ 7. Database Engine (PostgreSQL with B-Tree Indexes)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. CHUẨN ĐỊNH DẠNG REQUEST VÀ RESPONSE (CONTRACT STANDARDS)

### 2.1. Chuẩn phản hồi thành công (`apiSuccess`)
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 2.2. Chuẩn phản hồi lỗi (`apiError`)
```typescript
interface ApiErrorResponse {
  success: false;
  errorCode: string; // e.g. 'VALIDATION_ERROR', 'FORBIDDEN', 'NOT_FOUND', 'RATE_LIMIT_EXCEEDED'
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

---

## 3. MA TRẬN ÁNH XẠ DỮ LIỆU FRONTEND <-> BACKEND (DATA FIELD MAPPING)

Dưới đây là bảng ánh xạ chi tiết từng trường dữ liệu hiển thị trên giao diện người dùng tương ứng với trường dữ liệu của API và cột trong cơ sở dữ liệu PostgreSQL.

### 3.1. Management Dashboard & KPI Metrics

| Nhãn Giao Diện (FE Label) | Vị Trí Hiển Thị | Trường Trả Về API (`GET /api/dashboard/stats`) | Kiểu Dữ Liệu | Bảng & Cột Database Nguồn (PostgreSQL) | Ghi Chú Tính Toán |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tổng số căn hộ** | KPI Card 1 | `totalApartments` | `number` | `apartments.count()` | Tổng số lượng căn hộ trong hệ thống |
| **Tỷ lệ lấp đầy** | KPI Card 2 | `occupancyRate` | `number` (float %) | `occupied / totalApartments * 100` | Số căn hộ có trạng thái `OCCUPIED` / Tổng số căn |
| **Tổng số cư dân** | KPI Card 3 | `totalResidents` | `number` | `residents.count({ status: 'RESIDING' })` | Cư dân đang thực tế cư trú |
| **Doanh thu tháng** | KPI Card 4 | `revenueThisMonth` | `number` (VNĐ) | `SUM(invoices.totalAmount)` | Hóa đơn có `status: 'PAID'` và `billingMonth: currentMonth` |
| **Tỷ lệ tăng trưởng DT** | KPI Card 4 Sub | `revenueGrowthRate` | `number` (%) | So sánh với tháng trước | `((DT tháng này - DT tháng trước) / DT tháng trước) * 100` |
| **Tổng công nợ tồn đọng** | KPI Card 5 | `totalDebt` | `number` (VNĐ) | `SUM(invoices.totalAmount)` | Hóa đơn có `status: 'UNPAID'` hoặc `OVERDUE` |
| **Sự cố đang xử lý** | KPI Card 6 | `activeTickets` | `number` | `feedbacks.count({ status: ['NEW', 'ASSIGNED', 'PROCESSING'] })` | Sự cố chưa đóng |
| **Biểu đồ doanh thu** | Chart Doanh thu | `monthlyRevenue[i].month`, `monthlyRevenue[i].revenue` | `string`, `number` | Bảng `invoices` nhóm theo `billingMonth` | Doanh thu 6 tháng gần nhất |
| **Cơ cấu căn hộ** | Pie Chart | `occupancyBreakdown.occupied`, `vacant`, `reserved` | `number` | Bảng `apartments` nhóm theo `status` | Trạng thái phòng: Đang ở, Trống, Đã đặt cọc |

---

### 3.2. Resident Portal & Resident Home

| Nhãn Giao Diện (FE Label) | Vị Trí Hiển Thị | Trường Trả Về API (`GET /api/residents/me`) | Kiểu Dữ Liệu | Cột Database Nguồn (`residents`, `apartments`) | Ghi Chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tên cư dân** | Header & Profile | `fullName` | `string` | `residents.fullName` | Localized "Xin chào, [Họ Tên] 👋" |
| **Mã căn hộ** | Apartment Card | `apartment.code` | `string` | `apartments.code` | Ví dụ: "A-1001" |
| **Tòa nhà & Tầng** | Apartment Card | `apartment.building`, `apartment.floor` | `string`, `number` | `apartments.building`, `apartments.floor` | Ví dụ: "Tòa A • Tầng 10" |
| **Diện tích căn hộ** | Apartment Card | `apartment.area` | `number` (m²) | `apartments.area` | Diện tích thông thủy |
| **Vai trò cư trú** | Apartment Card | `relationshipToOwner` | `string` (Enum) | `residents.relationshipToOwner` | `OWNER`, `TENANT`, `FAMILY_MEMBER` |
| **Số thành viên** | Apartment Card | `apartment.residents.length` | `number` | `COUNT(residents.apartmentId)` | Số người cùng cư trú trong căn hộ |
| **Hóa đơn gần nhất** | Billing Card | `latestInvoice.code`, `latestInvoice.totalAmount` | `string`, `number` | `invoices.code`, `invoices.totalAmount` | Lấy hóa đơn kỳ mới nhất của căn hộ |
| **Trạng thái thanh toán** | Billing Card | `latestInvoice.status` | `string` (Enum) | `invoices.status` | `UNPAID`, `PAID`, `OVERDUE` |
| **Cơ cấu tiền dịch vụ** | Bill Breakdown | `latestInvoice.items` | `Array<InvoiceItem>` | `invoice_items` | Bao gồm phí quản lý, xe, điện, nước |

---

### 3.3. Hóa Đơn & Quản Lý Thu Phí (Invoices & Billing)

| Nhãn Giao Diện (FE Label) | Trường Dữ Liệu API | Kiểu Dữ Liệu | Bảng Database & Cột | Ràng Buộc Xác Thực (Validation Rule) |
| :--- | :--- | :--- | :--- | :--- |
| **Mã hóa đơn** | `code` | `string` | `invoices.code` | Server tự sinh dạng: `INV-YYYYMM-XXXX` (Unique) |
| **Căn hộ áp dụng** | `apartmentId` | `string` | `invoices.apartmentId` | Bắt buộc, Foreign Key tới bảng `apartments` |
| **Kỳ thanh toán** | `billingMonth` | `string` | `invoices.billingMonth` | Định dạng regex `^\d{4}-(0[1-9]\|1[0-2])$` |
| **Hạn nộp tiền** | `dueDate` | `string` (ISO Date) | `invoices.dueDate` | Chuỗi thời gian hợp lệ |
| **Tổng số tiền** | `totalAmount` | `number` | `invoices.totalAmount` | **Tính toán 100% trên server** $= \sum (\text{qty} \times \text{price})$ |
| **Trạng thái hóa đơn** | `status` | `InvoiceStatus` | `invoices.status` | `UNPAID`, `PAID`, `OVERDUE`, `CANCELLED` |
| **Ngày thanh toán** | `paidAt` | `DateTime?` | `invoices.paidAt` | Cập nhật tự động khi gọi `processPayment` |
| **Phương thức TT** | `paymentMethod` | `PaymentMethod?` | `invoices.paymentMethod` | `CASH`, `BANK_TRANSFER`, `VNPAY`, `MOMO` |
| **Mã giao dịch** | `transactionId` | `string?` | `invoices.transactionId` | Mã tham chiếu ngân hàng / cổng thanh toán |
| **Danh mục mục phí** | `items[i].title` | `string` | `invoice_items.title` | Tối thiểu 2 ký tự |
| **Số lượng** | `items[i].quantity` | `number` | `invoice_items.quantity` | Float dương $> 0$ |
| **Đơn giá** | `items[i].unitPrice` | `number` | `invoice_items.unitPrice` | Float không âm $\ge 0$ |

---

### 3.4. Quản Lý Sự Cố & Bảo Trì (Maintenance Tickets / Feedbacks)

| Nhãn Giao Diện (FE Label) | Trường Dữ Liệu API | Kiểu Dữ Liệu | Bảng Database & Cột | Ràng Buộc & Quyền Hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Mã phiếu** | `id` | `string` | `feedbacks.id` | Khóa chính CUID |
| **Tiêu đề sự cố** | `title` | `string` | `feedbacks.title` | Min 5 ký tự |
| **Phân loại** | `category` | `FeedbackCategory` | `feedbacks.category` | `ELECTRIC`, `WATER`, `ELEVATOR`, `SECURITY`, `SANITATION`, `OTHER` |
| **Mức độ ưu tiên** | `priority` | `TicketPriority` | `feedbacks.priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` (Chỉ Quản lý được sửa) |
| **Trạng thái quy trình** | `status` | `FeedbackStatus` | `feedbacks.status` | `NEW` $\rightarrow$ `ASSIGNED` $\rightarrow$ `PROCESSING` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED` (hoặc `REJECTED`) |
| **Thời hạn cam kết (SLA)** | `slaDueAt` | `DateTime` | `feedbacks.slaDueAt` | Tự động tính toán theo Priority (4h, 8h, 24h, 48h) |
| **Trạng thái SLA** | `slaStatus` | `string` (Computed) | Tính tại Service | `ON_TRACK`, `APPROACHING` ($< 4\text{h}$), `OVERDUE` |
| **Nhân viên phụ trách** | `assignedStaff` | `User?` | `feedbacks.assignedStaffId` | Liên kết bảng `users` |
| **Ghi chú nội bộ** | `comments[i].isInternal` | `boolean` | `ticket_comments.isInternal` | **Bảo mật tuyệt đối:** Cư dân không bao giờ nhận trường này |
| **Lý do từ chối** | `rejectReason` | `string?` | `feedbacks.rejectReason` | Bắt buộc khi chuyển trạng thái sang `REJECTED` |
| **Ghi chú giải quyết** | `resolutionNote` | `string?` | `feedbacks.resolutionNote` | Bắt buộc khi đánh dấu `RESOLVED` |
| **Đánh giá của cư dân** | `residentRating` | `number?` (1-5) | `feedbacks.residentRating` | Cư dân gửi khi nghiệm thu đóng ticket |

---

### 3.5. Trung Tâm Cảnh Báo Vận Hành (Smart Operations Alerts)

| Nhãn Giao Diện | Trường Dữ Liệu API (`GET /api/alerts`) | Kiểu Dữ Liệu | Logic & Nguồn Phát Hiện | Mức Độ Nghiêm Trọng |
| :--- | :--- | :--- | :--- | :--- |
| **Hợp đồng hết hạn** | `type: 'CONTRACT_EXPIRATION'` | `OperationalAlert` | `contracts.endDate < NOW()` | `CRITICAL` |
| **Hợp đồng sắp hết hạn** | `type: 'CONTRACT_EXPIRATION'` | `OperationalAlert` | `contracts.endDate <= NOW() + 7 days` | `CRITICAL` |
| **Hợp đồng cần tái ký** | `type: 'CONTRACT_EXPIRATION'` | `OperationalAlert` | `contracts.endDate <= NOW() + 30 days` | `WARNING` |
| **Hóa đơn quá hạn nặng** | `type: 'INVOICE_OVERDUE'` | `OperationalAlert` | `invoices.dueDate < NOW() - 15 days` | `CRITICAL` |
| **Công nợ căn hộ cao** | `type: 'INVOICE_OVERDUE'` | `OperationalAlert` | `invoices.totalAmount >= 5,000,000` | `WARNING` |
| **Sự cố vi phạm SLA** | `type: 'TICKET_SLA'` | `OperationalAlert` | `feedbacks.slaDueAt < NOW()` | `CRITICAL` |
| **Sự cố khẩn cấp mới** | `type: 'TICKET_SLA'` | `OperationalAlert` | `feedbacks.priority == 'URGENT'` | `CRITICAL` |

---

## 4. TỔNG KẾT BẢO MẬT & HƯỚNG DẪN MỞ RỘNG (SECURITY CHECKLIST FOR DEVELOPERS)

Mỗi khi tạo mới một API endpoint hoặc Service trong tương lai, lập trình viên **bắt buộc tuân thủ 5 bước:**
1. **Validation:** Khai báo Zod schema tại `src/modules/<module>/<module>.schema.ts` và gọi `.parse()` trên toàn bộ input.
2. **Authentication:** Gọi `getServerSession(authOptions)`.
3. **Role & IDOR Check:**
   - Nếu endpoint cho quản lý: Dùng `requireRole(user, ['ADMIN', 'MANAGER'])`.
   - Nếu endpoint có cư dân: Kiểm tra ownership qua `authorize<Resource>Access`.
4. **Service Delegation:** Tuyệt đối không query `prisma` trực tiếp từ Route Handler; chuyển sang gọi Service.
5. **Standardized Response:** Trả lời bằng `apiSuccess()` hoặc `apiError()`, không trả lời plain JSON thủ công.
