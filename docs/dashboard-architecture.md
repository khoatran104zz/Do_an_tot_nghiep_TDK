# Kiến Trúc Smart Apartment Operations Dashboard

Tài liệu chi tiết về kiến trúc dữ liệu, luồng xử lý và tối ưu hóa hiệu năng cho phân hệ **Smart Apartment Operations Dashboard**.

---

## 1. Luồng Dữ Liệu Tổng Thể (End-to-End Architecture)

Hệ thống tuân thủ kiến trúc API-First 5 tầng phân tách trách nhiệm chặt chẽ, loại bỏ hoàn toàn tình trạng request waterfall ở phía client:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend UI Component                                    │
│    (src/app/(management)/dashboard/page.tsx)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │  TanStack Query Hook
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Custom Query Hook                                        │
│    useManagementDashboard(months: 6 | 12)                   │
│    (src/hooks/use-dashboard.ts)                             │
└──────────────────────────────┬──────────────────────────────┘
                               │  HTTP Client (staleTime: 30s)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API Route Handler (REST API)                             │
│    GET /api/dashboard/management?months=6                   │
│    (src/app/api/dashboard/management/route.ts)              │
└──────────────────────────────┬──────────────────────────────┘
                               │  Business Service Layer
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Server Service & Repository                              │
│    DashboardService ──► DashboardRepository                │
│    (src/modules/dashboard/dashboard.repository.ts)          │
└──────────────────────────────┬──────────────────────────────┘
                               │  Prisma ORM Aggregations
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PostgreSQL Database Container                            │
│    Tables: apartments, residents, contracts, invoices,       │
│            invoice_items, feedbacks, notifications           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Chi Tiết 9 Phân Khu Chức Năng (Dashboard Sections)

### SECTION 1 — Welcome / Operational Context
* **Giao diện**: Lời chào thân thiện theo thời gian thực (Buổi sáng / chiều / tối), ngày tháng tiếng Việt chuẩn, huy hiệu `Live System` nhấp nháy xanh thể hiện kết nối máy chủ hoạt động tốt.
* **Nút "Làm mới" (Sync)**: Cho phép BQL kích hoạt refetch dữ liệu tức thời qua TanStack Query mà không phải reload trang.

### SECTION 2 — Key Performance Indicators (6 Thẻ Số Liệu)
Tất cả 6 thẻ KPI đều được tính toán từ các hàm tổng hợp tại database và so sánh trực tiếp với chu kỳ trước:
1. **Tổng căn hộ**: Số lượng căn hiện có, tăng trưởng so với tháng trước (`createdAt < startOfCurrentMonth`).
2. **Tỷ lệ lấp đầy (%)**: Tỷ lệ căn hộ có trạng thái `OCCUPIED` trên tổng số căn.
3. **Tổng cư dân**: Cư dân có trạng thái `RESIDING`, tính % biến động.
4. **Doanh thu tháng (VNĐ)**: Doanh thu phát hành trong kỳ hiện tại (`billingMonth`) so với kỳ liền kề trước đó.
5. **Công nợ tồn đọng (VNĐ)**: Tổng số tiền của các hóa đơn có trạng thái `UNPAID` và `OVERDUE`.
6. **Ticket đang xử lý**: Tổng số phản ánh kỹ thuật ở trạng thái `NEW` hoặc `PROCESSING`.

### SECTION 3 — Revenue Analytics (Revenue vs Collection)
* **Loại biểu đồ**: BarChart kép so sánh `Tổng phát hành (Billed)` và `Thực thu (Collected)`.
* **Tùy chọn khoảng thời gian**: Cho phép BQL chuyển đổi giữa **6 Tháng** và **12 Tháng**.
* **Định dạng Tooltip**: Hiển thị đơn vị tiền tệ VNĐ chuẩn hóa qua `formatCurrency(val)`.

### SECTION 4 — Occupancy Donut Chart
* **Phân bổ trạng thái**: Đang ở (`OCCUPIED`), Đang trống (`VACANT`), Đang sửa chữa (`UNDER_MAINTENANCE`).
* **Tương tác trực tiếp (Interactive Navigation)**: Nhấp vào từng phần của biểu đồ hoặc danh sách bên cạnh sẽ tự động điều hướng sang trang `/apartments?status=...` với bộ lọc tương ứng.

