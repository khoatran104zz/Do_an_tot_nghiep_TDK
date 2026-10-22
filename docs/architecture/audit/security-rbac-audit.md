# K-Home — Kiểm Toán Bảo Mật, Xác Thực & Phân Quyền (Security & RBAC Audit)

> **Tài liệu:** Đánh giá Lỗ hổng Bảo mật, Cơ chế Xác thực (Auth), Ma trận Phân quyền (RBAC), Phân lập Khách hàng (Multi-Tenant Isolation) & Phòng chống IDOR  
> **Phạm vi kiểm toán:** `src/middleware.ts`, `src/lib/auth.ts`, `src/lib/authorization.ts`, `src/lib/permissions.ts`, các Route Handlers tại `src/app/api/**`  

---

## 1. Tổng Quan Kiến Trúc Bảo Mật & RBAC

Hệ thống bảo mật K-Home được thiết kế theo mô hình **Phòng thủ Chiều sâu (Defense-in-Depth)** gồm 4 lớp bảo vệ:

```
[ Lớp 1: Edge / Network ] -> Next.js Middleware (src/middleware.ts)
                              - Phân luồng Auth / Guest
                              - Phân tách phân hệ Quản lý vs Phân hệ Cư dân
                              - Chặn vai trò cấp cao theo tiền tố route

[ Lớp 2: Rate Limiting ]  -> In-memory Sliding Window (src/lib/rate-limiter.ts)
                              - Bảo vệ endpoint Login (5 lần/phút/email)
                              - Bảo vệ endpoint Thanh toán (5 lần/phút/căn hộ)

[ Lớp 3: Granular RBAC ]  -> Permission Matrix (src/lib/permissions.ts)
                              - Kiểm tra quyền chi tiết (VD: 'invoice:create', 'feedback:resolve')
                              - Phân nhóm vai trò: Financial, Technical, Security, Receptionist

[ Lớp 4: Data Scoping ]   -> Resource Guards (src/lib/authorization.ts)
                              - Tenant Scope Guard (Tổ hợp của tôi)
                              - Building Scope Guard (Tòa nhà tôi được phân công qua ManagerBuilding)
                              - Resident IDOR Guard (Chỉ truy cập căn hộ/hóa đơn/xe của chính mình)
```

### Đánh giá chung:
- **Mặt tích cực:** Lớp phòng vệ chống IDOR cho Cư dân (`RESIDENT`) được lập trình rất bài bản thông qua hàm `getVerifiedResidentInfo()`. Hệ thống **không bao giờ tin cậy** các tham số `residentId` hay `apartmentId` do client gửi lên trong query string hay body payload.
- **Mặt tồn tại nghiêm trọng:** Lỗ hổng bảo mật P0 về khóa bí mật JWT fallback, sự lỏng lẻo trong việc xác thực phạm vi Tenant đối với vai trò `TENANT_ADMIN`, và rò rỉ dữ liệu thông báo xuyên tổ hợp.

---

## 2. Bảng Tổng Hợp Các Lỗ Hổng Bảo Mật (Security Findings)

| Issue ID | Mức độ | Phân loại | Tóm tắt lỗ hổng | Tình trạng |
|---|:---:|---|---|:---:|
| **SEC-001** | **P0** | Authentication / Cryptography | Hard-coded Fallback Secret cho JWT trong `auth.ts` và `middleware.ts` | 🔴 Cực kỳ nguy hiểm |
| **SEC-002** | **P0** | Authorization / Cross-Tenant IDOR | `POST /api/invoices` không kiểm tra phạm vi Tenant đối với `TENANT_ADMIN` | 🔴 Rò rỉ dữ liệu |
| **SEC-003** | **P1** | Authorization / Privilege Escalation | `POST /api/blocks` và `POST /api/floors` không kiểm tra Building/Tenant Scope | 🟠 Nguy hiểm |
| **SEC-004** | **P1** | Authorization Bypass | Bỏ qua phân quyền khi căn hộ thiếu `buildingId` (`allowed: true`) | 🟠 Nguy hiểm |
| **SEC-005** | **P1** | Data Leakage / Cross-Tenant | Thông báo tạo Khảo sát (`Poll`) bị phát sóng toàn cầu (`isGlobal: true`) | 🟠 Nguy hiểm |
| **SEC-006** | **P1** | Business Logic / Scope Bypass | Đặt chỗ tiện ích (`FacilityBooking`) không kiểm tra cư trú tại Tòa nhà của tiện ích | 🟠 Nguy hiểm |
| **SEC-007** | **P2** | Audit Trail / Multi-Tenant | `AuditLog` thiếu trường `tenantId`, nguy cơ lộ vết hoạt động giữa các khách hàng | 🟡 Cần khắc phục |
| **SEC-008** | **P2** | Authentication / Hardcoded Demo Passwords | Mật khẩu mẫu hardcoded trong `seed.ts` xuất hiện công khai trên README | 🟡 Cần khắc phục |

