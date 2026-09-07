# HƯỚNG DẪN DEMO THƯƠNG MẠI: SMART APARTMENT MANAGEMENT SYSTEM

> **Phiên bản:** 2.0 (Production & Demo-Ready Edition)  
> **Hệ sinh thái:** Next.js App Router • TypeScript • PostgreSQL • Prisma • TanStack Query • TailwindCSS v4 • shadcn/ui

---

## 1. DANH SÁCH TÀI KHOẢN DÙNG THỬ (DEMO ACCOUNTS)

Hệ thống đã tích hợp sẵn tính năng **1-Click Demo Fill** ngay trên trang đăng nhập (`/login`). Người dùng chỉ cần nhấp vào nút role tương ứng, email và mật khẩu mẫu sẽ tự động được điền mà không cần nhập tay:

| Vai Trò (Role) | Email Đăng Nhập | Mật Khẩu Demo | Mục Tiêu Demo | Chuyển Hướng Mặc Định |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **ADMIN (Quản trị viên)** | `admin@building.com` | `admin123` | Quản trị tối cao toàn bộ hệ thống, phân quyền nhân sự, audit log | `/dashboard` |
| 🏢 **MANAGER (Ban Quản Lý)** | `manager@building.com` | `manager123` | Giám sát KPI thời gian thực, duyệt hợp đồng, phát sinh hóa đơn, điều phối sự cố | `/dashboard` |
| 👤 **RESIDENT (Cư Dân)** | `resident@building.com` | `resident123` | Cổng tự phục vụ cư dân: xem hóa đơn, thanh toán sandbox, gửi phản ánh sự cố | `/home` |
| 🛠️ **STAFF (Kỹ thuật viên)** | `tech@building.com` | `manager123` | Tiếp nhận và cập nhật tiến độ xử lý ticket sự cố kỹ thuật tòa nhà | `/feedbacks` |

---

## 2. KỊCH BẢN DEMO 14 BƯỚC END-TO-END (COMPLETE DEMO FLOW)

Để thể hiện tối đa giá trị sản phẩm trước khách hàng / hội đồng đánh giá, hãy thực hiện theo đúng trình tự 14 bước dưới đây:

### Giai đoạn 1: Vận Hành Ban Quản Lý (Steps 1 - 8)

* **Bước 1: Đăng nhập Ban Quản Lý**
  * Truy cập `/login`. Nhấp vào nút **BQL** hoặc 1-click **Manager** ở góc dưới.
  * Bấm **"Đăng nhập hệ thống"**.
* **Bước 2: Khám phá Smart Operations Dashboard**
  * Xem lời chào ngữ cảnh theo thời gian thực ("Chào buổi tối, Trần Minh Đức 👋").
  * Quan sát 6 chỉ số KPI: Tổng căn hộ, Tỷ lệ lấp đầy, Tổng cư dân, Doanh thu tháng, Công nợ, Sự cố đang xử lý.
  * Xem biểu đồ diện tích / cột phân tích doanh thu 6 tháng và biểu đồ Donut cơ cấu căn hộ.
* **Bước 3: Xem Trung tâm Cảnh báo Thông minh (Smart Alerts)**
  * Kiểm tra widget **"5 việc cần chú ý hôm nay"** với các tag màu cảnh báo trực quan:
    * 🔴 *Critical:* Hợp đồng sắp hết hạn trong 5 ngày (Căn B-2002).
    * 🔴 *Critical:* Sự cố khẩn cấp rò rỉ nước vi phạm cam kết SLA (Căn A-1001).
    * 🟠 *Warning:* Hóa đơn nợ đọng cao trên 5.000.000 VNĐ quá hạn 20 ngày.
* **Bước 4: Quản lý Căn hộ (Apartments Module)**
  * Nhấp vào nút **Căn hộ** trên thanh Thao tác nhanh hoặc menu bên trái.
  * Thử nghiệm bộ lọc theo Tòa nhà (`Tòa A`, `Tòa B`, `Tòa C`) và Trạng thái (`OCCUPIED`, `VACANT`, `RESERVED`).
* **Bước 5: Quản lý Hồ sơ Cư dân (Residents Module)**
  * Truy cập `/residents`. Xem danh sách cư dân hiển thị đầy đủ thông tin: họ tên, SĐT, số CCCD được bảo vệ, vai trò (Chủ hộ, Khách thuê).
* **Bước 6: Phát sinh Hóa đơn Tự động (Invoice Generation Engine)**
  * Truy cập `/invoices`. Nhấp vào **"Phát sinh hóa đơn tự động"**.
  * Chọn kỳ hóa đơn và hạn nộp tiền. Hệ thống tính toán tự động dựa trên m² và định mức điện nước, bọc trong Database Transaction nguyên tử.
