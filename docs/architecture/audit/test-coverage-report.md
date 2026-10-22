# K-Home — Báo Cáo Kiểm Thử & Chất Lượng Kỹ Thuật (Test Coverage & Engineering Quality Report)

> **Tài liệu:** Đánh giá Hiện trạng Test Suite, Kết quả Chạy Kiểm thử Thực tế, Lỗ hổng Coverage và Chất lượng Code  
> **Bộ công cụ kiểm thử:** Node.js Native Test Runner (`node:test`, `node:assert/strict`), `tsx`, `typescript (tsc)`, `eslint`  

---

## 1. Tổng Quan Bộ Kiểm Thử Hiện Có (Test Suites Inventory)

Thư mục `tests/` hiện có **19 file test** với tổng dung lượng xấp xỉ 180 KB:

```
tests/
├── admin-manager-rbac.test.ts           # Kiểm tra Scope Tòa nhà của Manager (DB-dependent)
├── asset-preventive-maintenance.test.ts # Lập lịch bảo trì tài sản & công việc kỹ thuật viên
├── backend-security.test.ts             # [BỊ LỖI] Kiểm tra IDOR Hợp đồng, Cư dân, Rate Limiter (Mock-based)
├── billing-vehicle-integration.test.ts  # Tích hợp Tính cước phương tiện vào hóa đơn (DB-dependent write)
├── communication-system.test.ts         # Hệ thống thông báo & phân bổ căn hộ
├── domain-refactor-phase-c.test.ts      # Kiểm tra mô hình Ownership & Residency mới
├── facility-booking.test.ts             # Đặt chỗ tiện ích & khóa chống overbooking
├── household-workflow.test.ts           # Quy trình thêm thành viên gia đình & tạm trú
├── multi-tenant-security.test.ts        # Phân lập Multi-Tenant giữa SmartCity và Sunrise (DB-dependent)
├── parcel-management.test.ts            # Quy trình tiếp nhận & phát bưu kiện
├── property-hierarchy.test.ts           # Phân cấp Building -> Block -> Floor -> Apartment
├── rbac-permissions.test.ts             # [PASS 100%] Ma trận quyền chi tiết RBAC
├── resident-authorization.test.ts       # [PASS 100%] Chống IDOR Cư dân (Mock-based)
├── smart-operations.test.ts             # Cảnh báo vận hành SLA & Hỏi đáp AI Context
├── smart-parking.test.ts                # Sơ đồ bãi xe, cấp chỗ đỗ, kiểm soát barrier
├── staff-management.test.ts             # Phân ca nhân sự kỹ thuật, an ninh, lễ tân
├── ticket-workflow.test.ts              # [PASS 100%] FSM vé sự cố & Tính toán SLA
├── vehicle-management.test.ts           # Đăng ký xe, duyệt xe, cấp thẻ từ RFID
└── visitor-management.test.ts           # Tiếp đón khách thăm & quét mã QR
```

---

## 2. Kết Quả Kiểm Thử Thực Tế (Execution Results)

Tuân thủ nghiêm ngặt nguyên tắc **Audit An Toàn (Read-Only)**, không chạy các lệnh gây biến đổi dữ liệu trên Neon database, chỉ tiến hành thực thi các kiểm tra tĩnh và các unit test độc lập với cơ sở dữ liệu:

### 2.1. Kiểm tra Type-check & Lược đồ Prisma:
1. **`npx prisma validate`:**
   - **Kết quả:** **PASS (Code 0)**
   - Schema `prisma/schema.prisma` hoàn toàn hợp lệ về mặt cú pháp Prisma.
2. **`npx tsc --noEmit`:**
   - **Kết quả:** **PASS (Code 0)**
   - **Toàn bộ codebase (100%) đạt chuẩn TypeScript nghiêm ngặt.** Không có bất kỳ lỗi biên dịch type nào trong mã nguồn dự án.

### 2.2. Kiểm tra Linting (`npm run lint` / `eslint`):
- **Kết quả:** **FAIL (Code 1)**
- **Chi tiết lỗi:**
  `✖ 1584 problems (1008 errors, 576 warnings)`
- **Nguyên nhân cốt lõi:**
  - Cấu hình ESLint flat config (`eslint.config.mjs`) sử dụng bộ quy tắc mặc định cực kỳ khắt khe của Next.js và TypeScript (`@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`).
  - Trong các file test và mã nguồn xử lý trung gian, các kỹ sư trước đây đã sử dụng kiểu dữ liệu `any` rộng rãi (hơn 1.000 lỗi `Unexpected any. Specify a different type`).

### 2.3. Kết quả Chạy Các Test Suite Độc Lập (In-Memory / Mock-based):

| Test Suite | Lệnh chạy | Kết quả | Chi tiết pass/fail |
|---|---|:---:|---|
| `tests/ticket-workflow.test.ts` | `npx tsx --test tests/ticket-workflow.test.ts` | 🟢 **PASS** | **12/12 pass (100%)** trong 77ms. Xác nhận FSM vé bảo trì và thuật toán tính SLA hoạt động chuẩn mực. |
| `tests/resident-authorization.test.ts` | `npx tsx --test tests/resident-authorization.test.ts` | 🟢 **PASS** | **10/10 pass (100%)** trong 15ms. Xác nhận phòng chống IDOR căn hộ, hóa đơn, sự cố cho cư dân. |
| `tests/rbac-permissions.test.ts` | `npx tsx --test tests/rbac-permissions.test.ts` | 🟢 **PASS** | **13/13 pass (100%)** trong 15ms. Xác nhận ma trận phân quyền RBAC và phân nhóm vai trò. |
| `tests/backend-security.test.ts` | `npx tsx --test tests/backend-security.test.ts` | 🔴 **FAIL** | **14 pass, 2 fail (Code 1)**. |

