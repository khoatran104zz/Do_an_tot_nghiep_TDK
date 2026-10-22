# K-Home — Kiểm Toán Frontend, Giao Diện & Trải Nghiệm Người Dùng (Frontend & UI/UX Audit)

> **Tài liệu:** Đánh giá Chi tiết Cấu trúc Routes, Pages, Navigation theo Role, Form Validation, Tính Trùng lặp và Trải nghiệm Người dùng  
> **Framework:** Next.js App Router (v16.3.1), React 19, Tailwind CSS v4, Lucide Icons, shadcn/ui  

---

## 1. Cấu Trúc Tuyến Đường (App Router Route Architecture)

Toàn bộ ứng dụng được tổ chức thành 3 nhóm Route Groups chính:

```
src/app/
├── (auth)/
│   ├── login/page.tsx               # Màn hình đăng nhập đa vai trò kèm Quick Demo Fill
│   └── register/page.tsx            # Đăng ký tài khoản cư dân
├── (management)/                    # Phân hệ Quản trị & Vận hành BQL
│   ├── admin/tenants/page.tsx       # Quản trị Khách hàng/Tổ hợp (Platform Admin)
│   ├── dashboard/page.tsx           # Bàn làm việc BQL & Dashboard tổng quan
│   ├── apartments/page.tsx          # Danh mục Căn hộ, Tòa nhà, Khối, Tầng
│   ├── residents/page.tsx           # Hồ sơ Cư dân & Xác minh cư trú
│   ├── contracts/page.tsx           # Hợp đồng thuê và mua căn hộ
│   ├── invoices/page.tsx            # Hóa đơn, công nợ, in hóa đơn PDF
│   ├── payments/page.tsx            # Lịch sử giao dịch thanh toán
│   ├── fees/page.tsx                # Cấu hình danh mục biểu phí
│   ├── parking/page.tsx             # Sơ đồ bãi xe tương tác (Interactive Map)
│   ├── vehicles/page.tsx            # Danh sách phương tiện đăng ký
│   ├── parking-cards/page.tsx       # Thẻ từ / RFID gửi xe
│   ├── parking-logs/page.tsx        # Nhật ký phương tiện ra vào cổng
│   ├── feedbacks/page.tsx           # Tiếp nhận & Xử lý sự cố kỹ thuật (FSM/SLA)
│   ├── tasks/page.tsx               # Nhiệm vụ kỹ thuật viên được phân công
│   ├── assets/page.tsx              # Danh mục tài sản & thiết bị tòa nhà
│   ├── maintenance-schedule/page.tsx# Lịch bảo trì bảo dưỡng định kỳ
│   ├── maintenance-schedules/       # [TRÙNG LẶP] Re-export alias của maintenance-schedule
│   ├── facilities/page.tsx          # Quản lý tiện ích chung cư
│   ├── visitors/page.tsx            # Quản lý khách thăm & đón tiếp tại cổng
│   ├── parcels/page.tsx             # Quản lý bưu kiện & giao nhận sảnh
│   ├── announcements/page.tsx       # [TRÙNG LẶP] Bản tin thông báo tòa nhà
│   ├── notifications/page.tsx       # [TRÙNG LẶP] Quản lý thông báo tòa nhà
│   ├── polls/page.tsx               # Khảo sát ý kiến cư dân
│   ├── staff/page.tsx               # Đội ngũ nhân viên vận hành & phân ca
│   ├── reports/page.tsx             # Báo cáo thống kê vận hành & tài chính
│   └── settings/
│       ├── page.tsx                 # Cài đặt hệ thống
│       └── access-control/page.tsx  # Phân công Manager & Nhật ký kiểm toán
└── (resident)/                      # Phân hệ Cổng Thông Tin Cư Dân (Resident Portal)
    ├── home/page.tsx                # Trang chủ cư dân (Widget hóa đơn, tiện ích, tin tức)
    └── resident/
        ├── apartment/page.tsx       # Hồ sơ căn hộ của tôi
        ├── family/page.tsx          # Thành viên gia đình & đăng ký tạm trú
        ├── invoices/page.tsx        # Hóa đơn căn hộ & Thanh toán QR
        ├── vehicles/page.tsx        # Phương tiện & Thẻ xe của tôi
        ├── parking/page.tsx         # Đăng ký chỗ đỗ & Thẻ xe QR
        ├── facilities/page.tsx      # Đặt chỗ hồ bơi, BBQ, phòng tập
        ├── feedback/page.tsx        # Gửi phản ánh sự cố & theo dõi tiến độ
        ├── visitors/page.tsx        # Tạo thẻ đón khách thăm QR
        ├── parcels/page.tsx         # Danh sách bưu kiện chờ nhận
        ├── announcements/page.tsx   # [TRÙNG LẶP] Bản tin chung cư
        ├── notifications/page.tsx   # [TRÙNG LẶP] Thông báo cá nhân
        └── polls/page.tsx           # Tham gia biểu quyết ý kiến cư dân
```

