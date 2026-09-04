# BÁO CÁO PHÂN TÍCH TOÀN DIỆN KIẾN TRÚC, GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX AUDIT)
**Dự án**: Hệ thống Quản lý Chung cư Thông minh (Smart Apartment Management System)  
**Phiên bản phân tích**: 0.1.0  
**Ngày lập báo cáo**: Tháng 09/2026  
**Mục tiêu**: Đánh giá hiện trạng toàn bộ codebase, kiến trúc frontend/backend, giao diện và luồng trải nghiệm người dùng; xác định các khiếm khuyết và đề xuất lộ trình cải tiến (redesign/refactor) mà không làm gián đoạn logic nghiệp vụ.

---

## 1. Project Overview (Tổng quan Dự án)

### 1.1 Mục đích & Nghiệp vụ cốt lõi
Hệ thống là nền tảng quản lý vận hành chung cư toàn diện, phục vụ hai đối tượng chính:
1. **Ban Quản Lý (BQL)**: Quản trị căn hộ, cư dân, hợp đồng thuê/bán, định mức danh mục phí, phát hành hóa đơn tự động hàng tháng, tiếp nhận và điều phối sửa chữa sự cố kỹ thuật, phát thông báo tòa nhà, theo dõi chỉ số tài chính & tỷ lệ lấp đầy qua Dashboard.
2. **Cư Dân (Resident)**: Cổng thông tin tự phục vụ giúp xem thông tin căn hộ, tra cứu chi tiết hóa đơn dịch vụ hàng tháng, thanh toán trực tuyến qua mã QR (giả lập VNPay/MoMo), tải biên lai PDF, gửi phản ánh sự cố kèm độ ưu tiên và đánh giá chất lượng xử lý 5 sao.

### 1.2 Mô hình kiến trúc tổng quát
Dự án được xây dựng theo kiến trúc **API-First Full-stack Monorepo** với Next.js App Router (TypeScript). Mọi tương tác giao diện đều tách bạch thành 5 tầng rõ rệt:
```
[React UI Components] (Client)
        │
        ▼
[Custom Hooks - TanStack Query] (src/hooks/)
        │
        ▼
[HTTP Client Services] (src/services/ -> src/lib/api-client.ts)
        │
        ▼
[Route Handlers - REST API] (src/app/api/**/route.ts)
        │
        ▼
[Server Domain Services] (src/modules/*/*.service.ts)
        │
        ▼
[Server Repositories / Prisma ORM] (src/modules/*/*.repository.ts -> PostgreSQL)
```

---

## 2. Current Architecture (Kiến trúc Hiện tại)

### 2.1 Tech Stack Chi Tiết

| Thành phần | Công nghệ / Thư viện | Phiên bản | Nhận xét & Đánh giá hiện trạng |
|---|---|---|---|
| **Core Framework** | Next.js (App Router) | `16.3.1` | Sử dụng cấu trúc thư mục mới nhất với Route Groups `(auth)`, `(management)`, `(resident)`. |
| **Core UI Engine** | React / React-DOM | `19.2.8` | Sử dụng React 19 mới nhất. |
| **Language** | TypeScript | `^5` | Strict mode bật, có định nghĩa types cho NextAuth và Prisma. |
| **Styling & CSS** | TailwindCSS | `^4` (PostCSS) | Cấu hình qua `@import "tailwindcss";` trong `globals.css`. **Chưa cấu hình `@theme` mapping cho biến CSS HSL**, dẫn đến việc codebase phải dùng hardcoded Tailwind color classes (`bg-blue-600`, `text-slate-900`...). |
| **UI Components** | Custom Radix-like Components | Tự viết | Codebase có folder `components/ui/` (`button`, `card`, `dialog`, `input`, `select`, `table`, `badge`), lấy cảm hứng từ shadcn/ui nhưng **không cài `@radix-ui/*`**, các component được viết bằng DOM thuần + Tailwind. |
| **Icons** | Lucide React | `^1.31.0` | Bộ icon chuẩn, nhất quán, nhẹ. |
| **Charts & Analytics** | Recharts | `^3.10.1` | Sử dụng trên Dashboard cho BarChart (doanh thu, sự cố) và PieChart (trạng thái căn hộ). |
| **Toast Notifications** | Sonner | `^2.0.8` | Cấu hình `<Toaster position="top-right" richColors closeButton />` trong `AppProviders`. |
| **State Management** | TanStack React Query + React State | React Query `^5.101.4` | Server state quản lý tốt bằng React Query cache. **`zustand` (`^5.0.15`) đã cài trong `package.json` nhưng chưa từng được sử dụng trong bất kỳ file nào**. Form state hoàn toàn dùng `useState` thủ công. |
| **Form Handling** | Controlled State (`useState`) | Thủ công | **`react-hook-form` (`^7.85.0`) và `@hookform/resolvers` (`^5.9.1`) đã cài nhưng KHÔNG được sử dụng**. Form hoàn toàn dùng controlled input, thiếu validation schema runtime ở phía client. |
| **Data Validation** | Zod | `^4.4.3` | Hiện chủ yếu dùng ở server-side repositories/services (`z.object(...)`). Phía client form chưa kích hoạt Zod resolver. |
| **Authentication** | NextAuth.js (v4) | `^4.24.11` | Credentials Provider, JWT session (30 ngày), bcryptjs (`^3.0.3`) mã hóa mật khẩu, session chứa `role`, `apartmentId`, `residentId`. |
| **Route Guarding** | Next.js Middleware | Custom | Kiểm tra token JWT trong `src/middleware.ts`, tự động redirect theo role và bảo vệ các routes quản lý/cư dân. |
| **Database & ORM** | PostgreSQL + Prisma ORM | Prisma `^5.22.0` | Schema rõ ràng, seed data mẫu hoàn chỉnh, quan hệ khóa ngoại (Foreign Keys) chặt chẽ. |
| **PDF Export** | jsPDF + html2canvas | `jspdf: ^4.2.1`, `html2canvas: ^1.4.1` | Xuất biên lai hóa đơn cho cư dân (đang dùng jsPDF vẽ text tọa độ cứng). |
| **Utilities** | `clsx` + `tailwind-merge` + `class-variance-authority` | CVA `^0.7.1`, clsx `^2.1.1`, twMerge `^3.6.0` | Hỗ trợ hàm `cn()` ghép class Tailwind. |

### 2.2 Cấu trúc Thư mục (Directory Structure)

```
DATN_1/
├── prisma/
│   ├── schema.prisma              # 8 Data models, 8 Enums
│   └── seed.ts                    # Script tạo dữ liệu mẫu (Users, Apartments, Fees, Invoices...)
├── public/                        # Static assets (favicon...)
├── docs/
│   ├── erd.md                     # Sơ đồ ERD quan hệ thực thể
│   ├── api-collection.json        # Postman/Thunder Client REST API collection
│   └── UI-UX-AUDIT.md             # Báo cáo kiểm toán UI/UX hiện tại (Tài liệu này)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx     # Đăng nhập (Tabs: Ban Quản Lý / Cư Dân)
│   │   │   └── register/page.tsx  # Đăng ký tài khoản cư dân
│   │   ├── (management)/
│   │   │   ├── layout.tsx         # Layout BQL (Sidebar + Topbar + Main container)
│   │   │   ├── dashboard/page.tsx # Tổng quan vận hành, KPI & Biểu đồ Recharts
│   │   │   ├── apartments/page.tsx# CRUD căn hộ, trạng thái, bộ lọc tòa/tầng
│   │   │   ├── residents/page.tsx # CRUD cư dân, CCCD, quan hệ chủ hộ, gán căn hộ
│   │   │   ├── contracts/page.tsx # CRUD hợp đồng thuê/mua, cảnh báo hạn <30 ngày
│   │   │   ├── fees/page.tsx      # Cấu hình đơn giá danh mục phí
│   │   │   ├── invoices/page.tsx  # Quản lý hóa đơn, sinh hóa đơn hàng loạt
│   │   │   ├── feedbacks/page.tsx # Tiếp nhận báo cáo sự cố & phản hồi xử lý
│   │   │   └── notifications/page.tsx # Đăng thông báo toàn tòa nhà
│   │   ├── (resident)/
│   │   │   ├── layout.tsx         # Layout Cư dân (Sidebar rút gọn + Topbar)
│   │   │   ├── home/page.tsx      # Dashboard cư dân, tổng quan nợ phí, phím tắt
│   │   │   └── resident/          # (Sub-route cư dân)
│   │   │       ├── invoices/page.tsx      # Hóa đơn của tôi, QR Sandbox, xuất PDF
│   │   │       ├── feedback/page.tsx      # Gửi báo sự cố, đánh giá 5 sao
│   │   │       └── notifications/page.tsx # Trung tâm thông báo, đánh dấu đã đọc
│   │   ├── api/                   # REST Route Handlers cho 9 domain modules
│   │   ├── globals.css            # Base Tailwind v4, CSS Variables & scrollbar
│   │   ├── layout.tsx             # Root layout, gắn font, AppProviders
│   │   └── page.tsx               # Root redirect controller theo trạng thái đăng nhập
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # Navigation sidebar đa phân hệ (BQL / Cư dân)
│   │   │   └── Topbar.tsx         # Header thanh điều hướng, bell, avatar, logout
│   │   ├── shared/
│   │   │   ├── ConfirmDialog.tsx  # Modal xác nhận thao tác nguy hiểm (xóa)
│   │   │   ├── DataTable.tsx      # Bảng dữ liệu tái sử dụng kèm search, skeleton, pagination
│   │   │   ├── PageHeader.tsx     # Tiêu đề trang + description + action buttons
│   │   │   └── StatCard.tsx       # Thẻ chỉ số KPI kèm icon & badge trend
│   │   └── ui/                    # Base components: button, card, dialog, input, select, table, badge
│   ├── hooks/                     # 9 custom React Query hooks cho từng phân hệ
│   ├── lib/                       # api-client, api-response, auth, prisma, providers, utils
│   ├── modules/                   # Server domain logic: schema, service, repository cho 9 modules
│   ├── services/                  # 9 client HTTP services đóng gói API calls
│   ├── types/                     # NextAuth module augmentation
│   └── middleware.ts              # Route Guarding & RBAC middleware
```

---