* **Bước 7: Kiểm soát Công nợ & Hóa đơn Quá hạn (Overdue Tracking)**
  * Lọc trạng thái hóa đơn theo `OVERDUE`. Xem chi tiết hóa đơn căn B-2002 có nợ đọng cao.
* **Bước 8: Điều phối & Xử lý Ticket Sự cố (Maintenance Workflow)**
  * Truy cập `/feedbacks`. Chọn ticket `FB-2026-0001` (Rò rỉ van cấp nước).
  * Xem tiến trình Workflow: `NEW` $\rightarrow$ `ASSIGNED` $\rightarrow$ `PROCESSING`.
  * Phân công kỹ thuật viên, cập nhật ghi chú nội bộ (Internal Note) mà cư dân không nhìn thấy.

---

### Giai đoạn 2: Trải Nghiệm Cổng Cư Dân (Steps 9 - 14)

* **Bước 9: Đăng nhập Cổng Cư Dân (Resident Portal)**
  * Đăng xuất và tại `/login`, bấm 1-click **Resident** (`resident@building.com`).
  * Hệ thống tự động chuyển hướng tới `/home` với giao diện ứng dụng cư dân thân thiện.
* **Bước 10: Xem Hóa đơn Dịch vụ Căn hộ**
  * Cư dân Nguyễn Văn An nhìn thấy thông tin Căn A-1001 (Tòa A, Tầng 10, 75.5m²).
  * Xem thẻ **Billing Card** hiển thị hóa đơn kỳ tháng 9/2026 chưa thanh toán kèm biểu đồ cơ cấu tiền dịch vụ (phí quản lý, gửi xe, điện, nước).
* **Bước 11: Thanh toán Trực tuyến Sandbox**
  * Bấm nút **"Thanh toán ngay"**.
  * Chọn cổng thanh toán (VNPAY hoặc MoMo).
  * Nhấp xác nhận thanh toán giả lập. Hóa đơn lập tức cập nhật trạng thái `PAID` và hiển thị mã giao dịch ngân hàng thành công!
* **Bước 12: Gửi Phản ánh Sự cố Mới (Create Ticket)**
  * Nhấp vào nút **"Báo hỏng / Phản ánh"**.
  * Điền tiêu đề, chọn danh mục (Điện, Nước, Thang máy, An ninh), mức độ ưu tiên và gửi phản ánh.
* **Bước 13: Xem Trung tâm Thông báo Tòa nhà**
  * Nhấp vào biểu tượng Chuông thông báo trên thanh Topbar hoặc vào mục Thông báo.
  * Xem thông báo diễn tập PCCC định kỳ và thông báo súc rửa bể nước riêng của Tòa A.
* **Bước 14: Đánh giá Chất lượng Nghiệm thu (Resident Rating)**
  * Mở ticket sự cố đã hoàn thành (`CLOSED`) và chấm điểm 5 sao kèm lời nhận xét cảm ơn Ban Quản Lý.

---

## 3. CÁC TÍNH NĂNG VƯỢT TRỘI CỦA HỆ THỐNG

1. **Tìm kiếm Toàn Cục Nhanh (`Ctrl + K` / `Cmd + K`):**
   * Cho phép tìm kiếm tức thì theo mã căn hộ, tên cư dân, số điện thoại, mã hóa đơn, sự cố hoặc chức năng điều hướng.
   * Kết quả được phân nhóm thực thể (Grouped Search) chuyên nghiệp.
2. **Hỗ Trợ Chế Độ Sáng/Tối (Light & Dark Mode):**
   * Chuyển đổi mượt mà bằng nút chuyển Theme trên thanh công cụ hoặc menu tài khoản.
   * Đồng bộ tức thời trên toàn màn hình, chống chớp sáng/tối (Zero FOUC).
3. **Phòng Chống IDOR & Bảo Mật Dữ Liệu:**
   * Cư dân không thể xem trộm hóa đơn, hợp đồng hay thông tin cá nhân của các căn hộ khác.
   * Toàn bộ giá trị tài chính được tính toán tại Server (Server-side calculation), loại trừ nguy cơ can thiệp từ client.
4. **Hạn Chế Tần Suất (Rate Limiting Engine):**
   * Tự động khóa các hành vi spam đăng nhập (tối đa 5 lần/phút) và thanh toán lặp.

---

## 4. GIỚI HẠN HIỆN TẠI (KNOWN LIMITATIONS & FUTURE ROADMAP)

* **Cổng Thanh toán:** Hiện đang chạy chế độ mô phỏng giao dịch Sandbox (Webhook test). Để kết nối VNPAY/MoMo thực tế cần đăng ký mã Merchant ID của doanh nghiệp.
* **SMS Gateway:** Tính năng gửi SMS Brandname thông báo khẩn cấp đang được mô phỏng qua bảng Notification nội bộ.