---

## 2. Đánh Giá Trùng Lặp Route & Thành Phần Giao Diện (Duplication Findings)

### 2.1. Trùng lặp 100% giữa `/announcements` và `/notifications` trong Phân hệ Quản lý
- **Hiện tượng:**
  - File `src/app/(management)/announcements/page.tsx` (395 dòng, 17.3 KB) và `src/app/(management)/notifications/page.tsx` (405 dòng, 18.0 KB) **thực hiện cùng một chức năng 100%**:
    - Đều dùng hook `useNotifications`, `useCreateNotification`, `useDeleteNotification`.
    - Đều có các ô nhập: Tiêu đề (`title`), Nội dung (`content`), Danh mục (`category`), Mức độ ưu tiên (`priority`), Phạm vi (`targetScope`), Mục tiêu (`targetId`).
    - Cả hai link này đều được đặt cạnh nhau trong Sidebar của Manager:
      ```ts
      { name: 'Bản tin tòa nhà', href: '/announcements', icon: Megaphone },
      { name: 'Thông báo', href: '/notifications', icon: Bell },
      ```
- **Hậu quả:** Gây bối rối cực độ cho người dùng quản lý (không biết đăng thông báo ở trang nào), nhân đôi chi phí bảo trì code.
- **Đề xuất:** Xóa route `/announcements`, hợp nhất toàn bộ tính năng vào `/notifications`, đổi tên hiển thị trên Sidebar thành *"Bản tin & Thông báo"*.

### 2.2. Trùng lặp giữa `/resident/announcements` và `/resident/notifications` trong Phân hệ Cư dân
- **Hiện tượng:** Tương tự như phân hệ quản lý, cư dân có hai tab riêng biệt đều đọc dữ liệu từ API `/api/notifications`.
- **Đề xuất:** Hợp nhất thành 1 tab thông báo duy nhất tại `/resident/notifications`.

### 2.3. Route Alias Thừa: `/maintenance-schedules`
- **Hiện tượng:** `src/app/(management)/maintenance-schedules/page.tsx` chỉ có 2 dòng code:
  ```ts
  export { default } from '../maintenance-schedule/page';
  ```
  Nhưng Sidebar lại dẫn link tới `/maintenance-schedules`.
- **Đề xuất:** Chuẩn hóa tên số nhiều chuẩn RESTful `/maintenance-schedules`, xóa thư mục số ít `/maintenance-schedule` để tránh phân mảnh routing.

---

## 3. Đánh Giá Trải Nghiệm Người Dùng (UI/UX) & Responsive

### 3.1. Điểm Sáng UI/UX:
1. **Bộ nhận diện thương hiệu K-Home sắc sảo:**
   - Sử dụng bảng màu thống nhất: Forest Green (`#0F6B4F`), Emerald Green (`#22C55E`), Soft Mint (`#E8F5ED`).
   - Logo SVG chuyên nghiệp `<KHomeLogo />` và typography Poppins hiện đại, hiển thị sắc nét.
2. **Interactive Parking Map (Sơ đồ bãi đỗ xe tương tác):**
   - Thiết kế trực quan theo tầng hầm (B1, B2) và phân khu màu sắc (Ô tô màu xanh lá, EV màu xanh cyan, Xe máy màu cam).
   - Hiển thị tooltip chi tiết khi rê chuột vào chỗ đỗ (Biển số xe, tên cư dân, trạng thái khả dụng).
3. **Phản hồi người dùng (Feedback & States):**
   - Sử dụng `sonner` toast thông báo kết quả thành công/thất bại rõ ràng.
   - Các component `Skeleton`, `EmptyState`, `ErrorState`, `ConfirmDialog` được áp dụng đồng bộ ở mọi bảng dữ liệu.
4. **Quick Demo Fill trên màn hình đăng nhập:**
   - Cung cấp các nút bấm điền nhanh tài khoản Admin, Manager, Kỹ thuật viên, An ninh, Lễ tân, Cư dân, giúp việc kiểm thử và nghiệm thu cực kỳ thuận tiện.

