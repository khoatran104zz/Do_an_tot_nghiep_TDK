# HỆ THỐNG PHÂN QUYỀN VÀ PHẠM VI TRUY CẬP (RBAC & SCOPE ARCHITECTURE)
## Smart Apartment Management System

---

## 1. TỔNG QUAN VỀ ROLE MODEL

Hệ thống quản lý chung cư phân định rõ 3 nhóm người dùng chính và 6 vai trò:

### GROUP 1 — BAN QUẢN LÝ
* **ADMIN** (System / Platform Administrator): Quản trị viên cấp cao nhất của nền tảng, có phạm vi toàn hệ thống (**Global Scope**). Quản lý danh mục tất cả Tòa nhà, Quản lý tòa nhà (Managers), Nhân sự vận hành, Phân quyền RBAC, Cấu hình hệ thống, Báo cáo đa tòa nhà và Nhật ký kiểm toán.
* **MANAGER** (Building / Property Manager): Trưởng ban hoặc quản lý vận hành được phân công phụ trách một hoặc nhiều tòa nhà (**Building Scoped**). Chịu trách nhiệm vận hành nghiệp vụ hàng ngày của tòa nhà được giao (Căn hộ, Cư dân, Hợp đồng, Hóa đơn, Bảo trì sự cố, Tiện ích, Bưu kiện, Khách ra vào, Nhân viên tòa nhà).

### GROUP 2 — NHÂN VIÊN VẬN HÀNH (OPERATIONAL STAFF)
* **STAFF_TECHNICIAN**: Kỹ thuật viên xử lý phản ánh sự cố, sửa chữa, bảo trì định kỳ tài sản tòa nhà.
* **STAFF_SECURITY**: Đội ngũ an ninh kiểm soát cổng ra vào, thẻ xe, bãi đỗ xe và quản lý khách ra vào (QR scan).
* **STAFF_RECEPTIONIST**: Lễ tân sảnh tiếp nhận bưu kiện, tra cứu cư dân tối thiểu và check-in khách.

### GROUP 3 — CƯ DÂN
* **RESIDENT**: Cư dân sinh sống tại căn hộ. Chỉ có quyền truy cập dữ liệu của chính bản thân và căn hộ của mình (**Self Scoped**).

---

## 2. NGUYÊN TẮC QUẢN TRỊ SCOPE & IDOR PREVENTION

```text
                    SYSTEM (PLATFORM)
                           │
                         ADMIN (Global Scope)
                           │
          ┌────────────────┴────────────────┐
          │                                 │
     Building A                        Building B
          │                                 │
      MANAGER A                         MANAGER B
          │                                 │
 ┌────────┼────────┐               ┌────────┼────────┐
 │        │        │               │        │        │
Block  Apartment Resident        Block  Apartment Resident
```

### Nguyên tắc Enforce ở Backend:
1. **Zero Trust on Client `buildingId`**: Server không tin tưởng tham số `buildingId` do Client gửi lên. Luôn xác thực danh sách tòa nhà được gán (`assignedBuildingIds`) từ phiên đăng nhập/database.
2. **Path Resolution cho mọi tài nguyên**:
   - Căn hộ (Apartment) $\rightarrow$ `apartment.buildingId` (hoặc `floor -> block -> building`).
   - Cư dân (Resident) $\rightarrow$ `resident.apartment.buildingId`.
   - Hợp đồng (Contract) $\rightarrow$ `contract.apartment.buildingId`.
   - Hóa đơn (Invoice) $\rightarrow$ `invoice.apartment.buildingId`.
   - Bảo trì (Feedback) $\rightarrow$ `feedback.apartment.buildingId`.
   - Phương tiện (Vehicle) $\rightarrow$ `vehicle.apartment.buildingId`.
   - Khách ra vào (VisitorPass) $\rightarrow$ `visitorPass.apartment.buildingId`.
   - Bưu kiện (Parcel) $\rightarrow$ `parcel.apartment.buildingId`.
3. **Chặn IDOR**: Nếu Manager A gửi request truy cập hoặc chỉnh sửa một tài nguyên thuộc Building B mà mình không được phân công $\rightarrow$ Backend trả ngay mã lỗi `403 Forbidden`.

---

## 3. MA TRẬN PHÂN QUYỀN (PERMISSION MATRIX)

