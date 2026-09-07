# Smart Apartment Management — Resident Portal Architecture & UX Guide

## 1. Triết lý thiết kế (Design Philosophy)

Resident Portal đã được tái kiến trúc toàn diện từ một giao diện CRUD/Admin Dashboard khô khan thành một **Self-Service Apartment Living Application** hiện đại.

* **Không phải Admin Dashboard**: Cư dân không cần nhìn thấy các bảng dữ liệu phức tạp (DataTable), mã ID hệ thống, hay các trường dữ liệu quản trị viên.
* **Ứng dụng quản lý cuộc sống chung cư**: Mọi thông tin hiển thị xoay quanh trải nghiệm sống hàng ngày: căn hộ của gia đình, hóa đơn phí sinh hoạt, sự cố kỹ thuật, tiện ích tòa nhà (Gym, Hồ bơi, Nhà cộng đồng) và thông báo quan trọng từ Ban Quản Lý (BQL).
* **Mobile-First & One-Handed Ergonomics**: Tối ưu hóa tuyệt đối cho smartphone với các action card lớn dễ chạm bằng ngón cái, Bottom Navigation bar tiện lợi, cùng chế độ Desktop mở rộng.
* **Real Data & Smart Insights**: Mọi phân tích và gợi ý ("Thông tin dành cho bạn") đều được tính toán từ dữ liệu thực trong cơ sở dữ liệu PostgreSQL qua `ResidentDashboardService`, tuyệt đối không dùng AI mô phỏng giả lập.

---

## 2. Kiến trúc 10 Phân hệ UX (UX Breakdown)

### 2.1. Resident Home & Apartment Card
* **Welcome Section**: Lời chào cá nhân hóa theo thời gian thực (*"Chào buổi sáng/buổi chiều/buổi tối, [Họ và Tên] 👋"*).
* **Apartment Card**:
  * Tên căn hộ nổi bật (Ví dụ: `A-1001`), Tòa nhà và Tầng (`Tòa A • Tầng 10`), Diện tích thực tế (`85 m²`).
  * Trạng thái cư trú: Thẻ vai trò (`Chủ hộ` / `Khách thuê`) kèm nhãn trạng thái sinh sống (`Đang cư trú`).
  * Chỉ số số lượng thành viên trong căn hộ (`Số thành viên: 3`).
  * CTA xem nhanh danh sách thành viên trong căn hộ và hợp đồng điện tử.

### 2.2. Billing Card (Thẻ hóa đơn gần nhất)
* Hiển thị hóa đơn tháng hiện tại kèm số tiền định dạng chuẩn VNĐ (`1.250.000 VNĐ`).
* Badge trạng thái trực quan: `ĐÃ THANH TOÁN` (Xanh Emerald) hoặc `CHƯA THANH TOÁN` (Cam Hổ phách).
* **Cảnh báo quá hạn (Overdue Alert)**: Khi quá ngày đến hạn (`dueDate`), hiển thị banner cảnh báo đỏ viền kèm số ngày trễ hạn và thông báo nhắc nhở nộp phí để tránh gián đoạn dịch vụ.
* **Hành động nhanh (Quick CTA)**:
  * Nút `Thanh toán ngay`: Mở modal quét mã VietQR tự động điền sẵn số tài khoản BQL, số tiền và nội dung chuyển khoản chuẩn cú pháp `THANHTOAN [MÃ HÓA ĐƠN] [SỐ PHÒNG]`, hoặc cổng MoMo Sandbox.
  * Nút `Chi tiết`: Xem chi tiết chỉ số điện nước và các loại phí.

### 2.3. Bill Breakdown & Donut Chart
* Biểu đồ tròn Recharts trực quan phân rã cơ cấu chi phí sinh hoạt:
  * **Phí quản lý vận hành**: Tính theo diện tích căn hộ.
  * **Điện sinh hoạt**: Dựa trên số chữ điện tiêu thụ.
  * **Nước sinh hoạt**: Dựa trên khối lượng nước sử dụng.
  * **Phí gửi xe**: Xe máy & ô tô đăng ký theo căn hộ.
  * **Phí khác / Dịch vụ gia tăng**.
* Giúp cư dân nắm bắt ngay tỷ trọng chi tiêu sinh hoạt mà không cần đọc bảng biểu phức tạp.