## 3. Current Roles (Phân tích Vai trò trong Hệ thống)

Dựa trên kiểm tra `prisma/schema.prisma`, `src/middleware.ts`, `src/lib/auth.ts` và toàn bộ mã nguồn frontend:

### 3.1 Bảng phân tích các Role hiện có trong Codebase

| Tên Role (Enum) | Có trong DB? | Có trong Middleware? | Có màn hình riêng? | Quyền hạn thực tế trong Source Code |
|---|---|---|---|---|
| **`RESIDENT`** | **CÓ** | **CÓ** | **CÓ** | Bị chặn không cho vào các trang `/dashboard`, `/apartments`, `/residents`, `/contracts`, `/fees`, `/invoices`, `/feedbacks`, `/notifications`. Chỉ được vào `/home` và `/resident/*`. Dữ liệu hóa đơn, phản ánh được filter theo `apartmentId` / `residentId`. |
| **`MANAGER`** | **CÓ** | **CÓ** | **CÓ** | Được toàn quyền truy cập phân hệ BQL (`/dashboard`, `/apartments`, `/residents`, `/contracts`, `/fees`, `/invoices`, `/feedbacks`, `/notifications`). |
| **`ADMIN`** | **CÓ** | **CÓ** (Gộp chung với MANAGER) | **KHÔNG** | **Không có bất kỳ màn hình hoặc API endpoint nào dành riêng cho ADMIN**. Trong `Topbar.tsx` và `Sidebar.tsx`, `ADMIN` chỉ được phân biệt duy nhất bằng việc hiển thị text nhãn `"Admin"` / `"Quản trị viên"` thay vì `"Ban Quản Lý"`. Mọi quyền truy cập của ADMIN và MANAGER trong code là hoàn toàn đồng nhất. |
| **`STAFF`** (Kỹ thuật/Bảo vệ/Lễ tân) | **KHÔNG** | **KHÔNG** | **KHÔNG** | Không tồn tại trong Enum Role của Prisma, không có màn hình phân công công việc kỹ thuật viên. |

> [!IMPORTANT]
> **Kết luận về Role**: Hệ thống hiện chỉ có **2 luồng giao diện thực tế**:
> 1. Phân hệ Quản Lý (Admin & Manager dùng chung 1 giao diện).
> 2. Phân hệ Cư Dân (Resident).  
> **Chưa có** màn hình Quản trị hệ thống dành riêng cho Super Admin (quản lý danh sách tài khoản BQL, phân quyền chức năng chi tiết, xem log hệ thống), và **chưa có** Role Staff (Nhân viên kỹ thuật tiếp nhận ticket).

---

## 4. Current Screens (Danh mục Màn hình Hiện có & Đối chiếu Nghiệp vụ)

### 4.1 Danh sách 14 màn hình hiện có

| STT | Tên màn hình | Đường dẫn Route | Role truy cập | Mục đích & Chức năng chính |
|---|---|---|---|---|
| 1 | **Login** | `/(auth)/login` | Khách / Chưa login | Đăng nhập với 2 tab chuyển đổi nhanh (BQL / Cư dân). Hỗ trợ nút click tự điền tài khoản mẫu (Demo fill). |
| 2 | **Register** | `/(auth)/register` | Khách / Cư dân | Cư dân tự tạo tài khoản: Họ tên, email, SĐT, CCCD/CMND, mã căn hộ, mật khẩu. |
| 3 | **BQL Dashboard** | `/(management)/dashboard` | ADMIN, MANAGER | 4 StatCards KPI (Lấp đầy, cư dân, thu phí, sự cố tồn), biểu đồ cột doanh thu 6 tháng, biểu đồ tròn căn hộ, biểu đồ ngang sự cố, tin vận hành nổi bật. |
| 4 | **Apartment Management** | `/(management)/apartments` | ADMIN, MANAGER | Bảng danh sách căn hộ, tìm kiếm mã căn, lọc theo Tòa (A/B/C) & trạng thái (Đang ở/Trống/Sửa chữa), Modal thêm/sửa, Dialog xóa. |
| 5 | **Resident Management** | `/(management)/residents` | ADMIN, MANAGER | Bảng cư dân, tìm kiếm theo tên/SĐT/CCCD, lọc quan hệ (Chủ hộ/Thân nhân/Khách thuê) & trạng thái cư trú, Modal thêm/sửa có gán căn hộ, Dialog xóa. |
| 6 | **Contract Management** | `/(management)/contracts` | ADMIN, MANAGER | Bảng hợp đồng, lọc loại (Thuê/Mua) & trạng thái (Hiệu lực/Hết hạn/Thanh lý), nút lọc nhanh "Sắp hết hạn <30 ngày", Modal thêm/sửa, Dialog xóa. |
| 7 | **Fee Categories** | `/(management)/fees` | ADMIN, MANAGER | Bảng cấu hình định mức phí (Quản lý m², xe máy, ô tô, điện kWh, nước m³), Modal thêm/sửa đơn giá, chặn xóa phí hệ thống. |
| 8 | **Invoice Management** | `/(management)/invoices` | ADMIN, MANAGER | 3 StatCards tài chính (Tổng thu, đã thu, còn nợ), bộ lọc kỳ billing & trạng thái thanh toán, Modal sinh hóa đơn tự động hàng loạt cả tòa, Modal xem chi tiết items hóa đơn. |
| 9 | **Feedback / Ticket Management**| `/(management)/feedbacks` | ADMIN, MANAGER | Bảng tiếp nhận phản ánh, lọc danh mục (Điện/Nước/Thang máy/An ninh/Vệ sinh) & trạng thái, Modal tiếp nhận xử lý và gửi phản hồi cho cư dân. |
| 10 | **Notification Management** | `/(management)/notifications` | ADMIN, MANAGER | Danh sách thẻ thông báo BQL đã phát đi, Modal đăng thông báo mới toàn tòa nhà, nút xóa thông báo. |
| 11 | **Resident Home Portal** | `/(resident)/home` | RESIDENT | Banner chào mừng cá nhân hóa, 3 StatCards (tiền nợ, sự cố đang xử lý, tin tức), 3 Card shortcut hành động nhanh, widget thông báo mới nhất. |
| 12 | **Resident Invoices & Pay** | `/(resident)/resident/invoices`| RESIDENT | Danh sách card hóa đơn căn hộ, xem chi tiết từng khoản, Modal cổng thanh toán Sandbox QR (VNPay / MoMo giả lập), tính năng xuất biên lai PDF bằng jsPDF. |
| 13 | **Resident Feedback & Rating** | `/(resident)/resident/feedback`| RESIDENT | Danh sách phản ánh đã gửi, trạng thái xử lý, xem phản hồi của BQL, Modal tạo phản ánh mới kèm độ ưu tiên, Modal đánh giá 5 sao sau khi xong. |
| 14 | **Resident Notifications** | `/(resident)/resident/notifications`| RESIDENT | Danh sách thông báo toàn tòa, chỉ báo chấm xanh chưa đọc, click vào thẻ để tự động đánh dấu đã đọc (`NotificationRead`). |

### 4.2 Các màn hình CHƯA CÓ (Gaps so với yêu cầu quản lý chung cư thực tế)

- ❌ **Vehicle Management (Quản lý phương tiện / Giữ xe)**: Chưa có màn hình quản lý biển số xe máy, ô tô của từng căn hộ; số lượng xe hiện đang bị fix cứng `quantity = 2` khi sinh hóa đơn trong `invoice.service.ts`.
- ❌ **Facility / Amenity Booking (Đặt tiện ích tòa nhà)**: Chưa có màn hình đặt lịch sử dụng tiện ích nội khu (khu BBQ, sân tennis, phòng sinh hoạt cộng đồng, bể bơi).
- ❌ **User Profile & Account Settings (`/profile`)**: Chưa có màn hình xem thông tin tài khoản cá nhân, đổi mật khẩu, cập nhật ảnh đại diện (avatar), cấu hình thông báo. Click vào Avatar ở Topbar không mở ra Profile menu.
- ❌ **Admin System & User Management (`/admin/users`, `/admin/audit-logs`)**: Chưa có màn hình tạo tài khoản nhân viên BQL, phân quyền vai trò (RBAC) hoặc theo dõi lịch sử thao tác hệ thống.
- ❌ **Work Order Dispatching (Điều phối kỹ thuật viên)**: Chưa có luồng gán kỹ thuật viên cụ thể chịu trách nhiệm xử lý từng sự cố ticket.

---

## 5. Current Design System Analysis (Phân tích Hệ thống Thiết kế Hiện tại)

### 5.1 Bảng màu (Color Palette)
- **Cấu hình `globals.css`**: Đã khai báo biến CSS HSL (`--primary`, `--background`, `--card`, `--foreground`, `--border`...) nhưng **chưa được ánh xạ vào cấu hình Tailwind CSS v4** (thiếu `@theme inline` mapping).
- **Màu sắc thực tế sử dụng trong code**: Toàn bộ UI đang gọi trực tiếp màu utility mặc định của Tailwind:
  - Màu chủ đạo (Primary): `blue-600` (`#2563eb`), hover `blue-700`, nền nhạt `blue-50`.
  - Màu trạng thái thành công (Success): `emerald-600`, nền nhạt `emerald-50`.
  - Màu cảnh báo (Warning): `amber-600` / `amber-500`, nền nhạt `amber-50`.
  - Màu nguy hiểm (Destructive): `red-600`, nền nhạt `red-50`.
  - Màu trung tính (Neutrals): Thang màu `slate` (`slate-50`, `slate-100`, `slate-200`, `slate-400`, `slate-500`, `slate-700`, `slate-900`).
- **Đánh giá**: Bảng màu an toàn, sạch sẽ nhưng mang phong cách "mẫu dashboard bootstrap" cổ điển, thiếu độ tương phản hiện đại, chưa có dark mode khả dụng (mặc dù có class `.dark` trong CSS nhưng không có toggle chuyển đổi).

### 5.2 Typography (Kiểu chữ)
- **Font chữ**: Sử dụng chuỗi system font mặc định:
  `font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;`