---

## 3. Phân Tích Nguyên Nhân Thất Bại Của `tests/backend-security.test.ts`

Hai test case bị thất bại trong `tests/backend-security.test.ts`:
1. `✖ MUST ALLOW when resident accesses contract of their own apartment`
2. `✖ MUST ALLOW when resident views profile of co-resident in the same apartment`

### Cơ chế gây lỗi được phân tích chính xác:
Trong file `tests/backend-security.test.ts`, đoạn code mock Prisma được viết như sau:
```ts
const mockPrisma = {
  resident: {
    findUnique: async ({ where }: { where: { userId: string } }) => {
      if (where.userId === 'user-res-1') {
        return { id: 'res-1', apartmentId: 'apt-101' }; // <-- MOCK SCHEMA CŨ!
      }
```

Tuy nhiên, hàm `getVerifiedResidentInfo` trong `src/lib/authorization.ts` đã được nâng cấp sau đợt tái cấu trúc domain, đọc dữ liệu qua quan hệ mới:
```ts
export async function getVerifiedResidentInfo(userId: string, prismaClient: any = prisma) {
  const resident = await prismaClient.resident.findUnique({
    where: { userId },
    select: {
      id: true,
      occupancies: { where: { isLivingHere: true }, select: { apartmentId: true } },
      ownedApartments: { where: { isCurrent: true }, select: { apartmentId: true } },
    },
  });

  const currentApartmentId =
    resident.occupancies?.[0]?.apartmentId ||
    resident.ownedApartments?.[0]?.apartmentId ||
    null;

  return { id: resident.id, apartmentId: currentApartmentId };
}
```

Vì `mockPrisma` trong file test vẫn trả về định dạng cũ (chỉ có trường `apartmentId`, không có mảng `occupancies` hay `ownedApartments`), biến `currentApartmentId` trả về giá trị `null`.
Khi đó:
`resident.apartmentId !== contractApartmentId` (`null !== 'apt-101'`) đánh giá là `true` $\rightarrow$ Ném lỗi `403 Forbidden` $\rightarrow$ Test thất bại!

**Bài học kiểm thử:** Đây là bằng chứng điển hình của việc **nâng cấp code production nhưng quên cập nhật mock data trong test suite**, khiến bộ test bị lỗi thời (Stale Test Mocks).

---

## 4. Nguy Cơ Khi Chạy Integration Tests Trên Môi Trường Trực Tiếp

Qua rà soát chi tiết nội dung các file:
- `tests/billing-vehicle-integration.test.ts`
- `tests/household-workflow.test.ts`
- `tests/facility-booking.test.ts`
- `tests/smart-parking.test.ts`

**Phát hiện nghiêm trọng:**
Các file này không sử dụng mock hay transaction rollback! Trong khối `before()`, code gọi trực tiếp:
```ts
testApartment0 = await prisma.apartment.create({
  data: {
    code: `T-0-${timestamp}`,
    building: 'T-BLOCK',
    floor: 1,
    area: 60,
  },
});
```
Nếu nhà phát triển chạy lệnh `npm test` khi file `.env` đang trỏ vào cơ sở dữ liệu **Neon Production**, các câu lệnh này sẽ **tạo rác hàng loạt căn hộ, xe cộ, hóa đơn và chỗ đỗ xe giả vào database thật**!
Đây là lý do chỉ thị audit ban đầu cấm tuyệt đối việc chạy `npm test` khi chưa có môi trường test cô lập.

---

## 5. Bảng Chi Tiết Các Vấn Đề Về Chất Lượng Kiểm Thử (Test Findings)

### [TEST-001] Integration Tests Ghi Trực Tiếp Vào Database Môi Trường Hiện Tại
- **Mức độ:** **P1** (Nguy cơ ô nhiễm dữ liệu)
- **Vị trí:** `tests/billing-vehicle-integration.test.ts`, `tests/household-workflow.test.ts`, `tests/smart-parking.test.ts`.
- **Hậu quả:** Chạy `npm test` vô tình làm biến đổi dữ liệu production/staging đang trỏ bởi `.env`.
- **Khắc phục:**
  - Tách bạch cấu hình test database riêng biệt (`.env.test`).
  - Tạo script chạy test tự động dọn dẹp (cleanup) hoặc bọc toàn bộ subtest trong transaction rollback.

---

### [TEST-002] File `tests/backend-security.test.ts` Chứa Mock Dữ Liệu Cũ Khiến Test Fail
- **Mức độ:** **P2** (False Negative Testing)
- **Vị trí:** `tests/backend-security.test.ts:37-49`.
- **Hậu quả:** Bộ test an ninh báo lỗi đỏ mặc dù logic production chạy đúng, gây hoang mang trong quy trình CI/CD.
- **Khắc phục:** Cập nhật `mockPrisma.resident.findUnique` trả về đúng cấu trúc `occupancies: [{ apartmentId: 'apt-101' }]`.

---

### [TEST-003] Hơn 1.500 Lỗi ESLint Do Sử Dụng Kiểu `any` Tràn Lan
- **Mức độ:** **P3** (Code Quality & Formatting)
- **Vị trí:** Toàn bộ thư mục `tests/` và một số module backend.
- **Hậu quả:** Lệnh `npm run lint` bị lỗi với mã thoát 1, khiến pipeline CI/CD tự động (như GitHub Actions hay Vercel Pre-commit) bị chặn.
- **Khắc phục:** Định nghĩa type cụ thể thay cho `any`, hoặc cấu hình file `eslint.config.mjs` cho phép `warn` đối với thư mục `tests/`.