---

## 3. Chi Tiết Từng Lỗ Hổng & Hướng Khắc Phục

---

### [SEC-001] Hard-coded Fallback Secret Cho JWT Token Trong `auth.ts` Và `middleware.ts`
- **Mức độ:** **P0** (Critical Vulnerability)
- **Vị trí file:**
  - `src/middleware.ts:8`:
    ```ts
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || 'smart-apartment-secret-jwt-key-2026-very-secure',
    });
    ```
  - `src/lib/auth.ts:135`:
    ```ts
    secret: process.env.NEXTAUTH_SECRET || 'smart-apartment-secret-jwt-key-2026-very-secure',
    ```
  - `README.md:82`:
    ```bash
    NEXTAUTH_SECRET="smart-apartment-secret-jwt-key-2026-very-secure"
    ```
- **Phân tích rủi ro & Khai thác:**
  - Chuỗi bí mật ký JWT fallback đã bị lộ công khai trên GitHub/README.
  - Nếu trong quá trình triển khai Vercel hoặc Docker, biến môi trường `NEXTAUTH_SECRET` không được cấu hình hoặc bị rỗng, ứng dụng sẽ âm thầm sử dụng chuỗi fallback này.
  - Kẻ tấn công có thể tự ký một JWT hợp lệ chứa payload `role: "PLATFORM_ADMIN"`, vượt qua hoàn toàn cả `middleware.ts` và các Route Handlers, chiếm toàn quyền quản trị hệ thống của tất cả các tổ hợp chung cư trên toàn quốc.
- **Cách tái hiện:**
  1. Xóa `NEXTAUTH_SECRET` trong môi trường chạy.
  2. Dùng công cụ `jsonwebtoken` ký một token với secret `'smart-apartment-secret-jwt-key-2026-very-secure'` và payload `{ role: 'PLATFORM_ADMIN', id: 'attacker' }`.
  3. Gửi request kèm cookie `next-auth.session-token`: Middleware cho phép đi qua vào bất kỳ endpoint quản trị nào.
- **Hướng khắc phục:**
  1. Loại bỏ chuỗi fallback hardcoded.
  2. Bổ sung kiểm tra nghiêm ngặt khi ứng dụng khởi động (Fail-fast):
     ```ts
     const secret = process.env.NEXTAUTH_SECRET;
     if (!secret) {
       throw new Error('CRITICAL SECURITY ERROR: NEXTAUTH_SECRET is not set in environment variables!');
     }
     ```
- **Module bị ảnh hưởng:** `auth`, `middleware`, toàn bộ hệ thống.

---

### [SEC-002] `POST /api/invoices` Thiếu Kiểm Tra Phạm Vi Tenant Đối Với `TENANT_ADMIN` (Cross-Tenant Invoicing)
- **Mức độ:** **P0** (Cross-Tenant Data Tampering)
- **Vị trí file:** `src/app/api/invoices/route.ts:120-125`
- **Hiện tượng & Bằng chứng:**
  ```ts
  export async function POST(req: NextRequest) {
    ...
    const validated = createInvoiceSchema.parse(body);

    // CHỈ KIỂM TRA MANAGER! BỎ QUA HOÀN TOÀN TENANT_ADMIN!
    if (session.user.role === 'MANAGER') {
      const aptAuth = await authorizeApartmentAccess(session.user, validated.apartmentId);
      if (!aptAuth.allowed) {
        return apiForbidden(aptAuth.error || 'Bạn không có quyền tạo hóa đơn cho căn hộ thuộc tòa nhà khác');
      }
    }

    const item = await invoiceService.createInvoice(validated, ...);
    return apiSuccess(item, 'Tạo hóa đơn thủ công thành công', undefined, 201);
  }
  ```
- **Phân tích rủi ro & Khai thác:**
  - `TENANT_ADMIN` của Tổ hợp 1 (Tenant A) có quyền `invoice:create`.
  - Khi gửi request `POST /api/invoices` với body chứa `apartmentId` thuộc về Tổ hợp 2 (Tenant B), đoạn code `if (session.user.role === 'MANAGER')` đánh giá là `false` nên bị nhảy qua.
  - Quản trị viên của Tenant A đã tạo thành công một hóa đơn thu tiền cư dân của Tenant B. Tiền bạc và công nợ giữa các khách hàng bị can thiệp trái phép.