| Module / Chức năng | Hành động / Quyền hạn | ADMIN | MANAGER | STAFF_TECH | STAFF_SEC | STAFF_REC | RESIDENT |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **TÒA NHÀ (BUILDINGS)** | Xem danh sách tòa nhà | ✅ Tất cả | ✅ Tòa nhà được gán | ❌ | ❌ | ❌ | ❌ |
| | Thêm mới tòa nhà | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | Cập nhật thông tin tòa nhà | ✅ Toàn quyền | ⚠️ Giới hạn (Thông tin vận hành) | ❌ | ❌ | ❌ | ❌ |
| | Xóa tòa nhà | ✅ (Kèm Safety check) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **QUẢN LÝ TOÀ NHÀ (MANAGERS)** | Danh sách Managers | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | Tạo tài khoản Manager | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | Khóa / Vô hiệu hóa Manager | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | Gán Manager $\rightarrow$ Building | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CẤU TRÚC BẤT ĐỘNG SẢN** | Xem Block / Tầng / Căn hộ | ✅ Tất cả | ✅ Trong tòa nhà gán | ⚠️ Chỉ đọc | ⚠️ Chỉ đọc | ⚠️ Chỉ đọc | ⚠️ Căn hộ của mình |
| | Tạo Block / Tầng / Căn hộ | ✅ | ✅ (Trong tòa nhà gán) | ❌ | ❌ | ❌ | ❌ |
| | Cập nhật Căn hộ | ✅ | ✅ (Trong tòa nhà gán) | ❌ | ❌ | ❌ | ❌ |
| | Xóa Căn hộ | ✅ | ⚠️ Safety check | ❌ | ❌ | ❌ | ❌ |
| **QUẢN LÝ NHÂN SỰ (STAFF)** | Xem danh sách nhân viên | ✅ Toàn hệ thống | ✅ Thuộc tòa nhà | ❌ | ❌ | ❌ | ❌ |
| | Tạo nhân viên Kỹ thuật/Bảo vệ/Lễ tân | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Phân ca trực / Điều chuyển ca | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Tạo Manager hoặc Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CƯ DÂN & HỢP ĐỒNG** | Danh sách hồ sơ cư dân | ✅ Tất cả | ✅ Trong tòa nhà gán | ❌ | ❌ | ⚠️ Tối thiểu (liên hệ) | ⚠️ Căn hộ của mình |
| | Thêm mới / Duyệt cư dân | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Tạo & Quản lý Hợp đồng | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ Xem của mình |
| **TÀI CHÍNH & HÓA ĐƠN** | Lập hóa đơn định kỳ hàng tháng | ✅ | ✅ (Tòa nhà gán) | ❌ | ❌ | ❌ | ❌ |
| | Thu tiền / Xác nhận thanh toán | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ Đóng phí online |
| | Cấu hình Bảng giá & Danh mục phí | ✅ Toàn hệ thống | ⚠️ Áp dụng định mức | ❌ | ❌ | ❌ | ❌ |
| **BẢO TRÌ & SỰ CỐ (TICKETS)** | Tiếp nhận & Phân công kỹ thuật | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Tiếp nhận xử lý / Đổi trạng thái | ✅ | ✅ | ✅ Được giao | ❌ | ❌ | ❌ |
| | Gửi yêu cầu phản ánh sự cố | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ Tạo cho căn hộ |
| | Đánh giá chất lượng dịch vụ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Căn hộ đánh giá |
| **PHƯƠNG TIỆN & BÃI XE** | Duyệt đăng ký phương tiện | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| | Cấp phát / Khóa thẻ gửi xe | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| | Quản lý lượt xe ra vào cổng | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **VẬN HÀNH THÔNG MINH (IOT/SLA)** | Giám sát cảm biến & Cảnh báo | ✅ Toàn hệ thống | ✅ Tòa nhà gán | ✅ Kỹ thuật | ❌ | ❌ | ❌ |
| | Điều khiển kịch bản mô phỏng | ✅ Toàn hệ thống | ✅ Tòa nhà gán | ❌ | ❌ | ❌ | ❌ |
| **BÁO CÁO & THỐNG KÊ** | Báo cáo toàn diện đa tòa nhà | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | Báo cáo vận hành từng tòa nhà | ✅ | ✅ Tòa nhà gán | ❌ | ❌ | ❌ | ❌ |
| **KIỂM SOÁT TRUY CẬP (RBAC)** | `/settings/access-control` | ✅ | ❌ (403) | ❌ | ❌ | ❌ | ❌ |
| | Xem Audit Logs toàn hệ thống | ✅ | ❌ (403) | ❌ | ❌ | ❌ | ❌ |

---

## 4. BẢO VỆ ROUTE & FRONTEND GUARDS

1. **Middleware Layer (`src/middleware.ts`)**:
   - `/settings/access-control`, `/managers/**` $\rightarrow$ Chặn mọi role khác ngoài `ADMIN`.
   - `/dashboard`, `/apartments`, `/residents`, v.v. $\rightarrow$ Cho phép `ADMIN`, `MANAGER` (và Staff tương ứng).
   - Tự động điều hướng cư dân về `/home` nếu cố truy cập trang quản trị.
2. **Centralized Client Capability Helper**:
   - Cung cấp hook `usePermission()` / `can(user, permission)` để UI hiển thị các nút thao tác tương ứng (Action Buttons, Dialogs, Dropdowns) mà không hard-code `role === "ADMIN"` rải rác.
3. **API Level Guard**:
   - Mọi API route nhạy cảm thực thi `requireRole(user, ['ADMIN'])` hoặc `requireBuildingAccess(user, buildingId)`.