### 2.4. Quick Actions (Phím tắt chức năng)
Bố trí 5 nút tác vụ nhanh dạng card vuông bo tròn lớn:
1. **Thanh toán**: Mở hộp thoại chuyển khoản ngân hàng VietQR/MoMo tức thì.
2. **Báo sự cố**: Mở form gửi phản ánh hỏng hóc kỹ thuật (Điện nước, điều hòa, thấm dột...).
3. **Bảng tin tòa nhà**: Mở danh sách thông báo chính thức từ BQL.
4. **Hợp đồng thuê/sở hữu**: Xem hợp đồng, giá thuê và thời hạn hiệu lực.
5. **Thành viên căn hộ**: Xem thông tin họ tên, quan hệ và trạng thái của các thành viên cùng phòng.

### 2.5. Maintenance & Progress Timeline
* Hiển thị phiếu báo hỏng kỹ thuật gần nhất kèm tiêu đề (Ví dụ: *"Điều hòa phòng khách không hoạt động"*).
* **Progress Timeline 3 bước**:
  * Bước 1: **Tiếp nhận** (`NEW`)
  * Bước 2: **Đang sửa chữa** (`PROCESSING`)
  * Bước 3: **Hoàn tất** (`RESOLVED`)
* Có hiển thị người tạo, ngày giờ ghi nhận và phân loại sự cố (Khẩn cấp / Bình thường).

### 2.6. Notifications Preview
* Hiển thị 3 thông báo mới nhất gửi đến cư dân hoặc toàn tòa nhà.
* Phân loại biểu tượng theo loại tin: Hóa đơn phí, Bảo trì tòa nhà, Sự kiện sinh hoạt, Thông báo chung.
* Chấm tròn thông báo chưa đọc (`unread indicator`) nổi bật.

### 2.7. Building Facilities (Tiện ích cư dân)
Tích hợp lịch biểu và trạng thái khả dụng của 4 tiện ích nội khu:
1. **Hồ bơi bốn mùa (Sky Pool)**: Giờ mở cửa `06:00 - 21:00`, trạng thái `Sẵn sàng phục vụ`.
2. **Phòng tập Gym & Yoga**: Giờ mở cửa `05:30 - 22:00`, trạng thái `Đang mở cửa`.
3. **Phòng sinh hoạt cộng đồng**: Giờ mở cửa `08:00 - 21:30`, trạng thái `Cần đăng ký trước`.
4. **Bãi đỗ xe thông minh**: Giờ mở cửa `24/7`, trạng thái `Còn 18 chỗ trống`.

### 2.8. Smart Insights ("Thông tin dành cho bạn")
Khối thông tin thông minh được tính toán 100% từ dữ liệu thực của căn hộ:
* So sánh chi phí sinh hoạt với tháng trước (Ví dụ: *"Hóa đơn tháng này cao hơn tháng trước 8.2% do mức dùng điện mùa nắng"*).
* Cảnh báo thời hạn thanh toán (Ví dụ: *"Hóa đơn tháng sẽ đến hạn sau 3 ngày"*).
* Trạng thái xử lý sự cố (Ví dụ: *"Bạn có 1 phiếu báo hỏng đang được kỹ thuật viên xử lý"*).
* Cập nhật cư trú (Ví dụ: *"Căn hộ hiện có 3 thành viên đăng ký thường trú hợp lệ"*).

### 2.9. Mobile-First Layout
* **Desktop**: Header thanh lịch với avatar cư dân, chuông thông báo, menu điều hướng nhanh, và bố cục 2 cột cân đối.
* **Mobile**: Bottom Bar Navigation cố định ở cạnh dưới màn hình (`Trang chủ`, `Hóa đơn`, `Sự cố`, `Thông báo`, `Tài khoản`) với vùng chạm (hit target) lớn, phù hợp thao tác 1 tay.

### 2.10. UX & Interaction Principles
* **Skeleton Loaders**: Hiển thị khung mờ mượt mà trong khi nạp dữ liệu từ backend, tránh hiện tượng giật layout (Cumulative Layout Shift).
* **Modals Tích hợp**:
  * Modal VietQR chuyển khoản thanh toán nhanh kèm mã QR sinh động.
  * Modal gửi phản ánh sự cố tức thì với dropdown loại sự cố và đính kèm mô tả.
  * Modal danh sách thành viên gia đình và chi tiết hợp đồng căn hộ.
