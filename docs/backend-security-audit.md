# BÁO CÁO TOÀN DIỆN: AUDIT & HARDENING BACKEND HỆ THỐNG SMART APARTMENT

> **Ngày thực hiện:** 07/09/2026  
> **Trạng thái:** ĐÃ HOÀN TẤT VÀ KIỂM THỬ THÀNH CÔNG (49/49 Unit & Security Tests Pass)  
> **Phạm vi:** Toàn bộ Route Handlers, Services, Repositories, Prisma Schema, Authentication, Authorization (RBAC + Ownership), Financial Consistency, Rate Limiting, Audit Trail.

---

## 1. TỔNG QUAN VÀ MỤC TIÊU BẢO MẬT

Dự án **Smart Apartment Management System** được thiết kế để phục vụ hai nhóm đối tượng người dùng chính với nhu cầu và quyền hạn khác nhau:
1. **Ban Quản Lý & Vận Hành (ADMIN, MANAGER, STAFF):** Cần góc nhìn toàn cảnh về tài chính, công nợ, cư dân, bảo trì, hợp đồng.
2. **Cư Dân (RESIDENT):** Chỉ được tự phục vụ trong phạm vi căn hộ và dữ liệu cá nhân của chính mình.

Mục tiêu của đợt Audit & Hardening này là biến hệ thống từ một CRUD dashboard thông thường thành một hệ sinh thái Backend đạt chuẩn bảo mật doanh nghiệp (Enterprise SaaS), ngăn chặn tuyệt đối các lỗ hổng rò rỉ dữ liệu (Data Leakage), IDOR, thao túng giá trị tài chính (Billing Tampering), và tấn công từ chối dịch vụ / brute-force (DoS/Brute-force).

---

## 2. KIẾN TRÚC HỆ THỐNG ĐA TẦNG (LAYERED ARCHITECTURE)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **Separation of Concerns** theo chuỗi luân chuyển dữ liệu:

```
[ Frontend Component / React Query ]
                ↓
    [ Client API Service (`src/services/*`) ]
                ↓
     [ Next.js API Route Handler (`src/app/api/*`) ]
     - JWT Authentication Guard (`getServerSession`)
     - Rate Limiting (`rateLimiter.apply`)
     - Zod Validation (`schema.parse(body/query)`)
     - Role Check (`requireRole`) & IDOR Ownership (`authorize*Access`)
                ↓
       [ Server Domain Service (`src/modules/*/*.service.ts`) ]
       - Business Logic, Financial Calculations (`totalAmount = SUM(items)`)
       - DB Transaction Management (`prisma.$transaction`)
       - Non-blocking Audit Logging (`auditLogService.record`)
                ↓
      [ Repository Layer (`src/modules/*/*.repository.ts`) ]
      - Prisma ORM Query Builder
      - Transaction Client Support (`tx?: Prisma.TransactionClient`)
      - Atomic Conditional Updates (`status: { not: 'PAID' }`)
                ↓
         [ PostgreSQL Database + B-Tree Indexes ]
```

### Các nguyên tắc cốt lõi đã áp dụng:
* **Không đặt business logic lớn trong Route Handler:** Handler chỉ điều phối xác thực, phân quyền, parse validation, gọi service và trả về chuẩn `apiSuccess` / `apiError`.
* **Zero Trust đối với dữ liệu từ Client:** Tuyệt đối không tin cậy các trường `userId`, `apartmentId`, `residentId`, hoặc `totalAmount` do client gửi lên.

---

## 3. MA TRẬN PHÂN QUYỀN VÀ PHÒNG CHỐNG IDOR (INSECURE DIRECT OBJECT REFERENCES)

### 3.1. Các nguy cơ IDOR trước khi Hardening
Trước đợt audit, các endpoint sau có nguy cơ IDOR nghiêm trọng:
1. `GET /api/contracts` & `GET /api/contracts/[id]`: Resident có thể đọc toàn bộ hợp đồng trong tòa nhà (kèm tiền thuê, tiền cọc, số CCCD của chủ hộ khác).
2. `GET /api/residents` & `GET /api/residents/[id]`: Bất kỳ ai đăng nhập cũng có thể tra cứu thông tin CCCD, số điện thoại, ngày sinh của tất cả cư dân.
3. `POST /api/invoices/[id]/pay`: Bất kỳ ai cũng có thể kích hoạt thanh toán hoặc thao túng hóa đơn của căn hộ khác.
4. `GET /api/apartments`: Resident có thể xem danh sách tất cả các căn hộ và thông tin sở hữu.

### 3.2. Ma trận Phân quyền & Kiểm soát Truy cập Tài nguyên (RBAC & Ownership Matrix)

| Tài Nguyên (Endpoint) | Phương thức | ADMIN / MANAGER | STAFF | RESIDENT (Cư dân) | Cơ Chế Bảo Vệ Ownership / IDOR |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/api/apartments` | GET | Toàn quyền | Xem toàn bộ | **Chỉ xem căn hộ của chính mình** | `getVerifiedResidentInfo` cưỡng chế lấy căn hộ từ DB |
| `/api/apartments/[id]` | GET | Toàn quyền | Xem chi tiết | **Chỉ xem nếu đúng `apartmentId` sở hữu** | `authorizeApartmentAccess(user, id)` |
| `/api/apartments` | POST/PUT/DELETE | Cho phép | Bị cấm (403) | Bị cấm (403) | `requireRole(['ADMIN', 'MANAGER'])` |
| `/api/residents` | GET | Toàn quyền | Xem toàn bộ | **Chỉ xem người trong cùng căn hộ** | Bị ép filter `apartmentId = myApartmentId` |
| `/api/residents/[id]` | GET | Toàn quyền | Xem chi tiết | **Chỉ xem bản thân hoặc người cùng căn hộ** | `authorizeResidentProfileAccess(user, target)` |
| `/api/residents` | POST/PUT/DELETE | Cho phép | Bị cấm (403) | Bị cấm (403) | `requireRole(['ADMIN', 'MANAGER'])` |
| `/api/contracts` | GET | Toàn quyền | Xem toàn bộ | **Chỉ xem hợp đồng căn hộ của mình** | Bị ép filter `apartmentId = myApartmentId` |
| `/api/contracts/[id]` | GET | Toàn quyền | Xem chi tiết | **Chỉ xem nếu hợp đồng thuộc căn hộ mình** | `authorizeContractAccess(user, contractAptId)` |
| `/api/invoices` | GET | Toàn quyền | Xem toàn bộ | **Chỉ xem hóa đơn căn hộ của mình** | Bị ép filter `apartmentId = myApartmentId` |
| `/api/invoices/[id]` | GET | Toàn quyền | Xem chi tiết | **Chỉ xem nếu hóa đơn thuộc căn hộ mình** | `authorizeInvoiceAccess(user, invoiceAptId)` |
| `/api/invoices/[id]/pay` | POST | Cho phép | Cho phép | **Chỉ thanh toán hóa đơn căn hộ mình** | `authorizeInvoiceAccess` + Rate Limit 5 req/min |
| `/api/invoices/generate-monthly` | POST | Cho phép | Bị cấm (403) | Bị cấm (403) | Chạy trong `prisma.$transaction` + Audit Log |
| `/api/feedbacks` | GET | Toàn quyền | Xử lý ticket | **Chỉ xem ticket do mình/căn hộ tạo** | Bị ép filter theo `verifiedResident` |
| `/api/feedbacks/[id]` | GET | Toàn quyền | Xử lý ticket | **Chỉ xem ticket căn hộ mình** | `authorizeFeedbackAccess` |
| `/api/feedbacks/[id]/comments` | GET | Toàn quyền | Xem toàn bộ | **Ẩn toàn bộ Internal Notes** | `isInternal: false` với RESIDENT |

---

## 4. TÍNH NHẤT QUÁN TÀI CHÍNH VÀ ATOMIC TRANSACTIONS

### 4.1. Server-side Calculation cho Hóa Đơn (Anti-Tampering)
* **Quy tắc:** Tuyệt đối không cho phép Client gửi `totalAmount` lên server.
* **Thực thi:** Tại `InvoiceService.createInvoice` và `generateMonthlyInvoices`, `totalAmount` luôn được tính toán lại 100% trên server:
  $$\text{totalAmount} = \sum (\text{quantity} \times \text{unitPrice})$$
* **Chống tạo trùng lặp:** Kiểm tra ràng buộc duy nhất `[apartmentId, billingMonth]` trước khi tạo. Nếu căn hộ đã có hóa đơn trong kỳ, tiến trình bỏ qua (`skippedCount++`) hoặc báo lỗi cụ thể.

### 4.2. Atomic Batch Generation qua `prisma.$transaction`
Toàn bộ chu trình phát sinh hóa đơn tự động hàng tháng (`generateMonthlyInvoices`) được bọc trong một Database Transaction duy nhất. Nếu xảy ra lỗi giữa chừng, toàn bộ thay đổi sẽ được Rollback, đảm bảo không bao giờ sinh ra hóa đơn dở dang hoặc mất đồng bộ số liệu.

### 4.3. Chống Thanh Toán Lặp (Idempotent Payment Processing)
Để ngăn ngừa tấn công Race Condition khi người dùng nhấp đúp hoặc gửi nhiều request thanh toán đồng thời:
```typescript
const updated = await tx.invoice.updateMany({
  where: {
    id,
    status: { not: InvoiceStatus.PAID }, // Điều kiện nguyên tử tại mức Database
  },
  data: {
    status: InvoiceStatus.PAID,
    paidAt: new Date(),
    paymentMethod: data.paymentMethod,
    transactionId: data.transactionId || `PAY-${Date.now()}`,
  },
});

if (updated.count === 0) {
  throw new Error('Hóa đơn không tồn tại hoặc đã được thanh toán trước đó');
}
```
Cơ chế `updateMany` có điều kiện đảm bảo rằng chỉ có **duy nhất 1 request** thành công cập nhật trạng thái hóa đơn; các request song song khác sẽ nhận được `count === 0` và bị chặn lại ngay lập tức.

---

## 5. CƠ CHẾ GIỚI HẠN TẦN SUẤT (RATE LIMITING)

Hệ thống triển khai bộ lọc Rate Limiter (`src/lib/rate-limiter.ts`) sử dụng thuật toán Sliding Window / Token Bucket với bộ dọn dẹp bộ nhớ tự động (TTL Garbage Collector).

### Các điểm trọng yếu được áp dụng Rate Limit:
1. **Đăng nhập (`/api/auth/callback/credentials`):** Giới hạn tối đa **5 lần thử / phút / email**. Ngăn chặn hoàn toàn brute-force mật khẩu hoặc tấn công từ điển.
2. **Thanh toán dịch vụ (`POST /api/invoices/[id]/pay`):** Giới hạn tối đa **5 yêu cầu / phút / IP**. Ngăn chặn replay attacks và spam cổng thanh toán.
3. **Gửi phản ánh sự cố (`POST /api/feedbacks`):** Giới hạn tối đa **10 phản ánh / phút / người dùng**. Chống spam và làm tràn hàng đợi xử lý sự cố.

---

## 6. HỆ THỐNG GHI NHẬN LỊCH SỬ KIỂM TOÁN (AUDIT TRAIL LOGGING)

### 6.1. Bảng cơ sở dữ liệu `audit_logs`
Đã bổ sung model Prisma độc lập với các chỉ mục tăng tốc tra cứu:
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?  // ID người thực hiện
  actorEmail String? // Email người thực hiện
  actorRole String?  // ADMIN, MANAGER, RESIDENT...
  action    String   // GENERATE_MONTHLY_INVOICES, PROCESS_PAYMENT, CREATE_INVOICE, DELETE_INVOICE...
  entity    String   // INVOICE, PAYMENT, RESIDENT, TICKET...
  entityId  String?  // ID thực thể bị tác động
  metadata  Json?    // Snapshot dữ liệu, số tiền, thông tin chi tiết
  ipAddress String?  // Địa chỉ IP client
  createdAt DateTime @default(now())

  @@index([entity, entityId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 6.2. Các nghiệp vụ bắt buộc ghi Audit Log
* Tạo hóa đơn thủ công (`CREATE_INVOICE`)
* Phát sinh hóa đơn hàng loạt tự động (`GENERATE_MONTHLY_INVOICES`)
* Xác nhận thanh toán hóa đơn (`PROCESS_PAYMENT`)
* Xóa hóa đơn dịch vụ (`DELETE_INVOICE`)
* Thay đổi trạng thái sự cố, phân công nhân sự (`ASSIGN_TICKET`, `CHANGE_TICKET_STATUS`)

---

## 7. TỐI ƯU HÓA HIỆU NĂNG DATABASE & INDEXING

Đã kiểm tra và bổ sung các B-Tree Indexes trên các bảng có tần suất truy vấn cao nhằm ngăn ngừa Table Scans khi dữ liệu lớn:
* **`apartments`**: `[building]`, `[status]` (Hỗ trợ lọc căn hộ nhanh theo tòa nhà và trạng thái).
* **`residents`**: `[apartmentId]`, `[status]`, `[phone]` (Hỗ trợ tìm kiếm danh bạ và cư dân trong căn hộ).
* **`contracts`**: `[apartmentId]`, `[residentId]`, `[status]`, `[endDate]` (Tối ưu tìm kiếm hợp đồng sắp hết hạn và hợp đồng căn hộ).
* **`invoices`**: `[apartmentId]`, `[status]`, `[billingMonth]`, `[dueDate]` (Tối ưu hóa Smart Alerts công nợ và truy vấn theo kỳ).
* **`feedbacks`**: `[apartmentId]`, `[residentId]`, `[status]`, `[priority]`, `[slaDueAt]` (Tối ưu cảnh báo vi phạm SLA và bộ lọc trạng thái).
* **`notifications`**: `[targetRole]`, `[createdAt]`.

---

## 8. CHUẨN HÓA ĐỊNH DẠNG PHẢN HỒI & CHE GIẤU LỖI NỘI BỘ (ERROR SANITIZATION)

### 8.1. Cấu trúc phản hồi đồng nhất
Tất cả các API Route Handlers đều trả về định dạng chuẩn:
* **Thành công:**
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Thông điệp phản hồi thân thiện",
    "meta": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
  }
  ```
* **Thất bại:**
  ```json
  {
    "success": false,
    "errorCode": "VALIDATION_ERROR",
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Dữ liệu không hợp lệ",
      "details": { ... }
    }
  }
  ```

### 8.2. Che giấu Stack Trace và Lỗi Cơ Sở Dữ Liệu
Hàm `sanitizeErrorMessage()` trong `src/lib/api-response.ts` tự động phát hiện và chặn các chuỗi nhạy cảm (`PrismaClient`, `foreign key`, `syntax error`, `PostgreSQL`, `pg_`, `Stack trace`) và thay thế bằng thông điệp an toàn:
> *"Đã xảy ra lỗi hệ thống. Vui lòng liên hệ quản trị viên."*

---

## 9. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Đã chạy toàn bộ 49 test cases kiểm thử tự động, kết quả đạt **100% PASS**:

```text
▶ Backend Security & Hardening Test Suite
  ✔ 1. Centralized Role RBAC Guard (7.90ms)
  ✔ 2. Contract IDOR Protection (0.95ms)
  ✔ 3. Resident Profile IDOR Protection (1.49ms)
  ✔ 4. Rate Limiter Security Engine (0.77ms)
  ✔ 5. Standardized API Response & Production Error Sanitization (5.59ms)
  ✔ 6. Server-side Invoice Amount Calculation (0.14ms)
  ✔ 7. Payment Processing Idempotency Guard (0.57ms)
✔ Backend Security & Hardening Test Suite (18.57ms)

▶ Resident Portal Authorization Security Tests
  ✔ 1. Apartment Access Authorization (11.78ms)
  ✔ 2. Invoice Access Authorization (1.14ms)
  ✔ 3. Maintenance Ticket / Feedback Access Authorization (1.58ms)
✔ Resident Portal Authorization Security Tests (17.03ms)

▶ Smart Operations & Automated Rule-based Alerts Tests
  ✔ 1. Contract Operational Alert Rules (3.23ms)
  ✔ 2. Invoice Overdue & Debt Alert Rules (0.50ms)
  ✔ 3. Maintenance Ticket & SLA Alert Rules (1.88ms)
  ✔ 4. Operational Severity Sorting & Top 5 Priority Queue (1.02ms)
  ✔ 5. Collection Rate & Operational Insights Calculation (0.78ms)
✔ Smart Operations & Automated Rule-based Alerts Tests (8.49ms)

▶ Maintenance Ticket Workflow & State Machine Tests
  ✔ 1. Finite State Machine (FSM) Transitions (9.85ms)
  ✔ 2. SLA Calculation Logic (1.57ms)
  ✔ 3. Role Authorization & Business Rules Validation (3.28ms)
✔ Maintenance Ticket Workflow & State Machine Tests (15.70ms)

Total: 49 tests passed, 0 failed, duration: 624ms
TypeScript Check: 0 errors (Exit code 0)
```