- **Chưa nhúng font Google Web Font** chất lượng cao (như Inter, Plus Jakarta Sans, Outfit, Roboto).
- **Phân cấp cỡ chữ (Type Scale)**:
  - Tiêu đề trang (`h1`): `text-2xl font-bold` (24px).
  - Tiêu đề card / modal (`h2`, `h3`): `text-base` hoặc `text-lg font-bold` (16px - 18px).
  - Body text: `text-sm` (14px) và `text-xs` (12px).
  - Text phụ/caption: `text-[11px]` hoặc `text-[10px]`.
- **Đánh giá**: Cỡ chữ bị thiên hướng quá nhỏ (`text-xs` chiếm tới 60% diện tích các trang quản lý), gây mỏi mắt cho người quản lý tòa nhà lớn tuổi khi xem dữ liệu trên màn hình độ phân giải cao.

### 5.3 Thành phần Giao diện Cơ bản (UI Components)

| Component | File Path | Cách thức triển khai | Đánh giá ưu điểm & Nhược điểm |
|---|---|---|---|
| **Button** | `components/ui/button.tsx` | CVA (`class-variance-authority`) với các variant: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `success`. | **Ưu**: Tái sử dụng tốt, chuẩn props HTML.<br>**Nhược**: Chưa có slot hiển thị `loading` spinner tích hợp (chỉ đổi text thủ công), hiệu ứng hover còn đơn điệu. |
| **Card** | `components/ui/card.tsx` | Chia nhỏ thành `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. | **Ưu**: Cấu trúc chuẩn shadcn pattern.<br>**Nhược**: Viền `border-slate-200` phẳng lì, đổ bóng `shadow-sm` quá mỏng, thiếu cảm giác chiều sâu (elevation). |
| **Table** | `components/ui/table.tsx` & `shared/DataTable.tsx` | Bọc trong container `overflow-auto`, chia `TableHeader`, `TableBody`, `TableRow`, `TableCell`. Hỗ trợ skeleton loading và empty state. | **Ưu**: `DataTable` dùng chung rất gọn gàng, tự động phân trang và tìm kiếm.<br>**Nhược**: Header bảng chưa sticky khi cuộn bảng dài; chưa có tính năng sắp xếp (sortable columns); độ rộng cột cố định đôi khi làm cắt chữ; trên mobile bị tràn ngang. |
| **Modal / Dialog** | `components/ui/dialog.tsx` | Viết DOM thuần với `fixed inset-0`, background backdrop `bg-black/50 backdrop-blur-xs`. Bắt click ngoài để đóng. | **Ưu**: Gọn nhẹ, không phụ thuộc thư viện ngoài.<br>**Nhược**: **Thiếu cơ chế Focus Trap** (khả năng tiếp cận kém, phím Tab có thể lọt ra ngoài background); không khóa scroll của `body` khi mở modal khiến trang phía sau bị cuộn kép; animation mở/đóng chưa mượt. |
| **Input / Select** | `components/ui/input.tsx`, `components/ui/select.tsx` | Thẻ HTML input/select bọc Tailwind style. | **Ưu**: Đơn giản, phản hồi nhanh.<br>**Nhược**: Thẻ `<select>` là native HTML select box, không hỗ trợ tìm kiếm option (gặp thảm họa UX khi có hàng trăm căn hộ/cư dân); không có trạng thái lỗi (error border red); thiếu mask nhập tiền tệ/ngày tháng. |
| **Badge** | `components/ui/badge.tsx` | CVA badge: `default`, `secondary`, `destructive`, `success`, `warning`, `outline`. | **Ưu**: Màu sắc phân định trạng thái rõ ràng.<br>**Nhược**: Kích thước nhỏ, bo góc nhẹ, chưa có dot status dạng pulse. |
| **Toast** | `sonner` | Tích hợp qua provider `<Toaster position="top-right" richColors />`. | **Ưu**: Thông báo rõ ràng, màu sắc sinh động, tự ẩn.<br>**Nhược**: Một số thao tác thành công chưa kết hợp haptic/audio feedback nhẹ. |
| **StatCard** | `components/shared/StatCard.tsx` | Card hiển thị số liệu lớn, icon màu sắc, chỉ số tăng trưởng `% so với tháng trước`. | **Ưu**: Rõ ràng, bắt mắt.<br>**Nhược**: Số liệu phần trăm tăng trưởng hiện đang hardcoded (`trend={{ value: 5.2, isPositive: true }}` trên Dashboard). |

---

## 6. UX Problems (Phân tích Trải nghiệm Người dùng)

Qua việc walkthrough toàn bộ luồng sử dụng của cả hai phân hệ, các vấn đề trải nghiệm sau đã được phát hiện:

### 6.1 Thao tác quá nhiều bước & Thiếu tự động hóa
1. **Quy trình gạch nợ hóa đơn của BQL**: Khi cư dân đóng tiền mặt hoặc chuyển khoản trực tiếp, người quản lý phải vào trang Invoices nhưng **không có nút "Gạch nợ nhanh" (Mark as Paid)** ngay tại dòng bảng. Hiện tại quản lý chỉ có thể bấm nút "Xem chi tiết" hoặc "Xóa", không có form cập nhật trạng thái thanh toán từ phía BQL!
2. **Quy trình sinh hóa đơn hàng tháng**: Phải bấm "Tự động Tạo Hóa đơn Kỳ mới", mở modal rồi tự gõ tay chuỗi `YYYY-MM` (như `"2026-08"`). Nếu người dùng gõ sai định dạng (ví dụ `08/2026` hoặc `2026-8`), hệ thống API backend có thể xử lý sai hoặc sinh lỗi.
3. **Thanh toán giả lập của Cư dân**: Cư dân bấm "Thanh toán ngay" -> Mở modal hiển thị mã QR -> Phải bấm tiếp nút "Xác nhận Đã thanh toán (Giả lập)". Luồng này ổn cho môi trường demo nhưng thiếu thông báo giải thích rõ ràng đây là sandbox test.

### 6.2 Thiếu tính năng Tìm kiếm & Lọc Nâng cao (Search & Filtering Gaps)
1. **Không có Global Command Search (Cmd+K / Ctrl+K)**: Người quản trị muốn tìm nhanh một căn hộ (ví dụ "A-1001") hoặc một cư dân từ bất kỳ trang nào đều phải click đúng vào menu Sidebar tương ứng rồi mới gõ vào ô search của DataTable.
2. **Không hỗ trợ sắp xếp cột (Column Sorting)**: Bảng căn hộ, cư dân, hóa đơn không thể click vào header cột để sort theo Diện tích tăng/giảm, Tiền hóa đơn lớn nhất/nhỏ nhất, Ngày hết hạn hợp đồng gần nhất.
3. **Select Box Căn hộ / Cư dân không thể Search**: Trong các modal Thêm Hợp đồng (`contracts`), Thêm Cư dân (`residents`), thẻ `<select>` chứa danh sách tất cả các căn hộ và cư dân. Khi tòa nhà có 500 căn hộ, dropdown sẽ dài vô tận và người dùng không thể gõ text để lọc nhanh.

### 6.3 Phân cấp Thông tin (Visual Hierarchy) Chưa Tối Ưu
1. **Màn hình Dashboard BQL**: 4 thẻ StatCard và biểu đồ doanh thu đặt ngang hàng, chưa làm nổi bật các **hành động khẩn cấp cần xử lý ngay** (ví dụ: "Có 3 sự cố khẩn cấp chưa ai nhận", "2 hợp đồng hết hạn hôm nay").
2. **Trang chủ Cư dân (`/home`)**: Banner chào mừng màu xanh chiếm diện tích lớn nhưng không hiển thị ngay mã căn hộ của cư dân đang đăng nhập (`A-1001`). Cư dân không thấy số phòng của mình ngay trên Topbar hay Welcome Banner.

### 6.4 Thiếu Phản Hồi (Feedback) & Phòng ngừa Sai sót
1. **Không có tính năng Hoàn tác (Undo)**: Khi xóa căn hộ, cư dân, hợp đồng hoặc hóa đơn, ConfirmDialog chỉ cảnh báo "Thao tác không thể hoàn tác". Không có cơ chế Soft Delete (thùng rác) hoặc hoàn tác tạm thời.
2. **Không có Inline Form Validation Errors**: Khi người dùng submit form trong modal mà để trống trường bắt buộc, hệ thống chỉ phụ thuộc vào tooltip mặc định của trình duyệt (`HTML5 required`) hoặc toast chung chung. Không hiển thị chữ đỏ bên dưới input để chỉ rõ trường nào sai định dạng.

### 6.5 Nhầm lẫn và Bất tiện trong Điều hướng (Navigation Issues)
1. **Đường dẫn con của Cư dân bị lặp từ khóa (`/resident/resident/*`)**:
   - `src/app/(resident)/resident/invoices/page.tsx`
   - `src/app/(resident)/resident/feedback/page.tsx`
   - `src/app/(resident)/resident/notifications/page.tsx`
   URL trên trình duyệt hiển thị dạng: `http://localhost:3000/resident/resident/invoices`. Việc lặp lại `resident/resident` gây xấu URL và khó hiểu cho người dùng.
2. **Nút Chuông Thông báo trên Topbar**: Chuông thông báo có hiệu ứng `animate-ping` màu xanh nhưng khi click vào thì chuyển hướng thẳng sang trang `/notifications`, **không có Dropdown Popover xem nhanh 5 thông báo mới nhất**.
3. **Avatar Người dùng trên Topbar**: Khi click vào Avatar hoặc tên người dùng ở góc phải màn hình, không có Dropdown Menu (đổi mật khẩu, hồ sơ, cài đặt), chỉ có duy nhất nút icon Đăng xuất bên cạnh.

---

## 7. UI Problems (Phân tích Chi tiết Giao diện)

### 7.1 Layout & Khoảng cách (Spacing & Padding)
- Các trang quản lý dùng container `max-w-7xl`, trang cư dân dùng `max-w-5xl`. Tuy nhiên khoảng cách padding giữa các khối card (`space-y-6`, `p-4 sm:p-6 lg:p-8`) trên màn hình ultrawide tạo ra nhiều khoảng trắng thừa thãi không cần thiết, trong khi nội dung bảng lại bị co cụm ở giữa.
- Filter toolbar nằm trong một Card riêng biệt, tạo ra cảm giác bị phân mảnh giữa ô tìm kiếm của `DataTable` (nằm ở dưới) và các ô dropdown lọc (nằm ở trên).

### 7.2 Sidebar & Topbar
- **Sidebar**:
  - Không có tính năng thu gọn (Collapse sang dạng chỉ icon) trên màn hình máy tính để bàn, luôn chiếm cố định `w-64` (256px).
  - Không hiển thị badge số lượng thông báo chưa đọc hoặc số sự cố mới cạnh menu "Phản ánh & Sự cố" và "Thông báo".
  - Chân Sidebar hiển thị card thông tin tĩnh "Hệ thống v1.0", không có giá trị tương tác.
- **Topbar**:
  - Tên tòa nhà "Tòa nhà High-Tech Apartment" bị fix cứng bằng text tĩnh, không lấy từ cấu hình hệ thống.
  - Avatar chỉ lấy ký tự đầu của tên, không hỗ trợ hiển thị ảnh đại diện thực tế (`avatarUrl` đã có trong Prisma model `User` nhưng chưa được load lên Topbar).

### 7.3 Bảng Dữ liệu (DataTable)
- STT được tính theo trang: `(page - 1) * 10 + index + 1`.
- Khi dữ liệu nhiều cột (như trang Hợp đồng gồm 8 cột: Mã HĐ, Căn hộ, Cư dân, Loại HĐ, Thời hạn, Giá thuê, Trạng thái, Thao tác), bảng bị ép hẹp khiến cột "Thời hạn" và "Giá thuê" phải ngắt dòng nhiều tầng trông lộn xộn.
- Thiếu tính năng tùy chọn ẩn/hiện cột (Column Visibility Toggle).

### 7.4 Biểu mẫu (Forms) & Trường nhập liệu (Inputs)
- Tất cả các trường ngày tháng (`startDate`, `endDate`, `dueDate`) dùng thẻ `<input type="date">` mặc định của trình duyệt. Giao diện date picker của Chrome/Edge trên Windows thô kệch, không đồng bộ với thiết kế hiện đại của hệ thống.
- Các trường nhập tiền tệ (`unitPrice`, `monthlyRent`, `deposit`) là input số thường, không tự động định dạng dấu chấm phân cách hàng nghìn khi đang gõ (ví dụ người dùng phải tự đếm số 0: `8000000` thay vì thấy `8.000.000`).

### 7.5 Empty States & Loading States
- Khi bảng không có dữ liệu, `DataTable` hiển thị icon `<Inbox>` màu xám với dòng chữ "Không có dữ liệu phù hợp". Không có nút hành động để người dùng reset bộ lọc hoặc bấm "Thêm bản ghi mới" ngay tại đó.
- Khi chuyển trang hoặc submit form, toàn bộ trang bị đứng nhẹ trong tích tắc do không có thanh tiến trình (Top Loading Bar / NProgress).

---

## 8. Animation & Motion Analysis (Phân tích Chuyển động)

### 8.1 Thư viện Animation hiện tại
- **Không cài đặt bất kỳ thư viện animation chuyên dụng nào** (không có `framer-motion`, không có `motion`, không có `@react-spring`).
- Hệ thống hoàn toàn phụ thuộc vào CSS Transitions cơ bản của Tailwind:
  - `transition-colors`: Đổi màu khi hover button/link.
  - `transition-all duration-200 ease-in-out`: Mở trượt Sidebar trên mobile.
  - `animate-pulse`: Hiệu ứng nhấp nháy xương (skeleton) khi tải bảng.
  - `animate-ping`: Hiệu ứng sóng radar trên chuông thông báo Topbar.
  - `animate-in fade-in-0 zoom-in-95`: Các class mở modal trong `dialog.tsx` (nhưng không mượt mà do thiếu exit animation khi đóng modal).

### 8.2 Đánh giá các vị trí CÓ và CẦN animation

| Vị trí | Trạng thái hiện tại | Đề xuất cải tiến Motion |
|---|---|---|
| **Mở / Đóng Modal (Dialog)** | Mở giật cục bằng CSS thô, khi đóng thì biến mất lập tức (`if (!open) return null;`). | Cần hiệu ứng Spring hoặc Ease-out Scale (Scale 0.95 -> 1.0 khi mở, Scale 1.0 -> 0.95 + Fade-out khi đóng). |
| **Chuyển Tab Login (BQL / Cư dân)** | Đổi class CSS background trực tiếp. | Cần hiệu ứng Sliding Pill Tab (viên thuốc trượt mượt mà theo tab đang chọn). |
| **Chuyển Trang (Page Transitions)** | Tải trang gián đoạn, giật khung hình. | Cần hiệu ứng Fade + Slight Y-offset (10px) nhẹ nhàng khi đổi route trong App Router. |
| **Chỉ số Dashboard KPI** | Hiển thị số tĩnh ngay lập tức. | Cần hiệu ứng Count-up (đếm số mượt từ 0 đến giá trị thực tế trong 0.8s) tạo cảm giác sống động. |
| **Dropdown / Popover thông báo** | Chưa có. | Cần hiệu ứng trượt nhẹ từ trên xuống (Translate-Y + Opacity) khi mở menu. |
| **Accordion / Expandable Row** | Chưa có (phải mở modal để xem chi tiết hóa đơn). | Cần hiệu ứng trượt mở rộng mượt mà khi xem chi tiết khoản phí ngay dưới dòng bảng. |

> [!CAUTION]
> **Nơi KHÔNG ĐƯỢC lạm dụng Animation**:
> - Bảng dữ liệu lớn (`DataTable`): Tuyệt đối không gắn stagger animation cho từng dòng bảng khi có hàng trăm bản ghi, sẽ gây lag CPU và cản trở việc quét mắt nhanh của quản lý.
> - Thao tác đóng mở Dialog xác nhận xóa: Animation phải dưới 150ms để không tạo cảm giác trì trệ khi xử lý công việc.

---

## 9. Responsive Problems (Phân tích Khả năng Thích ứng Đa Thiết bị)

### 9.1 Trên Thiết bị Di Động (Mobile: < 640px)
1. **Bảng Dữ liệu (DataTable)**:
   - Các bảng có từ 6-8 cột (Apartments, Residents, Contracts, Invoices) bị tràn màn hình ngang rất xa. Người dùng điện thoại phải dùng ngón tay vuốt ngang liên tục mới thấy nút "Sửa/Xóa" ở cột cuối cùng.
   - **Giải pháp cần thiết**: Trên mobile, chuyển đổi bảng sang dạng **Mobile Card View** (mỗi căn hộ/cư dân hiển thị dưới dạng 1 card xếp dọc nhỏ gọn).
2. **Khu vực Bộ lọc (Filter Bar)**:
   - Grid 3 hoặc 4 cột trên mobile chuyển thành 4 dòng xếp chồng chiếm hết nửa màn hình trước khi người dùng nhìn thấy dữ liệu bảng.
   - **Giải pháp**: Gói gọn vào nút "Bộ lọc" kèm badge số lượng tiêu chí đã chọn, bấm vào mở Bottom Sheet.
3. **Kích thước nút bấm (Touch Targets)**:
   - Các nút thao tác icon trong bảng có kích thước `h-8 w-8` (32x32px), nhỏ hơn tiêu chuẩn khuyến nghị tối thiểu của Apple Human Interface Guidelines (44x44px) và Google Material Design (48x48px), rất dễ bấm nhầm trên màn hình cảm ứng.

### 9.2 Trên Máy tính bảng (Tablet: 768px - 1024px)
- Ở breakpoint `md` và `lg`, lưới biểu đồ Dashboard (`grid-cols-1 lg:grid-cols-3`) bị co cụm khiến biểu đồ Recharts PieChart bị thu nhỏ, nhãn chú thích (Legend) bị che khuất một phần.

---

## 10. Accessibility Problems (Phân tích Khả năng Tiếp cận a11y)

1. **Focus Management trong Modal (`Dialog.tsx`)**:
   - Khi modal mở ra, tiêu điểm bàn phím (Focus) không được tự động chuyển vào bên trong modal.
   - Không có cơ chế **Focus Trap**: Người dùng khiếm thị hoặc người dùng điều khiển bằng phím Tab có thể tab ra ngoài vùng mờ của trang web nền.
   - Phím **Escape (Esc)** không tự động đóng modal.
2. **Độ tương phản màu sắc (Color Contrast - WCAG 2.1 AA)**:
   - Các dòng chữ phụ màu `text-slate-400` trên nền trắng `bg-white` (như ngày giờ, placeholder) có độ tương phản ~ 2.8:1, không đạt chuẩn tối thiểu 4.5:1 của WCAG AA đối với văn bản cỡ nhỏ.
   - Badge trạng thái `outline` (`border-slate-300 text-slate-950`) khó phân biệt với văn bản thông thường.
3. **Thiếu nhãn hỗ trợ đọc màn hình (Screen Readers)**:
   - Các nút chỉ chứa icon (như nút menu hamburger trên Topbar, nút xóa trong bảng, nút chuông thông báo) thiếu thuộc tính `aria-label` tương ứng (ví dụ: `aria-label="Mở danh mục điều hướng"`, `aria-label="Xóa căn hộ"`).
4. **Cấu trúc HTML Semantics**:
   - Các thẻ form trong dialog và login dùng thẻ `<label>` nhưng thiếu thuộc tính `htmlFor` liên kết với `id` của `<input>`, khiến việc click vào nhãn không tự động focus vào ô nhập liệu.

---

## 11. Code Quality & Maintainability Issues (Chất lượng Mã nguồn)

### 11.1 Component Quá Lớn (Monolithic Screen Components)
Các file màn hình quản lý đang ôm đồm quá nhiều trách nhiệm:
- `src/app/(management)/contracts/page.tsx`: **477 dòng code** (chứa state filter, query, 3 mutations, table columns, render helper, create/edit form modal, delete confirm modal).
- `src/app/(management)/residents/page.tsx`: **435 dòng code**.
- `src/app/(management)/apartments/page.tsx`: **398 dòng code**.
- `src/app/(management)/invoices/page.tsx`: **368 dòng code**.
- **Khó khăn khi Redesign**: Khi muốn thay đổi UI của modal hoặc bảng, lập trình viên rất dễ làm hỏng logic mutation bên cạnh vì tất cả dồn chung trong một file duy nhất. Cần tách các Form Modal thành component riêng biệt (ví dụ: `ApartmentFormDialog.tsx`, `ApartmentFilterToolbar.tsx`).

### 11.2 Trộn lẫn Logic Nghiệp vụ vào Giao diện (Business Logic Leaked into UI)
- Trong `invoices/page.tsx`: Logic tính toán tổng tiền, đã thu, còn phải thu (`reduce(...)`) được tính trực tiếp trong component render:
  ```typescript
  const totalAmount = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  const paidAmount = invoices.filter((inv: any) => inv.status === 'PAID').reduce(...);
  ```
- Trong `contracts/page.tsx`: Logic tính toán cảnh báo ngày hết hạn `< 30 ngày` (`isExpiringSoon`) nằm trong file UI thay vì nằm trong domain model helper hoặc service.

### 11.3 Giao diện Chưa Tận dụng Thư viện Đã Cài Đặt (Dead Dependencies)
- `react-hook-form` & `@hookform/resolvers`: Đã cài nhưng không dùng, làm lãng phí bundle size và khiến form viết bằng `useState` rườm rà.
- `zustand`: Đã cài nhưng không dùng để lưu global UI state (như trạng thái đóng/mở sidebar, theme dark/light, bộ lọc đang lưu).

### 11.4 Trùng lặp Code (Duplication)
- Cấu trúc Filter Toolbar (Card trắng, 3-4 select box, ô thống kê tổng số bản ghi) được viết lặp lại gần như y hệt ở 5 trang quản lý (`apartments`, `residents`, `contracts`, `invoices`, `feedbacks`).
- Hàm helper render badge trạng thái (`renderStatusBadge`) được viết lặp lại ở từng trang với cấu trúc `switch-case` tương tự nhau.

---

## 12. Recommended Improvement Roadmap (Lộ trình Cải tiến Đề xuất)

Để nâng tầm giao diện từ mức "chức năng cơ bản" lên mức **Đẳng cấp, Sang trọng, Trực quan và Trải nghiệm mượt mà (WOW Effect)** mà hoàn toàn không ảnh hưởng đến database hay business logic, lộ trình cải tiến được chia thành 4 giai đoạn logic:

### 🌟 Giai đoạn 1: Chuẩn hóa Design System & Nâng cấp Thẩm mỹ Cốt lõi (Foundation)
1. **Thiết lập Typography Hiện đại**: Tích hợp Google Font **Plus Jakarta Sans** hoặc **Inter** qua `next/font/google` để mang lại độ sắc nét và hiện đại.
2. **Hoàn thiện Theme Tokens (Tailwind v4)**: Ánh xạ biến CSS HSL vào hệ thống màu của Tailwind (Tailwind palette mở rộng: Primary Blue Sapphire `#1e40af`, Accent Teal `#0d9488`, Dark Slate `#0f172a`, Muted Ice `#f8fafc`).
3. **Cải tiến Base UI Components**:
   - Bổ sung hiệu ứng Glassmorphism, viền tinh tế (`border-slate-200/80`), đổ bóng đa tầng (Layered Shadows).
   - Nâng cấp `Button` với loading spinner SVG tích hợp sẵn và micro-hover elevation.
   - Nâng cấp `Dialog` có Focus Trap, tự động khóa scroll body và hiệu ứng Spring scale.
   - Bổ sung `SearchableSelect` (Combobox) để giải quyết triệt để vấn đề chọn căn hộ/cư dân trong danh sách dài.

### 🚀 Giai đoạn 2: Tái cấu trúc & Nâng tầm Trải nghiệm Khung (Shell & Layouts)
1. **Sidebar Đẳng cấp**:
   - Hỗ trợ chế độ Thu gọn (Mini-Sidebar) dạng Icon-only giúp mở rộng không gian làm việc cho màn hình nhỏ.
   - Bổ sung Live Badge hiển thị số lượng phản ánh mới và hóa đơn quá hạn.
2. **Topbar Thông minh**:
   - Thêm **Notification Dropdown Popover** khi bấm vào chuông: Xem nhanh 5 tin tức mới, đánh dấu đã đọc trực tiếp mà không cần rời trang.
   - Thêm **User Profile Dropdown Menu**: Hiển thị avatar thực tế, thông tin tài khoản, phím tắt cài đặt và nút đăng xuất.
   - Bổ sung **Command Palette (Ctrl + K / Cmd + K)**: Tìm kiếm tức thì căn hộ, cư dân, hóa đơn từ bất kỳ đâu.

### 🎨 Giai đoạn 3: Redesign Toàn diện Các Màn hình Trọng điểm (Screens Transformation)
1. **Dashboard Quản lý**:
   - Thiết kế lại StatCards với biểu đồ sparkline nhỏ, số liệu count-up animation.
   - Thêm khu vực "Hành động Khẩn cấp" (Action Center) cảnh báo hợp đồng sắp hết hạn và sự cố kỹ thuật chưa xử lý.
2. **Màn hình Căn hộ & Cư dân**:
   - Bổ sung chế độ xem dạng **Grid View (Thẻ phòng theo tầng)** bên cạnh chế độ Bảng, giúp BQL nhìn trực quan như sơ đồ tòa nhà thực tế.
3. **Màn hình Hóa đơn & Cổng thanh toán**:
   - Bổ sung nút gạch nợ trực tiếp cho nhân viên BQL.
   - Cải tiến giao diện hóa đơn cư dân sang dạng thẻ vé hiện đại (Invoice Receipt Slip), mã QR to rõ ràng kèm đồng hồ đếm ngược giao dịch giả lập.
4. **Màn hình Phản ánh & Sự cố**:
   - Thiết kế luồng phản ánh theo dạng Timeline tiến độ xử lý (Tiếp nhận ➔ Đang sửa ➔ Hoàn thành ➔ Đánh giá sao).

### 📱 Giai đoạn 4: Tối ưu Mobile UX, Animation & Accessibility (Polish)
1. **Mobile Card Transformation**: Tự động chuyển đổi các bảng nhiều cột sang thẻ mobile nhỏ gọn trên màn hình < 640px.
2. **Refactor Code & Tách Component**: Phân rã các file page lớn (> 300 dòng) thành các sub-components độc lập (`FormDialog`, `FilterBar`, `StatsHeader`).
3. **Khai thác Thư viện Đã Cài**: Đưa `react-hook-form` + `zod` vào kiểm soát biểu mẫu để có thông báo lỗi trường trực quan; sử dụng `zustand` quản lý layout preferences.
4. **Đạt Chuẩn WCAG 2.1 AA**: Tăng độ tương phản màu, bổ sung `aria-label` cho toàn bộ icon buttons, hoàn thiện điều hướng bằng bàn phím.

---

## 13. Nhật ký Cải tiến Visual Foundation (Changelog Giai đoạn 1)

*Ngày thực hiện: 04/09/2026*

### 13.1 Typography & Font
- Đã tích hợp font chữ Google **Plus Jakarta Sans** (`next/font/google`) với đầy đủ bộ ký tự `vietnamese` và `latin` tại `src/app/layout.tsx`.
- Thiết lập biến CSS `--font-sans` áp dụng toàn diện trên `body`, mang lại nét chữ sắc sảo, hiện đại, dễ đọc trên cả desktop và mobile.
- Chuẩn hóa phân cấp kiểu chữ (Type Scale): Display, H1 (24px bold), H2 (18px semibold), H3 (16px semibold), Body (14px/12px), Caption (11px).

### 13.2 Color System & Contrast
- Chuẩn hóa các semantic color tokens trong `src/app/globals.css`:
  - **Primary**: Blue `#2563eb` (Deep Sapphire), hover `#1d4ed8`, active `#1e40af`, surface `#eff6ff`.
  - **Status Colors**: Đạt chuẩn tương phản WCAG 2.1 AA (> 4.5:1) với Emerald (Success), Amber (Warning), Red (Destructive), Sky (Info).
  - **Neutrals**: Tách bạch rõ giữa Text Primary (`slate-900`), Secondary (`slate-700`), Muted (`slate-500`), Subtle (`slate-400`).
  - **Focus Ring Utility**: Thêm utility `.focus-ring` với glow 2 lớp mịn màng `0 0 0 3px rgba(37, 99, 235, 0.15)`.

### 13.3 Chuẩn hóa & Bổ sung Hệ thống Components
1. **Button (`components/ui/button.tsx`)**:
   - Thêm prop `isLoading` tích hợp sẵn spinner SVG, chặn click khi đang tải.
   - Thêm variant `soft` (nền xanh dịu) và kích thước `xs`, `sm`, `default`, `lg`, `icon`, `icon-sm`.
   - Bổ sung hiệu ứng active click `active:scale-[0.98]`.
2. **Input (`components/ui/input.tsx`)**:
   - Thêm hỗ trợ `leftIcon`, `rightIcon`, và trạng thái lỗi `error?: boolean | string` hiển thị viền đỏ và text lỗi inline.
   - Focus ring 2 lớp mượt mà.
3. **Select (`components/ui/select.tsx`)**:
   - Thêm icon `ChevronDown` tùy biến chuẩn SaaS, hỗ trợ `error` state.
4. **Card (`components/ui/card.tsx`)**:
   - Tinh chỉnh padding `p-5 sm:p-6`, viền `border-slate-200/80`, đổ bóng `shadow-xs` nhẹ nhàng, có phân tách footer.
5. **Badge (`components/ui/badge.tsx`)**:
   - Kiểu dáng `rounded-full` pill sang trọng.
   - Hỗ trợ prop `dot?: boolean` hiển thị status dot tròn bên cạnh nhãn.
6. **Dialog / Modal (`components/ui/dialog.tsx`)**:
   - Hỗ trợ phím **Escape** tự động đóng.
   - Tự động khóa cuộn trang (`document.body.style.overflow = 'hidden'`) chống cuộn nền.
   - Thêm nút đóng `X` ở góc trên bên phải, backdrop blur và animation scale mượt mà.
7. **Table (`components/ui/table.tsx`)**:
   - Header bảng chữ hoa gọn gàng (`uppercase tracking-wider text-xs`), phân cách viền `divide-slate-100`.
8. **Checkbox (`components/ui/checkbox.tsx`)** [MỚI]:
   - Checkbox component chuẩn với checkmark icon trắng trên nền xanh, hỗ trợ `label` và `description`.
9. **Radio (`components/ui/radio.tsx`)** [MỚI]:
   - Radio button component chuẩn styling với chấm tròn bên trong, hỗ trợ `label` và `description`.
10. **Switch (`components/ui/switch.tsx`)** [MỚI]:
    - Toggle switch gạt mượt mà cho các cài đặt bật/tắt.
11. **Avatar (`components/ui/avatar.tsx`)** [MỚI]:
    - Avatar hỗ trợ ảnh đại diện, tự động sinh initials chữ cái đầu nếu không có ảnh, hỗ trợ chấm online/offline/busy.
12. **Tooltip (`components/ui/tooltip.tsx`)** [MỚI]:
    - Tooltip nhẹ cho các icon và hành động, hỗ trợ 4 hướng `top`, `bottom`, `left`, `right`.
13. **Dropdown Menu (`components/ui/dropdown.tsx`)** [MỚI]:
    - Dropdown menu hoàn chỉnh với Trigger, Content, Item, Divider, Header, bắt click outside và Escape.
14. **Tabs (`components/ui/tabs.tsx`)** [MỚI]:
    - Tab navigation component hỗ trợ cả 2 phong cách `pills` và `underline`, hỗ trợ badge count.
15. **Pagination (`components/ui/pagination.tsx`)** [MỚI]:
    - Phân trang chuẩn với bộ đếm số lượng bản ghi hiển thị / tổng số bản ghi và nút Trước/Sau.
16. **Skeleton (`components/ui/skeleton.tsx`)** [MỚI]:
    - Standalone shimmer/pulse skeleton loader cho các trạng thái chờ tải.
17. **EmptyState (`components/ui/empty-state.tsx`)** [MỚI]:
    - Giao diện trống chuyên nghiệp: icon minh họa, tiêu đề, mô tả và nút CTA hành động.
18. **Alert (`components/ui/alert.tsx`)** [MỚI]:
    - Thẻ thông báo trạng thái với 4 variant: `info`, `success`, `warning`, `destructive`.

### 13.4 Nâng cấp Shared & Layout Components
1. **DataTable (`components/shared/DataTable.tsx`)**:
   - Tích hợp trực tiếp `Pagination`, `EmptyState`, và `Skeleton`.
   - Bổ sung nút `X` xóa nhanh từ khóa tìm kiếm khi đang gõ.
2. **PageHeader (`components/shared/PageHeader.tsx`)**:
   - Nâng cấp typography, hỗ trợ prop `badge` hiển thị nhãn trạng thái cạnh tiêu đề trang.
3. **StatCard (`components/shared/StatCard.tsx`)**:
   - Bổ sung icon `TrendingUp` / `TrendingDown` cho chỉ số tăng trưởng, viền bóng đa tầng.
4. **ConfirmDialog (`components/shared/ConfirmDialog.tsx`)**:
   - Đồng bộ hóa với DialogHeader mới, icon cảnh báo phân biệt theo variant (`destructive` vs `default`), tích hợp `isLoading`.
5. **Topbar (`components/layout/Topbar.tsx`)**:
   - Tích hợp `Avatar` online, `Dropdown` menu thông tin tài khoản và đăng xuất, `Tooltip` trên chuông thông báo.
6. **Sidebar (`components/layout/Sidebar.tsx`)**:
   - Bổ sung thanh active indicator bar màu xanh ở mép trái menu đang chọn, badge vai trò ở chân trang.

---

*Toàn bộ 25 route tĩnh và động của hệ thống đã được kiểm tra bằng `next build` và biên dịch thành công 100% không có lỗi.*

---

## 14. Nhật ký Tái thiết kế Application Shell & UX Navigation (Changelog Giai đoạn 2)

*Ngày thực hiện: 04/09/2026*

### 14.1 Nhóm Menu Theo Nghiệp vụ Cốt lõi (Grouped Sidebar)
- **Phân hệ Ban Quản Lý**:
  1. **Tổng quan**: *Bảng điều khiển* (`/dashboard`)
  2. **Căn hộ & Cư dân**: *Quản lý Căn hộ* (`/apartments`), *Hồ sơ Cư dân* (`/residents`), *Quản lý Hợp đồng* (`/contracts`)
  3. **Tài chính & Dịch vụ**: *Quản lý Hóa đơn* (`/invoices`), *Danh mục Phí* (`/fees`)
  4. **Vận hành & Hỗ trợ**: *Phản ánh & Sự cố* (`/feedbacks`), *Thông báo* (`/notifications`)
- **Phân hệ Cư Dân**:
  1. **Tổng quan**: *Trang chủ Cư dân* (`/home`)
  2. **Tài chính Căn hộ**: *Hóa đơn của tôi* (`/resident/invoices`)
  3. **Dịch vụ & Hỗ trợ**: *Báo sự cố & Đánh giá* (`/resident/feedback`), *Thông báo Ban Quản Lý* (`/resident/notifications`)

### 14.2 Desktop Collapsible Sidebar (w-64 ⟷ w-[72px])
- Hỗ trợ thu gọn Sidebar sang chế độ Icon-only trên Desktop với hiệu ứng chuyển đổi mượt mà (`transition-all duration-200 ease-in-out`).
- Khi thu gọn, hiển thị `Tooltip` nhãn menu tức thì khi hover vào icon.
- Tự động lưu trạng thái thu gọn vào `localStorage` (`smart_apt_sidebar_collapsed`) để duy trì lựa chọn của người dùng khi duyệt qua các trang.

### 14.3 Header Đa Năng (Smart Topbar)
1. **Dynamic Breadcrumb (`components/layout/Breadcrumb.tsx`)**: Tự động nhận diện đường dẫn hiện tại và hiển thị cây điều hướng có liên kết về trang chủ và nhóm nghiệp vụ cha.
2. **Command Palette Tìm Kiếm Nhanh (`components/layout/CommandSearchDialog.tsx`)**: Hỗ trợ phím tắt toàn cục **Ctrl + K / Cmd + K** hoặc bấm nút "Tìm chức năng..." trên Header để tìm kiếm tức thì và nhảy nhanh tới bất kỳ trang nào bằng phím mũi tên và Enter.
3. **Live Notification Popover (`components/layout/NotificationDropdown.tsx`)**: Chuông thông báo hiển thị danh sách 4 tin tức mới nhất của tòa nhà, cho phép xem trước nội dung, chuyển thẳng tới trang chi tiết hoặc đánh dấu đã đọc.
4. **User Profile Dropdown**: Xem họ tên, email, vai trò (role badge), chuyển đổi nhanh giữa các cổng thông tin và nút Đăng xuất an toàn.

### 14.4 Tối ưu Trải nghiệm Di động (Mobile First UX)
1. **Mobile Off-canvas Drawer**: Thanh điều hướng trượt từ cạnh trái với lớp phủ mờ `backdrop-blur-xs`, nút đóng `X` to rõ ràng.
2. **Mobile Bottom Navigation (`components/layout/MobileBottomNav.tsx`)**: Thanh điều hướng ngón tay cái cố định ở chân màn hình điện thoại (< 768px), bao gồm 4 chức năng cốt lõi nhất + nút mở toàn bộ menu.
3. **Chuẩn Touch Target 44px**: Toàn bộ liên kết và nút bấm trên mobile được đảm bảo kích thước chạm tối thiểu `min-h-[44px]` theo tiêu chuẩn Apple HIG và Google Material Design.

---

*Hệ thống đã chạy kiểm tra bằng `next build` và biên dịch thành công 100% tất cả 28 route tĩnh và động với 0 lỗi.*

---

## 15. Nhật ký Thiết kế lại Smart Apartment Dashboard (Changelog Giai đoạn 3: Dashboard Redesign)

*Ngày thực hiện: 04/09/2026*

### 15.1 Cổng Cư Dân Thông Minh (Smart Resident Portal - `/home`)

1. **Smart Welcome & Apartment Status Hero**:
   - Lời chào thời gian thực theo buổi: *"Chào buổi sáng / chiều / tối, [Họ tên] 👋"*.
   - Huy hiệu nhận diện căn hộ to rõ ràng: `A-1001 • Tòa A (Tầng 10)`.
   - Huy hiệu trạng thái hợp đồng & cư trú: `Đang cư trú hợp lệ` (xanh ngọc).
   - Nút hành động nhanh: *"Thanh toán ngay"* đưa thẳng tới cổng hóa đơn.

2. **4 Thẻ Chỉ số Tóm tắt (KPI Summary Cards với Count-up Animation)**:
   - **Thanh toán tháng này**: Số tiền công nợ chưa thanh toán, ngày hạn chót, badge `Chưa thanh toán` hoặc `Đã hoàn tất`.
   - **Điện sinh hoạt**: Sản lượng kWh đã tiêu thụ, chi phí tương ứng.
   - **Nước sinh hoạt**: Khối lượng m³ đã tiêu thụ, chi phí tương ứng.
   - **Yêu cầu hỗ trợ kỹ thuật**: Số lượng sự cố đang được ban quản lý xử lý.
   - Toàn bộ số liệu tích hợp component `AnimatedNumber` đếm số mượt mà từ 0 đến giá trị thực trong 600ms, tự động tôn trọng thiết lập `prefers-reduced-motion`.

3. **Khu vực Thao tác Nhanh (Quick Actions)**:
   - *Tra cứu & Đóng phí*: Tra cứu hóa đơn chi tiết và lịch sử nộp tiền.
   - *Báo hỏng & Sự cố*: Tạo phiếu hỗ trợ kỹ thuật kèm ảnh minh họa.
   - *Bảng tin Ban Quản Lý*: Cập nhật thông báo cắt điện/nước, bảo trì thang máy.

4. **Biểu đồ & Phân tích Chi phí (Expense History Analytics)**:
   - Biểu đồ cột **Recharts BarChart** thể hiện biến động chi phí 6 tháng gần nhất với bo góc cột mềm mại và tooltip định dạng tiền tệ VNĐ.
   - Widget phân bổ chi phí tháng hiện tại (Phí quản lý vận hành, Phí gửi xe, Tiền điện, Tiền nước) kèm thanh tiến trình trực quan.

5. **Theo dõi Tiến độ Phản ánh & Bảng tin Tòa nhà**:
   - Thẻ danh sách phản ánh mới nhất kèm huy hiệu phân loại, mức độ khẩn và **phản hồi thực tế từ kỹ thuật BQL**.
   - Bảng tin thông báo chung cư mới nhất.
   - Tích hợp `EmptyState` khi chưa có dữ liệu.

---

### 15.2 Trung tâm Điều hành & Vận hành Ban Quản Lý (Smart Operations Dashboard - `/dashboard`)

1. **Bảng Giám sát Vận hành (Operational Hero Banner)**:
   - Huy hiệu đèn xanh nhấp nháy: `Hệ thống trực tuyến • Vận hành ổn định`.
   - Hiển thị ngày thứ và ngày dương lịch hiện tại của ca trực.
   - Lời chào cá nhân hóa cho quản lý tòa nhà: *"Chào buổi sáng, [Tên quản lý] 👋"*.
   - 3 Lối tắt nghiệp vụ hàng đầu: *Lập hóa đơn kỳ mới*, *Đăng thông báo cư dân*, *Tiếp nhận sự cố*.

2. **4 Thẻ Chỉ số Vận hành Cốt lõi (Key Performance Indicators)**:
   - **Tỷ lệ lấp đầy căn hộ**: Hiển thị `%` với số thập phân mượt mà, số căn đang ở trên tổng căn, thanh tiến trình tỷ lệ lấp đầy trực quan.
   - **Quy mô Cư dân**: Đếm số cư dân đang cư trú, số hợp đồng đang có hiệu lực và mật độ người/căn hộ.
   - **Tiến độ thu phí dịch vụ kỳ này**: Tỷ lệ thu đúng hạn, thanh tiến trình tiến độ thanh toán và nhãn chỉ tiêu tháng.
   - **Sự cố & Yêu cầu chờ xử lý**: Đếm số lượng sự cố đang tồn đọng; tự động đổi màu cảnh báo (Hổ phách/Đỏ) nếu có việc tồn đọng hoặc xanh khi an toàn.

3. **Trung tâm Xử lý Khẩn & Tồn đọng (Smart Action Center)**:
   - Tab điều hướng mượt mà gồm 3 khu vực nghiệp vụ ưu tiên:
     - **Tab Sự cố mới (`NEW`)**: Lấy dữ liệu thực từ `useFeedbacks({ status: 'NEW' })`, hiển thị mức độ ưu tiên (`Khẩn cấp`, `Ưu tiên cao`), căn hộ, người gửi, mô tả và nút *"Tiếp nhận & xử lý"*.
     - **Tab Hợp đồng sắp hết hạn (< 30 ngày)**: Lấy dữ liệu thực từ `useContracts({ expiringSoon: true })`, hiển thị mã HĐ, căn hộ, ngày kết thúc màu đỏ và nút *"Gia hạn hợp đồng"*.
     - **Tab Hóa đơn quá hạn (`OVERDUE`)**: Lấy dữ liệu thực từ `useInvoices({ status: 'OVERDUE' })`, hiển thị mã hóa đơn, căn hộ, số tiền nợ và nút *"Đôn đốc thanh toán"*.
     - Khi mỗi danh mục không có tồn đọng, tự động hiển thị `EmptyState` tích cực ("Không có phản ánh mới cần duyệt", "Hợp đồng đang ổn định", "Không có nợ quá hạn").

4. **Hệ thống Biểu đồ Vận hành & Phân tích Đa chiều (Charts & Analytics)**:
   - **Biểu đồ Cột Đôi (Doanh thu vs Thực thu 6 tháng)**: So sánh doanh thu dự kiến và số tiền thực tế đã quyết toán bằng `Recharts BarChart` với màu sắc nhận diện chuẩn SaaS (`#2563eb` và `#10b981`).
   - **Biểu đồ Tròn Phân bổ Căn hộ**: Phân chia tỷ lệ căn đang ở, căn trống, căn đang sửa chữa bằng `Recharts PieChart` dạng Donut.
   - **Biểu đồ Ngang Phân loại Sự cố**: Thống kê số lượt phản ánh theo từng nhóm kỹ thuật (Điện nước, An ninh, Vệ sinh, Thang máy...).

5. **Chỉ số Chất lượng Dịch vụ & Cam kết SLA**:
   - Thời gian giải quyết sự cố trung bình: **3.5 giờ** (Cam kết SLA < 4 giờ).
   - Chỉ số hài lòng của cư dân (CSAT): **4.8 / 5.0 ★**.
   - Tỷ lệ giải quyết sự cố ngay lần đầu: **94.2%**.
   - Lối tắt nhanh đến *Sơ đồ căn hộ* và *Sổ bộ cư dân*.

---

*Toàn bộ 28 route tĩnh và dynamic của hệ thống đã được kiểm tra bằng `next build` và biên dịch thành công 100% với 0 lỗi.*

---

## 16. Nhật ký Tích hợp Hệ thống Motion & Micro-interactions (Changelog Giai đoạn 4: Motion System)

*Ngày thực hiện: 04/09/2026*

### 16.1 Chuẩn Hóa Motion Design Tokens (`src/app/globals.css`)
- Khai báo các keyframes chuyên dụng:
  - `@keyframes dialog-enter` & `@keyframes dialog-exit`: Scale 0.96 ↔ 1.0 kết hợp Translate-Y 8px và Opacity theo đường cong `cubic-bezier(0.16, 1, 0.3, 1)`.
  - `@keyframes backdrop-enter` & `@keyframes backdrop-exit`: Fade mờ phông nền 200ms/160ms.
  - `@keyframes dropdown-enter` & `@keyframes dropdown-exit`: Mở bung nhẹ từ gốc neo (`origin-top-right`/`origin-top-left`), translate-y 4px trong 180ms/140ms.
  - `@keyframes error-shake`: Rung nhẹ 4px viền ô nhập liệu khi submit form bị lỗi trong 250ms.
  - `@keyframes shimmer`: Sóng ánh sáng quét qua thẻ skeleton loader mượt mà (chu kỳ 1.8s).
  - `@keyframes pulse-subtle`: Đèn tín hiệu trạng thái trực tuyến của hệ thống.
- **Quy tắc Trợ năng Toàn cục (`prefers-reduced-motion`)**:
  - Khi người dùng bật cài đặt giảm chuyển động trong hệ điều hành Windows/macOS/iOS, CSS tự động chuyển thời lượng animation và transition về `0.01ms !important`, tắt hoàn toàn các hiệu ứng gây chóng mặt hoặc giật lag.

### 16.2 Tinh Chỉnh Micro-interactions Trên Từng Component Cốt Lõi
1. **Button (`src/components/ui/button.tsx`)**:
   - Thêm hiệu ứng đàn hồi nhấp chuột `active:scale-[0.97]` trong 150ms.
   - Vô hiệu hóa hiệu ứng click khi bị disabled: `disabled:active:scale-100 disabled:shadow-none`.
   - Nâng cấp trạng thái `isLoading`: Tích hợp icon xoay tròn `Loader2` với transition mượt mà, chống xê dịch bố cục.
2. **Card (`src/components/ui/card.tsx`)**:
   - Bổ sung prop `interactive?: boolean`: Khi card có tương tác hoặc có sự kiện click, tự động kích hoạt hiệu ứng nâng thẻ `hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300` và nhấn nhẹ `active:translate-y-0 active:shadow-xs`.
   - Thẻ tĩnh thông thường giữ nguyên phẳng phiu, tuân thủ nguyên tắc tiết chế (*Restraint*).
3. **Modal Dialog (`src/components/ui/dialog.tsx`)**:
   - Bổ sung cơ chế **Exit Animation**: Khi bấm nút X, click backdrop ngoài hoặc bấm phím **Escape**, backdrop và hộp thoại sẽ co lại nhẹ nhàng trong 160ms trước khi unmount khỏi DOM, loại bỏ hoàn toàn hiện tượng biến mất đột ngột.
4. **Dropdown Menu (`src/components/ui/dropdown.tsx`)**:
   - Hỗ trợ cả **Enter & Exit Animation**: Khung menu bung nở mượt mà từ điểm neo và thu lại gọn gàng khi đóng.
   - Các item trong menu có hiệu ứng click nhẹ `active:scale-[0.98]` và đổi màu nền trong 150ms.
5. **Tabs (`src/components/ui/tabs.tsx`)**:
   - Variant `underline`: Thêm thanh chỉ báo màu xanh `h-0.5` ở cạnh dưới trượt mượt mà `animate-in fade-in-50 duration-200` theo tab được chọn.
   - Variant `pills`: Viên thuốc nền trắng chuyển đổi mượt mà giữa các tab kèm hiệu ứng click phản hồi `active:scale-[0.98]`.
6. **Input Form (`src/components/ui/input.tsx`)**:
   - Tích hợp hiệu ứng rung viền lỗi `animate-error-shake` khi `hasError` là true.
   - Dòng text thông báo lỗi xuất hiện với hiệu ứng trượt nhẹ từ trên xuống `animate-in fade-in-50 slide-in-from-top-1 duration-200`.
7. **Skeleton (`src/components/ui/skeleton.tsx`)**:
   - Nâng cấp từ nhấp nháy xám thô (`animate-pulse`) sang dải sóng sáng quét qua (`animate-shimmer`), tạo cảm giác ứng dụng cao cấp chuẩn SaaS.
8. **Table (`src/components/ui/table.tsx` & `DataTable.tsx`)**:
   - Từng dòng dữ liệu phản hồi rê chuột mượt mà `transition-colors duration-150 hover:bg-slate-50/80`.
   - Bảng trống (`EmptyState`) xuất hiện với hiệu ứng dịu mắt `animate-in fade-in-50 duration-200`.
   - Các dòng skeleton chờ tải được thay thế bằng các thẻ `Skeleton` chuẩn có sóng sáng.
9. **Sidebar & Layouts (`Sidebar.tsx`, `layout.tsx`)**:
   - Thu gọn/mở rộng thanh bên mượt mà `w-64` ↔ `w-[72px]` trong 300ms.
   - Menu link active có vạch xanh mép trái trượt vào sống động.
   - Icon điều hướng có micro-scale `group-hover:scale-105 transition-all duration-150`.
   - Nội dung trang con trong layout xuất hiện mượt mà với `animate-in fade-in-50 duration-200`.

### 16.3 Thay Thế Chuỗi "Loading..." Bằng Trạng Thái Chuyên Nghiệp
- **Trang Đăng Nhập ([`/login`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/app/%28auth%29/login/page.tsx))**:
  - Thay thế chuỗi text đơn giản `"Đang tải..."` trong React Suspense bằng bộ khung form Skeleton đa tầng gồm các ô nhập và nút bấm giả lập chuẩn kích thước, chống xê dịch khung hình (CLS = 0).
  - Nút đăng nhập chuyển sang spinner loading `isLoading={isLoading}` với phím nhấn khóa an toàn.
- **Trang Cư Dân ([`/resident/notifications`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/app/%28resident%29/resident/notifications/page.tsx), [`/resident/invoices`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/app/%28resident%29/resident/invoices/page.tsx), [`/resident/feedback`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/app/%28resident%29/resident/feedback/page.tsx))**:
  - Thay thế các khối hộp xám thô sơ bằng danh sách Card Skeleton chi tiết có tiêu đề, badge và ngày tháng.
  - Tích hợp component `EmptyState` chuyên nghiệp cho cả 3 trang.

---

## 17. Cải Thiện Toàn Diện UX Của Toàn Bộ Các Màn Hình CRUD

Đã triển khai hoàn tất đợt nâng cấp trải nghiệm người dùng (UX) chuyên sâu cho toàn bộ các màn hình CRUD hiện hữu của hệ thống:
1. **Quản lý Căn hộ (`/apartments`)**
2. **Quản lý Cư dân (`/residents`)**
3. **Quản lý Hợp đồng (`/contracts`)**
4. **Quản lý Hóa đơn & Phí dịch vụ (`/invoices`)**
5. **Danh mục Phí dịch vụ (`/fees`)**
6. **Tiếp nhận & Xử lý Phản ánh (`/feedbacks`)**
7. **Quản lý Thông báo Ban Quản Lý (`/notifications`)**
8. **Màn hình Cư dân gửi Phản ánh & Đánh giá (`/resident/feedback`)**
9. **Màn hình Cư dân tra cứu Hóa đơn & Thanh toán (`/resident/invoices`)**
10. **Màn hình Cư dân xem Thông báo (`/resident/notifications`)**

### 17.1 Bảng Dữ Liệu (`DataTable.tsx`) Hiện Đại & Đáng Tin Cậy
- **Error State với Cơ chế Retry**: Khi server phản hồi lỗi hoặc rớt mạng, Table hiển thị hàng thông báo lỗi trực quan với icon cảnh báo `AlertTriangle`, thông điệp rõ ràng và nút bấm **"Thử lại"** (`onRetry`) giúp gọi lại API mà không cần F5 trình duyệt.
- **Empty State Thông Minh**: Tự động hiển thị nút xóa bộ lọc nếu đang tìm kiếm hoặc tùy biến hành động `emptyActionLabel`/`onEmptyAction`.
- **Loading Skeleton**: Shimmer animation mịn màng mô phỏng chính xác cấu trúc cột và số lượng dòng.
- **Mobile Responsive Layout**: Thùng chứa bảng có viền cong bo tròn `rounded-xl`, hỗ trợ cuộn ngang mượt mà, chữ không bị vỡ layout (`whitespace-nowrap`).

### 17.2 Trải Nghiệm Tìm Kiếm & Lọc Dữ Liệu (Search & Filter UX)
- **Nút "Đặt lại bộ lọc" (Reset Filters)**: Hiển thị ngay trên thanh trạng thái đếm bản ghi bất cứ khi nào người dùng kích hoạt tìm kiếm hoặc áp dụng bất kỳ bộ lọc nào (Tòa nhà, Trạng thái, Loại hợp đồng, Danh mục...). Người dùng có thể đưa bảng về trạng thái mặc định chỉ với 1 click.
- **Nút xóa nhanh từ khóa (Clear Search)**: Icon `X` trực quan ngay trong ô Input cho phép xóa tức thì từ khóa tìm kiếm.

### 17.3 An Toàn Thao Tác Xóa (Delete Safeguards)
- **Hộp thoại Xác nhận (`ConfirmDialog`)**: 100% thao tác xóa căn hộ, cư dân, hợp đồng, hóa đơn, thông báo đều yêu cầu người dùng xác nhận rõ ràng trước khi thực hiện.
- **Chống Submit Trùng Lặp**: Nút xác nhận xóa tự động hiển thị spinner loading (`isLoading={isPending}`) và khóa sự kiện click để ngăn người dùng gửi nhiều yêu cầu liên tiếp.

### 17.4 Biểu Mẫu (Form UX) Tiêu Chuẩn Cao
- **Required Indicator Rõ Ràng**: Tất cả các trường thông tin bắt buộc đều có dấu hoa thị màu đỏ nổi bật `<span className="text-red-500">*</span>` (Mã căn hộ, Họ tên, CCCD, SĐT, Căn hộ gán, Mã hợp đồng, Ngày bắt đầu/kết thúc, v.v.).
- **Nút Lưu Có Loading State & Khóa Double-Submit**: Tất cả nút "Thêm mới", "Cập nhật", "Phát hành hóa đơn", "Gửi phản hồi" đều hiển thị trạng thái `isLoading` kèm nhãn động ("Đang lưu...", "Đang tự động tạo...") và tự động disable nút khi mutation đang diễn ra.
- **Loại bỏ Hoàn Toàn `alert()`**: Toàn bộ thông báo thành công hoặc lỗi đều sử dụng hệ thống `sonner` Toast UI hiện đại.

---

## 18. Audit & Cải Thiện Toàn Diện Responsive + Accessibility (A11y)

Đã hoàn thành đợt kiểm toán (audit) và nâng cấp sâu về khả năng tương thích đa thiết bị (Responsive) và khả năng tiếp cận (Accessibility - A11y) trên toàn bộ website:

### 18.1 Kiểm Soát Breakpoints & Tương Thích Thiết Bị
- **Kiểm tra đa kích thước màn hình**:
  - **Mobile Siêu Nhỏ (320px - iPhone SE cũ)**: Khung Modal có padding co gọn `p-3`, giới hạn chiều cao `max-h-[92vh]` kèm thanh cuộn trong, tránh việc nội dung form dài đè tràn ra ngoài màn hình.
  - **Mobile Phổ Biến (375px, 390px, 430px)**: Grid 1 cột cho các thẻ tóm tắt, thanh cuộn bảng ngang với `role="region"` và `tabIndex={0}`, nút bấm có vùng chạm chuẩn.
  - **Tablet (768px - iPad)**: Tự động phân chia 2 cột cho các thẻ chỉ số (KPI Cards), bảng chuyển đổi sang bố cục rộng hơn.
  - **Desktop (1024px, 1280px, 1440px+)**: Sidebar hỗ trợ chế độ thu gọn (`w-[72px]`) hoặc mở rộng (`w-64`), Grid 3-4 cột cho Dashboard và biểu đồ phân tích.

### 18.2 Chuẩn Vùng Chạm Di Động (Touch Targets >= 44x44px)
- **Nút Menu & Notification**: Các nút Toggle Menu di động, nút đóng Modal, nút chuông thông báo được đảm bảo kích thước chạm tối thiểu `min-h-[44px] min-w-[44px]`.
- **Thanh Điều Hướng Đáy (Mobile Bottom Nav)**: Mỗi nút điều hướng chính có vùng bấm `min-h-[48px] min-w-[56px]`, dễ thao tác bằng ngón tay cái mà không bấm nhầm.
- **Thanh Phân Trang (Pagination)**: Các nút "Trước", "Sau" được tăng kích thước lên `min-h-[40px]` trên mobile với khoảng đệm thoải mái.
- **Nút Thao Tác Bảng (Table Action Buttons)**: Nút Chỉnh sửa / Xóa được chuẩn hóa `h-9 w-9` kèm khoảng cách rõ ràng giữa 2 nút.

### 18.3 Tiêu Chuẩn Tiếp Cận (Accessibility - WCAG 2.1 AA)
- **Semantic HTML & ARIA Attributes**:
  - `Table`: Bao bọc trong container có `role="region"` và `aria-label="Bảng dữ liệu có thể cuộn"`.
  - `Dropdown`: Trigger có `role="button"`, `aria-haspopup="true"`, `aria-expanded={open}`. Menu có `role="menu"`, từng mục có `role="menuitem"`.
  - `Tabs`: Container có `role="tablist"`, các tab có `role="tab"` và `aria-selected={isActive}`.
  - `Dialog`: Khung thoại có `role="dialog"`, `aria-modal="true"`. Nút đóng có `aria-label="Đóng hộp thoại"`.
  - `Input & Select`: Có thuộc tính `aria-invalid={hasError}` và liên kết nhãn rõ ràng.
- **Điều Hướng Bằng Bàn Phím (Keyboard Navigation)**:
  - Tất cả menu Dropdown hỗ trợ phím **Escape** để đóng, phím **Enter** và **Space** để kích hoạt trigger.
  - Hộp thoại Modal hỗ trợ đóng ngay bằng phím **Escape**.
  - Các ô Tab hỗ trợ chọn bằng bàn phím với hiệu ứng vòng sáng viền xanh `focus-visible:ring-2 focus-visible:ring-blue-600/30`.
- **Focus Replacement Không Mất Dấu**:
  - Loại bỏ hoàn toàn việc ẩn outline không kiểm soát; thay thế bằng lớp viền mềm `focus-visible:ring-2 focus-visible:ring-blue-600/30` trên tất cả Input, Select, Button, Tab và Table container.
- **Không Dùng Màu Sắc Là Tín Hiệu Duy Nhất**:
  - Tất cả huy hiệu trạng thái (Status Badges) đều có **Text tiếng Việt rõ nghĩa** + **Icon đồ họa trực quan** + màu nền (Ví dụ: `Badge` có icon check/warning, `StatCard` có icon hướng mũi tên `TrendingUp`/`TrendingDown` kèm dấu `+`/`-`).
- **Hỗ Trợ `prefers-reduced-motion`**:
  - Khối truy vấn media `@media (prefers-reduced-motion: reduce)` trong `src/app/globals.css` tự động tắt hoặc giảm thời lượng animation về 0.01ms đối với người dùng nhạy cảm với chuyển động thị giác.

---

*Hệ thống đã được kiểm tra bằng lệnh `npm run build` và biên dịch thành công 100% tất cả 28 route tĩnh và dynamic với 0 lỗi.*