* **Toast Notification**: Phản hồi qua thư viện `sonner` ngay khi sao chép thông tin chuyển khoản hoặc gửi sự cố thành công.

---

## 3. Backend & Security Architecture

### 3.1. Dịch vụ tổng hợp dữ liệu: `ResidentDashboardService`
* **Vị trí**: `src/modules/resident-dashboard/resident-dashboard.service.ts`
* **API Endpoint**: `GET /api/resident/dashboard`
* **Nguyên lý hoạt động**:
  1. Lấy định danh người dùng từ Session máy chủ (`session.user.id`).
  2. Truy vấn hồ sơ Resident và quan hệ `Apartment` trong 1 query tối ưu (không bị lỗi N+1).
  3. Truy vấn song song bằng `Promise.all`:
     * Hóa đơn gần nhất và hóa đơn tháng trước của căn hộ.
     * Danh sách thành viên cùng căn hộ (`members`).
     * Hợp đồng còn hiệu lực (`contract`).
     * Phiếu phản ánh sự cố gần nhất (`feedbacks`).
     * Các thông báo tòa nhà mới nhất (`notifications`).
  4. Tính toán cơ cấu chi phí (Breakdown) và sinh danh sách Smart Insights chính xác.

### 3.2. Authorization & Data Isolation (Kiểm soát quyền truy cập)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **Zero Trust đối với Client**:
* **Không bao giờ tin cậy `userId` hay `residentId` gửi từ client/URL**.
* **Định danh bắt buộc lấy từ Session/JWT phía server**.
* Tất cả endpoint chi tiết đều được bảo vệ bởi tầng `authorizeApartmentAccess`, `authorizeInvoiceAccess`, và `authorizeFeedbackAccess` tại `src/lib/authorization.ts`:

| Tài nguyên | Endpoint | Quy tắc phân quyền Resident | Mã lỗi khi vi phạm |
| :--- | :--- | :--- | :--- |
| **Căn hộ** | `GET /api/apartments/[id]` | `id === resident.apartmentId` | `403 Forbidden` |
| **Hóa đơn** | `GET /api/invoices/[id]` | `invoice.apartmentId === resident.apartmentId` | `403 Forbidden` |
| **Sự cố** | `GET /api/feedbacks/[id]` | `feedback.residentId === resident.id` HOẶC `feedback.apartmentId === resident.apartmentId` | `403 Forbidden` |
| **Bảng tin** | `GET /api/resident/dashboard` | Chỉ trả về dữ liệu thuộc quyền sở hữu của cư dân | `401 Unauthorized` / `403 Forbidden` |

---

## 4. Kiểm thử bảo mật tự động (Security Test Suite)

Bộ test tự động tại `tests/resident-authorization.test.ts` đã được thiết lập và kiểm tra với lệnh:
```bash
npm run test:auth
```

### Kết quả kiểm thử (10/10 PASS):
1. **Apartment Authorization**:
   * `PASS`: Cư dân cố ý truy cập căn hộ khác -> Bị từ chối với mã **403 Forbidden**.
   * `PASS`: Cư dân truy cập căn hộ của chính mình -> Cho phép truy cập (**200 OK**).
   * `PASS`: Quản trị viên (ADMIN/MANAGER) truy cập bất kỳ căn hộ -> Cho phép.
2. **Invoice Authorization**:
   * `PASS`: Cư dân cố ý truy cập hóa đơn của căn hộ khác -> Bị từ chối với mã **403 Forbidden**.
   * `PASS`: Cư dân truy cập hóa đơn của căn hộ mình -> Cho phép truy cập.
   * `PASS`: Quản trị viên truy cập bất kỳ hóa đơn -> Cho phép.
3. **Maintenance Ticket Authorization**:
   * `PASS`: Cư dân cố ý truy cập phản ánh/ticket của cư dân khác -> Bị từ chối với mã **403 Forbidden**.
   * `PASS`: Cư dân truy cập phiếu do chính mình tạo -> Cho phép.
   * `PASS`: Cư dân truy cập phiếu do thành viên trong cùng căn hộ tạo -> Cho phép.
   * `PASS`: Quản trị viên truy cập mọi phiếu -> Cho phép.
