# Báo cáo Nâng cấp Toàn diện Giao diện & Trải nghiệm Người dùng (UI/UX Improvement Report)

**Dự án**: Smart Apartment Management System (Hệ thống Quản lý Chung cư Thông minh)  
**Phiên bản nâng cấp**: SaaS Enterprise Edition v2.0  
**Ngày hoàn thiện**: Tháng 09/2026  

---

## 1. Tổng quan các thay đổi (Executive Summary)

Đợt nâng cấp này chuyển đổi toàn bộ Frontend của dự án từ dạng CRUD/Admin Dashboard cơ bản thành một sản phẩm SaaS quản lý chung cư hiện đại, chuyên nghiệp, trực quan và đạt chuẩn Enterprise:

* **Không viết lại từ đầu & Không phá vỡ hệ thống**: Giữ nguyên 100% backend API internal Route Handlers, schema PostgreSQL/Prisma, cơ chế phân quyền NextAuth RBAC (Admin, Manager, Resident) và các TanStack Query Hooks.
* **Xây dựng Design System đồng bộ**: Bổ sung bảng màu SaaS tinh gọn (Slate/Indigo/Emerald/Amber/Rose), hỗ trợ đầy đủ Dark Mode (`.dark`) lưu trữ theo localStorage, hoàn thiện typography và micro-interactions.
* **Nâng cấp Enterprise DataTable**: Hỗ trợ sắp xếp đa cột (Sorting), chọn dòng (Row Selection), thanh thao tác hàng loạt (Bulk Actions), ẩn/hiện cột tùy chỉnh (Column Visibility), responsive tối ưu trên mọi màn hình.
* **Tích hợp Slide-over DetailDrawer (Sheet)**: Cho phép xem toàn bộ hồ sơ chi tiết của Căn hộ, Cư dân, Hợp đồng, Hóa đơn và Phản ánh sự cố ngay tức thì mà không làm mất ngữ cảnh bảng dữ liệu.
* **Loại bỏ trùng lặp UI**: Chuẩn hóa toàn bộ bộ lọc thành `FilterBar`, huy hiệu trạng thái thành `StatusBadge`, modal biểu mẫu thành `FormDialog` và khung sườn ứng dụng thành `AppShell`.

---

## 2. Danh sách Component Mới Được Xây Dựng (New Components)

| Tên Component | Đường dẫn file | Mục đích & Chức năng |
|---|---|---|
| **AppShell** | `src/components/layout/AppShell.tsx` | Khung sườn ứng dụng responsive gom chung layout BQL & Cư dân, điều khiển thanh bên (thu gọn/mobile drawer), topbar, mobile bottom nav và command palette. |
| **StatusBadge** | `src/components/shared/StatusBadge.tsx` | Component hiển thị huy hiệu trạng thái chuẩn hóa với chấm trạng thái (dot) và icon tương ứng cho 11 phân loại (Căn hộ, Cư dân, Hợp đồng, Hóa đơn, Sự cố, Độ ưu tiên, Vai trò, Phương thức thanh toán). |
| **SearchInput** | `src/components/shared/SearchInput.tsx` | Ô tìm kiếm có tích hợp debounce 300ms, icon tìm kiếm, nút xóa nhanh (`X`) và phím tắt `/`. |
| **FilterBar** | `src/components/shared/FilterBar.tsx` | Thanh công cụ lọc chuẩn hóa hỗ trợ select dropdown, các thẻ chip lọc đang hoạt động kèm nút gỡ, bộ đếm số lượng bản ghi và nút "Đặt lại". |
| **Sheet** | `src/components/ui/sheet.tsx` | Component slide-over drawer từ cạnh phải màn hình theo chuẩn Radix/shadcn với animation mượt mà và khóa cuộn nền. |
| **DetailDrawer** | `src/components/shared/DetailDrawer.tsx` | Wrapper xem chi tiết đối tượng: hiển thị badge trạng thái, lưới thông tin hai cột có icon, phần nội dung mở rộng và nút thao tác nhanh. |
| **FormDialog** | `src/components/shared/FormDialog.tsx` | Modal form chuẩn hóa gồm icon chủ đề, tiêu đề, mô tả, thân form cuộn và footer có nút Hủy / Lưu tích hợp trạng thái loading spinner. |
| **ThemeToggle** | `src/components/shared/ThemeToggle.tsx` | Nút chuyển đổi Light/Dark mode lưu vào localStorage và tự động gán lớp `.dark` lên thẻ `<html>`. |
| **NotificationBell** | `src/components/layout/NotificationBell.tsx` | Chuông thông báo hiển thị số lượng tin chưa đọc, popover preview 5 thông báo mới nhất, nút "Đã đọc hết" và liên kết xem chi tiết. |
| **UserMenu** | `src/components/layout/UserMenu.tsx` | Menu người dùng góc phải: Avatar, Họ tên, Email, StatusBadge vai trò, ThemeToggle, lối tắt điều hướng và nút Đăng xuất. |
| **LoadingSkeleton** | `src/components/shared/LoadingSkeleton.tsx` | Bộ khung tải trang skeleton dùng chung cho Thẻ thống kê (StatCardSkeleton), Bảng dữ liệu (TableSkeleton) và Biểu đồ (ChartSkeleton). |
| **ErrorState** | `src/components/shared/ErrorState.tsx` | Khối thông báo lỗi trang nhã với icon cảnh báo và nút "Thử lại ngay" (Retry). |