### SECTION 5 — Maintenance Operations
* **Tiến trình xử lý**: Thống kê số lượng ticket: Mới (`NEW`), Đang xử lý (`PROCESSING`), Hoàn thành (`RESOLVED`), Từ chối (`REJECTED`).
* **Mức độ ưu tiên**: Phân bổ theo Khẩn cấp (`URGENT`), Cao (`HIGH`), Trung bình (`MEDIUM`), Thấp (`LOW`).
* **Critical Tickets Widget**: Bảng danh sách các sự cố khẩn cấp tồn đọng kèm thông tin căn hộ, số điện thoại cư dân và nút "Xử lý ngay".

### SECTION 6 — Quick Actions
* Phím tắt hành động nhanh có kiểm tra vai trò người dùng (RBAC):
  - Thêm Căn hộ mới (`/apartments`)
  - Thêm Cư dân (`/residents`)
  - Phát hành Hóa đơn hàng loạt (`/invoices`)
  - Đăng Thông báo chung (`/notifications`)
  - Xử lý Sự cố kỹ thuật (`/feedbacks`)

### SECTION 7 — Live Operations Activity Feed
* Dòng nhật ký thời gian thực được tổng hợp trực tiếp từ cơ sở dữ liệu:
  - Giao dịch thanh toán hóa đơn thành công (`Invoice.paidAt`)
  - Phản ánh sự cố kỹ thuật mới hoặc vừa được cập nhật (`Feedback.updatedAt`)
  - Bản tin thông báo vừa phát hành (`Notification.createdAt`)
* Sắp xếp theo thứ tự thời gian giảm dần (mới nhất hiển thị trước).

### SECTION 8 — Alert Center (Cảnh Báo Thông Minh Có Điều Kiện)
* Tự động kích hoạt khi có các điều kiện bất thường:
  - 🔴 **Hóa đơn quá hạn**: Xuất hiện khi có hóa đơn `OVERDUE` $\rightarrow$ CTA xem danh sách.
  - 🟠 **Sự cố khẩn cấp**: Xuất hiện khi có ticket `URGENT` chưa hoàn thành $\rightarrow$ CTA điều phối thợ sửa.
  - 🟡 **Hợp đồng sắp hết hạn**: Xuất hiện khi có hợp đồng hết hạn trong 30 ngày $\rightarrow$ CTA xem xét gia hạn.
  - 🟡 **Tỷ lệ thu phí thấp**: Cảnh báo khi tỷ lệ thu hồi trong tháng dưới 70%.

---

## 3. Tối Ưu Hóa Truy Vấn Cơ Sở Dữ Liệu (Query Performance)

Để đảm bảo thời gian phản hồi (Latency) luôn dưới **100ms** và không gây tắc nghẽn I/O:

1. **Tổng hợp dữ liệu một lần (Single Aggregation Endpoint)**:
   Thay vì client phải bắn 6-8 request API riêng rẽ gây tình trạng network waterfall, endpoint `GET /api/dashboard/management` tổng hợp toàn bộ trong một payload duy nhất.

2. **Chạy song song bằng `Promise.all`**:
   15 truy vấn Prisma được thực thi đồng thời trong một connection pool duy nhất của PostgreSQL:
   ```typescript
   const [
     totalApartments,
     prevApartmentsCount,
     occupancyGroupBy,
     totalResidents,
     currentMonthBilled,
     currentMonthCollected,
     // ...
   ] = await Promise.all([ ... ]);
   ```

3. **Sử dụng Prisma `groupBy` và `aggregate` tại Database**:
   - Nhóm doanh thu theo tháng và trạng thái:
     ```typescript
     prisma.invoice.groupBy({
       by: ['billingMonth', 'status'],
       _sum: { totalAmount: true },
       where: { billingMonth: { in: monthKeys }, status: { not: 'CANCELLED' } }
     });
     ```
   - Nhóm căn hộ theo trạng thái ở:
     ```typescript
     prisma.apartment.groupBy({
       by: ['status'],
       _count: { id: true }
     });
     ```
   - Không nạp danh sách lớn vào Node.js RAM để lọc mảng thủ công.

4. **Giới hạn số lượng bản ghi (Limit / Take)**:
   Tất cả danh sách phụ (Critical Tickets, Activity Feed) đều được giới hạn `take: 5` và chỉ `select` các trường cần thiết.

5. **Client Caching bằng TanStack Query**:
   `staleTime: 30 * 1000` (30 giây) tránh việc re-fetch dư thừa khi người dùng chuyển đổi tab qua lại, nhưng tự động đồng bộ lại khi focus lại cửa sổ trình duyệt (`refetchOnWindowFocus: true`).