### 3.2. Điểm Khiếm Khuyết UI/UX:
1. **Liên kết chết (Broken Action URL) 404:**
   - Trong `smart-alert.service.ts:45`, thuộc tính `actionUrl` mặc định là `/smart-operations/alerts`.
   - Tuy nhiên, route `/smart-operations/alerts` **không hề tồn tại** trong mã nguồn (vì module IoT đã bị loại bỏ). Khi người dùng nhấp vào link từ thông báo cảnh báo thông minh, hệ thống trả về trang lỗi 404.
2. **Chưa hỗ trợ quản lý Đồng sở hữu (Co-owners) trên giao diện:**
   - Mặc dù database đã có bảng `ApartmentOwnership` hỗ trợ tỷ lệ sở hữu và đồng sở hữu, form chỉnh sửa căn hộ tại `/apartments` vẫn chỉ hiển thị danh sách cư dân dạng văn bản đơn giản, chưa cho phép Manager gán thêm chủ sở hữu thứ hai hoặc tải lên giấy chứng nhận quyền sở hữu (sổ hồng).

---

## 4. Ma Trận Đánh Giá Từng Trang (Page-by-Page Status Matrix)

| Đường dẫn Route | Nhóm phân hệ | Trạng thái kỹ thuật | Mức độ hoàn thiện | Nhận xét chi tiết |
|---|---|:---:|:---:|---|
| `/login` | Auth | Hoàn thiện | 100% | UI đẹp, có quick demo fill, rate-limit 5 lần/phút |
| `/register` | Auth | Hoàn thiện | 95% | Form đăng ký cư dân, validation Zod chuẩn |
| `/admin/tenants` | Management (Platform) | Hoàn thiện | 95% | Quản lý danh sách Tenant, thống kê số tòa nhà |
| `/dashboard` | Management (BQL) | Hoàn thiện | 95% | KPI doanh thu, biểu đồ công nợ, widget vé bảo trì |
| `/apartments` | Management | Hoàn thiện | 90% | Quản lý tòa, tháp, tầng, căn hộ; cần hoàn thiện gán chủ sở hữu |
| `/residents` | Management | Hoàn thiện | 90% | Danh sách cư dân, xem căn hộ cư trú, CCCD |
| `/contracts` | Management | Hoàn thiện | 90% | Quản lý hợp đồng thuê/mua, hạn kết thúc, file đính kèm |
| `/invoices` | Management | Hoàn thiện | 90% | Danh sách hóa đơn, tính năng phát hành hàng loạt, xuất PDF |
| `/payments` | Management | Hoàn thiện | 85% | Lịch sử giao dịch thanh toán |
| `/fees` | Management | Hoàn thiện | 85% | Cấu hình biểu phí; cần bổ sung filter theo Tenant |
| `/parking` | Management | Hoàn thiện | 95% | Bản đồ bãi xe tương tác, đổi trạng thái chỗ đỗ trực quan |
| `/vehicles` | Management | Hoàn thiện | 90% | Danh sách xe, duyệt xe, xem ảnh cà vẹt xe |
| `/parking-cards` | Management | Hoàn thiện | 90% | Cấp phát và khóa thẻ từ xe |
| `/parking-logs` | Management | Hoàn thiện | 90% | Nhật ký barrier ra vào, biển số, hình ảnh |
| `/feedbacks` | Management | Hoàn thiện | 95% | Xử lý sự cố kỹ thuật theo FSM, tính SLA, trao đổi nội bộ |
| `/tasks` | Management (Tech) | Hoàn thiện | 95% | Bàn làm việc kỹ thuật viên, tiếp nhận và hoàn tất vé |
| `/assets` | Management | Hoàn thiện | 90% | Danh mục tài sản, hạn bảo hành, lịch sử bảo dưỡng |
| `/maintenance-schedules` | Management | Hoàn thiện | 90% | Lập lịch bảo trì định kỳ cho thiết bị |
| `/facilities` | Management | Hoàn thiện | 90% | Cấu hình tiện ích, giờ mở/đóng, phí theo lượt |
| `/visitors` | Management | Hoàn thiện | 90% | Danh sách khách, giao diện check-in/check-out QR tại cổng |
| `/parcels` | Management | Hoàn thiện | 90% | Tiếp nhận bưu phẩm, chụp ảnh, mã lấy hàng, ký nhận |
| `/announcements` | Management | **Trùng lặp** | **50%** | **Trùng 100% với `/notifications` (Cần xóa gộp)** |
| `/notifications` | Management | Hoàn thiện | 90% | Phát hành thông báo, lọc theo danh mục & mức độ |
| `/polls` | Management | Khá | 80% | Tạo khảo sát; cần bổ sung chọn phạm vi Tenant/Building |
| `/staff` | Management | Hoàn thiện | 90% | Hồ sơ nhân viên, phân ca trực (Sáng/Chiều/Đêm) |
| `/reports` | Management | Hoàn thiện | 90% | Xuất báo cáo tài chính, báo cáo bãi xe, tỷ lệ lấp đầy |
| `/settings/access-control`| Management | Hoàn thiện | 90% | Phân công Manager quản lý tòa nhà, xem Audit Logs |
| `/home` | Resident Portal | Hoàn thiện | 95% | Trang chủ cư dân, tóm tắt công nợ, widget tiện ích |
| `/resident/apartment` | Resident Portal | Hoàn thiện | 95% | Xem chi tiết căn hộ đang sinh sống, diện tích, sơ đồ |
| `/resident/family` | Resident Portal | Hoàn thiện | 90% | Danh sách thành viên, gửi yêu cầu đăng ký tạm trú |
| `/resident/invoices` | Resident Portal | Hoàn thiện | 95% | Xem chi tiết các khoản phí, thanh toán mã QR VietQR |
| `/resident/parking` | Resident Portal | Hoàn thiện | 95% | Xem vị trí đỗ được cấp, thẻ xe QR điện tử |
| `/resident/vehicles` | Resident Portal | Hoàn thiện | 90% | Đăng ký thêm xe máy/ô tô mới |
| `/resident/facilities` | Resident Portal | Hoàn thiện | 90% | Chọn khung giờ còn trống, đặt chỗ hồ bơi/BBQ |
| `/resident/feedback` | Resident Portal | Hoàn thiện | 95% | Báo hỏng thiết bị, chụp ảnh đính kèm, đánh giá sao |
| `/resident/visitors` | Resident Portal | Hoàn thiện | 95% | Tạo thẻ mời khách, lấy mã QR gửi cho bạn bè |
| `/resident/parcels` | Resident Portal | Hoàn thiện | 95% | Danh sách bưu phẩm đang giữ tại sảnh, mã nhận hàng |
| `/resident/polls` | Resident Portal | Hoàn thiện | 90% | Bỏ phiếu biểu quyết trực tuyến, xem tỷ lệ phiếu |