---

## 3. Danh sách Component Được Nâng Cấp (Refactored Components)

1. **Enterprise DataTable** (`src/components/shared/DataTable.tsx`):
   - Bổ sung tính năng **Sorting**: Click header cột để đổi chiều sắp xếp (Ascending $\rightarrow$ Descending $\rightarrow$ Mặc định) kèm icon mũi tên trạng thái.
   - Bổ sung tính năng **Column Visibility**: Menu dropdown cho phép bật/tắt hiển thị từng cột dữ liệu tùy ý.
   - Bổ sung tính năng **Row Selection**: Checkbox ở header chọn toàn bộ trang, checkbox từng dòng kèm thanh nổi **Bulk Actions**.
   - Bổ sung sự kiện `onRowClick`: Bấm vào dòng bất kỳ để mở DetailDrawer xem hồ sơ chi tiết.
   - Tích hợp sẵn `SearchInput` và `EmptyState` chuẩn hóa.

2. **Sidebar** (`src/components/layout/Sidebar.tsx`):
   - Cấu hình cây điều hướng linh hoạt theo RBAC:
     - **Admin**: Bảng điều khiển, Quản lý Căn hộ, Hồ sơ Cư dân, Quản lý Hợp đồng, Hóa đơn & Thu nợ, Danh mục Biểu phí, Phản ánh & Sự cố, Thông báo Tòa nhà.
     - **Manager**: Các nghiệp vụ vận hành hàng ngày của tòa nhà.
     - **Resident**: Trang chủ Cư dân, Hóa đơn & QR Pay, Báo sự cố & Đánh giá, Hộp thư Thông báo.
   - Tinh chỉnh hiệu ứng active pill bên trái, hiệu ứng thu gọn (collapsible) có tooltip hiển thị tên mục trên desktop và drawer trên di động.

3. **Topbar** (`src/components/layout/Topbar.tsx`):
   - Tích hợp `NotificationBell`, `UserMenu`, `ThemeToggle` và lối tắt ⌘K CommandSearchDialog.
   - Giữ breadcrumb điều hướng động hiển thị rõ ràng vị trí của người dùng trong hệ thống.

4. **globals.css** (`src/app/globals.css`):
   - Bổ sung định nghĩa biến màu CSS đầy đủ cho `.dark`.
   - Bổ sung keyframes animation: `sheet-enter-right`, `sheet-exit-right`.

---

## 4. Danh sách các Route Đã Cập Nhật (Updated Routes)

### Phân hệ Ban Quản Lý (Management)
1. **`/dashboard`** (Bảng điều khiển BQL):
   - Tích hợp hero banner thông minh chào mừng theo thời gian thực và hiển thị trạng thái hệ thống.
   - 4 thẻ KPI số nhảy động (`AnimatedNumber`) kèm thanh tiến độ tỷ lệ lấp đầy.
   - Biểu đồ Recharts doanh thu dạng cột/gradient, phân bổ trạng thái căn hộ và cơ cấu sự cố kỹ thuật.
   - Tabs thao tác nhanh cho sự cố mới, hợp đồng sắp hết hạn và hóa đơn quá hạn.
2. **`/apartments`** (Quản lý Căn hộ):
   - Bảng Enterprise DataTable sắp xếp theo mã căn, tòa nhà, diện tích, tầng.
   - `FilterBar` lọc nhanh theo tòa nhà và trạng thái phòng.
   - Bấm vào căn hộ mở `DetailDrawer` xem chi tiết cấu trúc phòng và danh sách cư dân.
   - Modal thêm/sửa bằng `FormDialog`.
3. **`/residents`** (Hồ sơ Cư dân):
   - Bảng dữ liệu tìm kiếm đa năng theo họ tên, CCCD/Passport hoặc số điện thoại.
   - Lọc theo mối quan hệ (Chủ hộ, Thân nhân, Khách thuê) và trạng thái cư trú.
   - Xem hồ sơ lý lịch trong `DetailDrawer`.
4. **`/contracts`** (Quản lý Hợp đồng):
   - Cảnh báo trực quan các hợp đồng sắp hết hạn dưới 30 ngày.
   - Lọc theo loại hợp đồng (Mua bán / Cho thuê) và trạng thái hiệu lực.
   - Slide-over `DetailDrawer` hiển thị đầy đủ thời hạn, tiền thuê và tiền cọc.
