# Smart Apartment Management System (Hệ thống Quản lý Chung cư Thông minh)

Hệ thống web quản lý chung cư thông minh full-stack toàn diện dành cho **Ban quản lý (BQL)** và **Cư dân**, được phát triển dựa trên kiến trúc **API-first** với Next.js App Router, PostgreSQL, Prisma ORM, NextAuth.js, TanStack React Query, Zod và shadcn/ui.

---

## 🚀 Công nghệ Sử dụng (Tech Stack)

- **Frontend & Backend**: Next.js (App Router, TypeScript)
- **Kiến trúc Backend**: Route Handlers (`app/api/**/route.ts`) - REST API nội bộ
- **Database & ORM**: PostgreSQL + Prisma ORM (`prisma/schema.prisma`)
- **Xác thực & Phân quyền (Auth & RBAC)**: NextAuth.js (Credentials Provider, JWT Session, bcrypt)
- **Validation**: Zod (dùng chung schema client-side form & server-side Route Handler)
- **Data Fetching & State**: TanStack Query (React Query)
- **Giao diện & Style**: shadcn/ui (Radix UI) + TailwindCSS + Lucide Icons
- **Biểu đồ & Analytics**: Recharts
- **Xuất báo cáo PDF**: jsPDF
- **Môi trường & Docker**: Docker Compose (Next.js app + PostgreSQL container)

---

## 🏛️ Kiến trúc Hệ thống (API-First Architecture)

Mọi luồng dữ liệu đều đi qua 5 lớp tách biệt theo chuẩn REST API:

```
Component (React UI)
  └─► Hooks (TanStack React Query - src/hooks/use-*.ts)
        └─► Client Services (HTTP Fetch - src/services/*.service.ts)
              └─► API Route Handlers (src/app/api/**/route.ts)
                    └─► Server Service (Nghiệp vụ - src/modules/*/*.service.ts)
                          └─► Server Repository (Prisma - src/modules/*/*.repository.ts)
```

---

## 🔑 Tài khoản Dùng thử (Demo Accounts)

Hệ thống được tích hợp sẵn bộ dữ liệu mẫu trong `prisma/seed.ts` và nút tự động điền tài khoản trên màn hình Đăng nhập:

| Phân hệ | Email | Mật khẩu | Quyền chính |
|---|---|---|---|
| **Ban Quản Lý (Admin)** | `admin@building.com` | `admin123` | Toàn quyền quản trị tòa nhà, BQL, cư dân, hợp đồng, phí, phản ánh |
| **Ban Quản Lý (Manager)** | `manager@building.com` | `manager123` | Quản lý vận hành hàng ngày, gạch nợ hóa đơn, xử lý sự cố kỹ thuật |
| **Cư Dân** | `resident@building.com` | `resident123` | Xem thông tin căn hộ A-1001, xem & thanh toán hóa đơn QR, gửi báo cáo sự cố |

---

## 📦 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### Cách 1: Chạy Local trực tiếp với Node.js & Docker

1. **Clone repository và cài đặt dependencies**:
   ```bash
   npm install
   ```

2. **Khởi tạo file môi trường `.env`**:
   Tạo file `.env` từ `.env.example`:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_apartment"
   NEXTAUTH_SECRET="smart-apartment-secret-jwt-key-2026-very-secure"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Khởi chạy container PostgreSQL (Docker Compose)**:
   ```bash
   docker-compose up -d postgres
   ```

4. **Khởi tạo Database & Seed dữ liệu mẫu**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Khởi chạy máy chủ phát triển (Dev Server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

---

### Cách 2: Triển khai toàn bộ qua Docker Compose

```bash
docker-compose up --build
```

---

## 📋 Danh sách các Module Chức năng

1. **Xác thực & Phân quyền (Auth & RBAC)**:
   - Đăng nhập phân hệ BQL & Cư dân.
   - Đăng ký cư dân tự phục vụ.
   - Middleware bảo vệ route tự động chuyển hướng.

2. **Quản lý Căn hộ (Apartments)**:
   - CRUD căn hộ: Tòa nhà, tầng, số phòng ngủ/tắm, diện tích m².
   - Trạng thái ở: Đang ở, Đang trống, Đang sửa chữa.

3. **Quản lý Cư dân (Residents)**:
   - Hồ sơ định danh CCCD/CMND, SĐT, Email.
   - Phân loại quan hệ: Chủ hộ, Thân nhân, Khách thuê.
   - Gán cư dân vào căn hộ tương ứng.

4. **Quản lý Hợp đồng (Contracts)**:
   - Hợp đồng thuê / mua bán căn hộ.
   - Tự động cảnh báo hợp đồng sắp hết hạn dưới 30 ngày.

5. **Danh mục Phí & Hóa đơn (Fees & Invoices)**:
   - Cấu hình đơn giá: Phí quản lý (theo m²), phí gửi xe máy/ô tô, điện (kWh), nước (m³).
   - Tự động phát hành hóa đơn hàng loạt cho toàn bộ tòa nhà theo tháng.
   - Cổng thanh toán Sandbox VNPay/MoMo QR code.
   - In & Xuất biên lai PDF.

6. **Phản ánh & Báo sự cố (Feedbacks / Tickets)**:
   - Cư dân báo sự cố kỹ thuật (điện, nước, thang máy, an ninh).
   - BQL tiếp nhận, phân công và cập nhật trạng thái xử lý.
   - Đánh giá mức độ hài lòng 1-5 sao sau khi xử lý xong.

7. **Thông báo (Notifications)**:
   - BQL đăng thông báo chung toàn tòa nhà (bảo trì PCCC, lịch cắt điện nước).
   - Trung tâm thông báo cư dân với đánh dấu đã đọc.

8. **Dashboard & Thống kê Analytics**:
   - Biểu đồ Recharts doanh thu 6 tháng gần nhất.
   - Biểu đồ phân bổ trạng thái căn hộ & phân loại sự cố.
   - Thống kê tỷ lệ lấp đầy & tỷ lệ thu phí đúng hạn.

---

## 📁 Cấu trúc Thư mục Chi tiết

```
project-root/
├── docs/
│   ├── erd.md                     # Sơ đồ Cơ sở dữ liệu (ERD) & Mermaid diagram
│   └── api-collection.json        # Tài liệu REST API collection
├── prisma/
│   ├── schema.prisma              # Prisma Models & Enums
│   └── seed.ts                    # Dữ liệu mẫu (Admin, Fees, Apartments, Invoices)
├── src/
│   ├── app/
│   │   ├── (auth)/                # Màn hình Login / Register
│   │   ├── (management)/          # Phân hệ Ban Quản Lý (Dashboard, CRUD modules)
│   │   ├── (resident)/            # Phân hệ Cư Dân (Home, Invoices, Feedback)
│   │   └── api/                   # Route Handlers REST API
│   ├── components/
│   │   ├── ui/                    # shadcn UI components (Button, Card, Dialog...)
│   │   ├── shared/                # Component dùng chung (DataTable, StatCard, PageHeader)
│   │   └── layout/                # Sidebar, Topbar
│   ├── modules/                   # Logic Server Domain (Service, Repository, Schema)
│   ├── services/                  # Client Services gọi API
│   ├── hooks/                     # Custom React Query Hooks
│   ├── lib/                       # Prisma client, NextAuth, API Response helper, utils
│   └── middleware.ts              # Route Guard & RBAC
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md
```