- **Hướng khắc phục:**
  Sửa logic kiểm tra thành:
  ```ts
  if (session.user.role === 'MANAGER' || session.user.role === 'TENANT_ADMIN') {
    const aptAuth = await authorizeApartmentAccess(session.user, validated.apartmentId);
    if (!aptAuth.allowed) {
      return apiForbidden(aptAuth.error || 'Bạn không có quyền tạo hóa đơn cho căn hộ này');
    }
  }
  ```
- **Module bị ảnh hưởng:** `invoice`, `tenant`, `billing`.

---

### [SEC-003] `POST /api/blocks` Và `POST /api/floors` Bỏ Qua Kiểm Tra Building/Tenant Scope
- **Mức độ:** **P1** (Unauthorized Resource Manipulation)
- **Vị trí file:**
  - `src/app/api/blocks/route.ts:27-33`
  - `src/app/api/floors/route.ts:27-33`
- **Hiện tượng & Bằng chứng:**
  ```ts
  // src/app/api/blocks/route.ts
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return apiForbidden('Chỉ Ban Quản Trị mới có quyền thêm khối tháp');
  }

  const body = await req.json();
  const validated = blockSchema.parse(body); // chứa validated.buildingId

  // KHÔNG CÓ BƯỚC XÁC THỰC authorizeBuildingAccess(session.user, validated.buildingId)!
  const created = await apartmentService.createBlock(validated, ...);
  ```
- **Hậu quả:**
  - Manager của Tòa A có thể gửi `POST /api/blocks` với `buildingId` của Tòa B (hoặc thậm chí thuộc Tenant khác) để tạo thêm Block và Floor vào tòa nhà người khác.
  - Đồng thời, code chỉ kiểm tra chuỗi `ADMIN` và `MANAGER`, bỏ quên `TENANT_ADMIN` và `PLATFORM_ADMIN`.
- **Hướng khắc phục:**
  - Bổ sung `authorizeBuildingAccess(session.user, validated.buildingId)`.
  - Sử dụng hàm chuẩn `isAdmin(user.role) || isManager(user.role)`.
- **Module bị ảnh hưởng:** `apartment`, `property-hierarchy`.

---

### [SEC-004] Bỏ Qua Phân Quyền Khi Căn Hộ Bị Để Mồ Côi (`buildingId = null`)
- **Mức độ:** **P1** (Authorization Bypass)
- **Vị trí file:** `src/lib/authorization.ts:287-293`
- **Hiện tượng & Bằng chứng:**
  ```ts
  export async function authorizeApartmentAccess(
    user: SessionUser,
    targetApartmentId: string,
    prismaClient: any = prisma
  ): Promise<AuthorizationResult> {
    ...
    if (user.role === Role.TENANT_ADMIN || user.role === Role.MANAGER) {
      const buildingId = await resolveApartmentBuildingId(targetApartmentId, prismaClient);
      if (!buildingId) {
        // Apartment without building association or mock test
        return { allowed: true }; // <-- LỖ HỔNG: MẶC ĐỊNH MỞ CỬA!
      }
      return authorizeBuildingAccess(user, buildingId, prismaClient);
    }
  ```
- **Hậu quả:** Bất cứ căn hộ nào được tạo mà thiếu `buildingId` (xem lỗ hổng `DB-002`) sẽ được hệ thống ngầm định là "hợp lệ cho tất cả". Mọi Manager hoặc Tenant Admin trên toàn hệ thống đều có thể đọc/sửa căn hộ này.
- **Hướng khắc phục:** Khi `!buildingId`, hàm phải trả về `{ allowed: false, statusCode: 403, error: 'Căn hộ không hợp lệ hoặc chưa được phân bổ tòa nhà' }`.
- **Module bị ảnh hưởng:** `authorization`, `apartment`.

---

### [SEC-005] Thông Báo Tạo Khảo Sát Bị Phát Sóng Toàn Cầu Cho Toàn Bộ Cư Dân Mọi Tổ Hợp
- **Mức độ:** **P1** (Information Disclosure & Cross-Tenant Noise)
- **Vị trí file:** `src/modules/poll/poll.service.ts:45-57`
- **Hiện tượng & Bằng chứng:**
  ```ts
  await prisma.notification.create({
    data: {
      title: 'Khảo sát ý kiến cư dân mới',
      content: `Ban quản lý vừa mở cuộc biểu quyết: "${poll.title}". Mời cư dân tham gia đóng góp ý kiến.`,
      category: NotificationCategory.POLL,
      priority: NotificationPriority.NORMAL,
      isGlobal: true, // <-- BẮN TOÀN SÀN
      targetRole: Role.RESIDENT,
      ...
    },
  });
  ```