5. **`/fees`** (Danh mục Biểu phí):
   - Quản lý biểu phí dịch vụ, điện nước, gửi xe với đơn vị đo lường linh hoạt.
   - Thiết lập đơn giá nhanh chóng qua `FormDialog`.
6. **`/invoices`** (Quản lý Hóa đơn & Thu nợ):
   - Thẻ thống kê tổng phát hành, thực thu và công nợ tồn đọng.
   - Nút phát hành tự động hàng loạt cho toàn bộ căn hộ theo tháng.
   - `DetailDrawer` liệt kê chi tiết từng dòng mục phí (nước, điện, phí quản lý, phí xe).
7. **`/feedbacks`** (Phản ánh & Sự cố Kỹ thuật):
   - Theo dõi sự cố theo phân loại và mức độ ưu tiên (Khẩn cấp, Cao, Trung bình, Thấp).
   - Modal tiếp nhận $\rightarrow$ xử lý $\rightarrow$ hoàn thành kèm nội dung phản hồi kỹ thuật.
   - Xem ảnh hiện trường đính kèm và điểm đánh giá sao (1-5 sao) của cư dân.
8. **`/notifications`** (Quản lý Thông báo):
   - Tìm kiếm nội dung thông báo, theo dõi số lượt đọc của cư dân.
   - Tạo và phát thông báo mới tới toàn thể tòa nhà.

### Phân hệ Cư Dân (Resident Portal)
1. **`/home`** (Trang chủ Cư dân):
   - Thẻ căn hộ đang ở, widget nhắc nhở nợ phí dịch vụ đến hạn và các thông báo mới nhất.
2. **`/resident/invoices`** (Hóa đơn Căn hộ):
   - Xem chi tiết từng hóa đơn, tải biên lai PDF qua thư viện jsPDF.
   - Cổng thanh toán Sandbox VietQR / Ví MoMo mô phỏng quét mã trực tiếp.
3. **`/resident/feedback`** (Báo sự cố & Đánh giá):
   - Form báo hỏng thiết bị trực quan, theo dõi phản hồi từ BQL.
   - Widget chấm điểm hài lòng 1 đến 5 sao và để lại nhận xét.
4. **`/resident/notifications`** (Hộp thư Thông báo):
   - Danh sách thông báo tòa nhà, tự động đánh dấu đã đọc khi xem.

---

## 5. Kiểm thử & Đánh giá Kỹ thuật (Verification & Quality)

* **TypeScript Typecheck**:
  Lệnh `npx tsc --noEmit` hoàn thành với mã thoát **0** (Code exited with code 0) — **0 lỗi Type**.
* **Responsive Layout**:
  - Desktop / Laptop: Thanh bên hỗ trợ mở rộng (256px) hoặc thu gọn (72px) có tooltip.
  - Mobile: Drawer trượt từ cạnh trái có lớp phủ mờ (backdrop blur), thanh điều hướng đáy (MobileBottomNav) thao tác 1 tay thuận tiện.
  - Bảng dữ liệu có thanh cuộn ngang mượt mà, không bị vỡ bố cục trên màn hình nhỏ.
* **Dark Mode**:
  - Hỗ trợ đầy đủ biến màu nền, viền và chữ trên cả chế độ Sáng (Light) và Tối (Dark).

---

## 6. Các vấn đề còn tồn tại & Đề xuất Phase tiếp theo

### Vấn đề tồn tại (Pending Enhancements)
1. **Upload ảnh thực tế lên Cloud Storage**:
   - Hiện tại ảnh sự cố trong feedback đang dùng URL mẫu hoặc ảnh tĩnh. Nên tích hợp thêm AWS S3, Cloudinary hoặc Vercel Blob để cư dân upload ảnh trực tiếp từ điện thoại.
2. **Realtime Push Notifications**:
   - Hiện thông báo cập nhật qua refetching của React Query. Có thể nâng cấp thêm WebSocket hoặc Server-Sent Events (SSE) để BQL và cư dân nhận thông báo tức thì.

### Đề xuất cho Phase tiếp theo
1. **Tích hợp Cổng thanh toán Thật**:
   - Kết nối cổng thanh toán VNPay IPN thực tế hoặc PayOS để nhận Webhook gạch nợ tự động khi cư dân chuyển khoản thành công.
2. **Module Thẻ xe & Ra vào thông minh (Access Control)**:
   - Thêm tính năng quản lý biển số xe, thẻ từ thang máy và tích hợp camera nhận diện biển số tại cổng hầm.
3. **Xuất báo cáo Excel nâng cao**:
   - Bổ sung nút Export Excel (xlsx) hàng loạt danh sách căn hộ, cư dân và sổ thu nợ tài chính cho phòng kế toán BQL.