---

## 5. Bảng Chi Tiết Các Lỗi Frontend (Frontend Findings)

### [FE-001] Trùng Lặp 100% Giữa Module Bản Tin Và Module Thông Báo
- **Mức độ:** **P2** (UX Confusion & Code Duplication)
- **Vị trí file:**
  - `src/app/(management)/announcements/page.tsx`
  - `src/app/(management)/notifications/page.tsx`
  - `src/components/layout/Sidebar.tsx:147,150,203,205`
- **Hậu quả:** Gây dư thừa giao diện, người quản lý không phân biệt được hai trang.
- **Khắc phục:** Xóa bỏ thư mục `announcements/`, hợp nhất Sidebar về duy nhất mục "Bản tin & Thông báo" trỏ về `/notifications`.

---

### [FE-002] Link Điều Hướng 404 Trong Cảnh Báo Thông Minh (`/smart-operations/alerts`)
- **Mức độ:** **P2** (Broken Link / Dead End)
- **Vị trí file:** `src/modules/smart-operations/smart-alert.service.ts:45`
- **Hậu quả:** Khi nhấn vào chi tiết cảnh báo vi phạm SLA hoặc công nợ trên Topbar/Notification, ứng dụng điều hướng đến route không tồn tại `/smart-operations/alerts` dẫn đến màn hình 404.
- **Khắc phục:** Điều hướng linh hoạt theo loại thực thể:
  - Nếu cảnh báo liên quan đến Hóa đơn: điều hướng về `/invoices`.
  - Nếu cảnh báo liên quan đến Vé sự cố: điều hướng về `/feedbacks`.
  - Nếu cảnh báo liên quan đến Hợp đồng: điều hướng về `/contracts`.

---

### [FE-003] Tồn Tại Alias Trùng Lặp `/maintenance-schedule` Và `/maintenance-schedules`
- **Mức độ:** **P3** (Routing Inconsistency)
- **Vị trí file:** `src/app/(management)/maintenance-schedules/page.tsx`
- **Hậu quả:** Phân mảnh routing, URL không nhất quán (chỗ dùng số ít, chỗ dùng số nhiều).
- **Khắc phục:** Chuẩn hóa toàn bộ liên kết về `/maintenance-schedules` và xóa thư mục alias re-export.