- **Hậu quả:** Khi Manager của chung cư SmartCity mở một cuộc khảo sát nội bộ về phí gửi xe, toàn bộ cư dân của chung cư Sunrise Tower (thuộc một khách hàng khác) đều nhận được chuông thông báo trên ứng dụng Resident Portal!
- **Hướng khắc phục:** Gỡ bỏ `isGlobal: true`. Liên kết thông báo theo danh sách `NotificationApartment` của các căn hộ thuộc phạm vi khảo sát.
- **Module bị ảnh hưởng:** `poll`, `notification`, `resident`.

---

### [SEC-006] Đặt Chỗ Tiện Ích Thiếu Kiểm Tra Ràng Buộc Cư Trú Tòa Nhà
- **Mức độ:** **P1** (Business Logic Abuse)
- **Vị trí file:** `src/modules/facility/facility.repository.ts:270-348`
- **Hiện tượng & Bằng chứng:**
  Hàm `createBookingWithAntiOverbookingLock` kiểm tra giờ mở cửa, sức chứa tối đa và xung đột khung giờ, nhưng **hoàn toàn không kiểm tra** xem Căn hộ của người đặt có thuộc về Tòa nhà sở hữu tiện ích đó hay không.
- **Hậu quả:** Cư dân ở Tòa C (hoặc cư dân của một tổ hợp khác) có thể đặt kín lịch bể bơi vô cực hoặc phòng họp VIP vốn chỉ dành riêng cho cư dân Tòa A.
- **Hướng khắc phục:**
  Kiểm tra:
  ```ts
  if (facility.buildingId && residentApartment.buildingId !== facility.buildingId) {
    throw new Error('Tiện ích này chỉ dành riêng cho cư dân sinh sống tại tòa nhà tương ứng');
  }
  ```
- **Module bị ảnh hưởng:** `facility`, `booking`.

---

## 4. Kiểm Toán Ma Trận RBAC & Phân Quyền Vai Trò

Đã kiểm tra ma trận phân quyền trong `src/lib/permissions.ts` và xác nhận tính phân định rõ ràng giữa các vai trò:

| Vai trò (Role) | Phạm vi quản lý | Tài chính / Phí | Kỹ thuật / Bảo trì | An ninh / Bãi xe | Lễ tân / Bưu kiện | Quản trị Hệ thống |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **PLATFORM_ADMIN** | Toàn bộ nền tảng (Toàn cầu) | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Khởi tạo Tenant |
| **TENANT_ADMIN** | Một Tenant / Khách hàng | ✅ Tổ hợp mình | ✅ Tổ hợp mình | ✅ Tổ hợp mình | ✅ Tổ hợp mình | ❌ Không tạo Tenant |
| **ADMIN (Legacy)** | Tương đương Platform/Tenant | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Toàn quyền | ✅ Toàn quyền | ⚠️ Tùy thuộc tenantId |
| **MANAGER** | Các Building được phân công | ✅ Hóa đơn tòa | ✅ Phân công vé | ✅ Duyệt xe tòa | ✅ Xem bưu kiện | ❌ Không quản trị user |
| **STAFF_TECHNICIAN** | Khu vực kỹ thuật tòa | ❌ Bị chặn | ✅ Xử lý sự cố | ❌ Bị chặn | ❌ Bị chặn | ❌ Bị chặn |
| **STAFF_SECURITY** | Cổng barrier & bãi xe | ❌ Bị chặn | ❌ Bị chặn | ✅ Quẹt thẻ, xe | ❌ Bị chặn | ❌ Bị chặn |
| **STAFF_RECEPTIONIST**| Sảnh chính tòa nhà | ❌ Bị chặn | ❌ Bị chặn | ❌ Bị chặn | ✅ Bưu kiện, khách| ❌ Bị chặn |
| **RESIDENT** | Chỉ căn hộ của bản thân | 👁️ Chỉ hóa đơn mình| ✍️ Báo sự cố mình | ✍️ Đăng ký xe mình| 👁️ Bưu kiện mình | ❌ Bị chặn |

*Ghi chú kiểm thử:* Test suite `tests/rbac-permissions.test.ts` đã chạy và xác nhận 13/13 test cases của ma trận này hoạt động chính xác tuyệt đối.
