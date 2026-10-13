# K-HOME DOMAIN DATA DICTIONARY (TỪ ĐIỂN DỮ LIỆU NGHIỆP VỤ)

> **Tài liệu:** Từ điển Dữ liệu Nghiệp vụ & Đặc tả Chi tiết Các Thực thể K-Home  
> **Dự án:** K-Home — Smart Property Management System  
> **Phiên bản:** 2.0 (Target Model)  
> **Ngày lập:** 12/10/2026  

---

## 1. PHÂN HỆ XÁC THỰC, NGƯỜI DÙNG & NHÂN SỰ

### 1.1. Model `User` (`users`)
* **Mục đích:** Tài khoản xác thực danh tính hệ thống, quản lý thông tin đăng nhập, vai trò truy cập (RBAC) và phiên làm việc.
* **Primary Key:** `id` (String, cuid).
* **Fields:**
  * `email` (String, Unique, Required): Email đăng nhập.
  * `passwordHash` (String, Required): Mật khẩu băm Bcrypt.
  * `fullName` (String, Required): Họ và tên hiển thị.
  * `phone` (String, Optional): Số điện thoại liên hệ.
  * `avatarUrl` (String, Optional): Đường dẫn ảnh đại diện.
  * `role` (Enum `Role`, Default: `RESIDENT`): Quyền hạn hệ thống (`ADMIN`, `MANAGER`, `STAFF_TECHNICIAN`, `STAFF_SECURITY`, `STAFF_RECEPTIONIST`, `RESIDENT`).
  * `isActive` (Boolean, Default: `true`): Trạng thái kích hoạt tài khoản.
* **Relations:**
  * 1-1 với `Resident` (`residentProfile`).
  * 1-1 với `StaffProfile` (`staffProfile`).
  * 1-N với `ManagerBuilding` (`managedBuildings`).
* **OnDelete Policy:** `Restrict` nếu còn dữ liệu kiểm toán hoặc quản lý tài chính; `Cascade` cho profile nếu tài khoản bị hủy hoàn toàn.

---

### 1.2. Model `StaffProfile` (`staff_profiles`)
* **Mục đích:** Hồ sơ thông tin nghiệp vụ nội bộ của nhân viên tòa nhà (Kỹ thuật viên, Bảo vệ, Lễ tân).
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `userId` (String, Unique, references `User.id`, `onDelete: Cascade`).
* **Fields:**
  * `employeeCode` (String, Unique): Mã số nhân viên (VD: `NV-TECH-001`, `NV-SEC-002`).
  * `position` (String): Chức danh công việc (VD: "Kỹ thuật viên trưởng", "Tổ phó an ninh").
  * `department` (String, Optional): Ban/Bộ phận ("Ban Kỹ thuật", "Đội An ninh").
  * `currentShift` (Enum `StaffShift`): Ca làm việc hiện tại (`MORNING`, `AFTERNOON`, `NIGHT`).
  * `status` (Enum `StaffStatus`): Trạng thái nhân sự (`ACTIVE`, `ON_LEAVE`, `SUSPENDED`, `TERMINATED`).
  * `assignedZone` (String, Optional): Khu vực phụ trách (VD: "Sảnh tháp A", "Cổng kiểm soát xe").

---

### 1.3. Model `ManagerBuilding` (`manager_buildings`)
* **Mục đích:** Bảng liên kết phạm vi quản trị nhiều-nhiều giữa Quản lý (`User.role = MANAGER`) và Tòa nhà (`Building`).
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `managerId` (String, references `User.id`, `onDelete: Cascade`).
  * `buildingId` (String, references `Building.id`, `onDelete: Cascade`).
* **Constraints:** `@@unique([managerId, buildingId])` — Mỗi manager chỉ được gán 1 lần cho mỗi tòa nhà.
* **Fields:**
  * `assignedAt` (DateTime, Default: now): Thời điểm bắt đầu phụ trách.
  * `isActive` (Boolean, Default: true): Trạng thái phân công đang hiệu lực.

---

## 2. PHÂN HỆ CẤU TRÚC BẤT ĐỘNG SẢN (PROPERTY HIERARCHY)

### 2.1. Model `Building` (`buildings`)
* **Mục đích:** Thực thể cao nhất trong cấu trúc bất động sản, đại diện cho một tòa nhà hoặc một phân khu phức hợp.
* **Primary Key:** `id` (String, cuid).
* **Fields:**
  * `code` (String, Unique): Mã tòa nhà (VD: `LANDMARK-01`, `SKY-TOWER`).
  * `name` (String): Tên hiển thị của tòa nhà.
  * `address` (String, Optional): Địa chỉ thực tế.
  * `description` (String, Optional): Giới thiệu quy mô, tiện ích.
* **Relations:**
  * 1-N với `Block` (`blocks`).
  * 1-N với `Apartment` (`apartments`).
  * 1-N với `ParkingArea` (`parkingAreas`).
  * 1-N với `Asset` (`assets`).
  * 1-N với `Facility` (`facilities`).

---

### 2.2. Model `Block` (`blocks`)
* **Mục đích:** Khối nhà hoặc tháp căn hộ độc lập trong một tòa nhà phức hợp (Tower/Block).
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `buildingId` (String, references `Building.id`, `onDelete: Cascade`).
* **Constraints:** `@@unique([buildingId, code])` — Mã khối nhà duy nhất trong phạm vi tòa nhà.
* **Fields:**
  * `code` (String): Mã khối (VD: `BLOCK-A`, `BLOCK-B`, `TOWER-1`).
  * `name` (String): Tên khối (VD: "Tháp Sky", "Tháp Oasis").
  * `totalFloors` (Int, Default: 25): Tổng số tầng thiết kế.
* **Relations:** 1-N với `Floor` (`floors`), 1-N với `Apartment` (`apartments`).

---

### 2.3. Model `Floor` (`floors`)
* **Mục đích:** Tầng lầu trong khối nhà.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `blockId` (String, references `Block.id`, `onDelete: Cascade`).
* **Constraints:** `@@unique([blockId, floorNumber])` — Số tầng duy nhất trong phạm vi khối nhà.
* **Fields:**
  * `floorNumber` (Int): Số tầng (VD: 1, 2, 10, 25).
  * `name` (String): Tên hiển thị (VD: "Tầng 10", "Tầng Penthouse").
* **Relations:** 1-N với `Apartment` (`apartments`).

---

### 2.4. Model `Apartment` (`apartments`)
* **Mục đích:** Căn hộ cụ thể, đối tượng trung tâm của mọi hoạt động cư trú, hợp đồng, dịch vụ và thu phí.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys (Phân cấp chuẩn hóa):**
  * `floorId` (String, Optional trong migration, references `Floor.id`, `onDelete: Restrict`).
  * `blockId` (String, Optional, references `Block.id`, `onDelete: Restrict`).
  * `buildingId` (String, Optional, references `Building.id`, `onDelete: Restrict`).
* **Legacy Fields (Backward Compatibility):**
  * `building` (String): Tên tòa nhà dạng chuỗi (đồng bộ tự động từ `buildingRef.name`).
  * `floor` (Int): Số tầng dạng số nguyên (đồng bộ tự động từ `floorRef.floorNumber`).
* **Fields:**
  * `code` (String, Unique): Mã định danh căn hộ (VD: `A-1001`, `B-1502`).
  * `bedrooms` (Int, Default: 2): Số phòng ngủ.
  * `bathrooms` (Int, Default: 2): Số phòng tắm.
  * `area` (Float): Diện tích thông thủy ($m^2$).
  * `status` (Enum `ApartmentStatus`, Default: `VACANT`): Trạng thái (`VACANT`, `OCCUPIED`, `UNDER_MAINTENANCE`).
  * `note` (String, Optional): Ghi chú bàn giao hoặc trang bị nội thất.
* **OnDelete Policy:** `Restrict` — Không cho phép xóa căn hộ nếu đã có hóa đơn kế toán, hợp đồng hoặc cư dân liên quan.

---

## 3. PHÂN HỆ NHÂN KHẨU, CHỦ SỞ HỮU & CƯ DÂN

### 3.1. Model `Resident` (`residents`)
* **Mục đích:** Hồ sơ nhân khẩu công dân của cư dân hoặc chủ sở hữu bất động sản.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `userId` (String, Optional, Unique, references `User.id`, `onDelete: SetNull`).
  * `apartmentId` (String, Optional, references `Apartment.id`, `onDelete: SetNull`) — *Được duy trì cho backward-compatibility; các quan hệ thực tế mới quản lý qua `ApartmentOwnership` và `ApartmentResident`*.
* **Constraints:** `identityCard` (String, Unique) — Số Căn cước công dân / Hộ chiếu duy nhất toàn quốc.
* **Fields:**
  * `fullName` (String): Họ và tên đầy đủ.
  * `phone` (String): Số điện thoại chính.
  * `email` (String, Optional): Hộp thư điện tử.
  * `dateOfBirth` (DateTime, Optional): Ngày tháng năm sinh.
  * `gender` (String, Optional): Giới tính.
  * `status` (Enum `ResidentStatus`, Default: `RESIDING`): Tình trạng (`RESIDING`, `MOVED_OUT`, `TEMPORARY_ABSENT`).
  * `relationshipToOwner` (Enum `ResidentRelationship`, Default: `OWNER`): Quan hệ gia đình.

---

### 3.2. Model `ApartmentOwnership` (`apartment_ownerships`) — [MÔ HÌNH ĐÍCH]
* **Mục đích:** Quản lý quyền sở hữu pháp lý đối với căn hộ, hỗ trợ đồng sở hữu, chủ nhà ở xa (Investor) và lịch sử sang tên sổ hồng.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `apartmentId` (String, references `Apartment.id`, `onDelete: Restrict`).
  * `ownerResidentId` (String, references `Resident.id`, `onDelete: Restrict`).
* **Fields:**
  * `ownershipType` (String, Default: "SOLE"): Hình thức sở hữu (`SOLE`, `CO_OWNER`, `CORPORATE`).
  * `ownershipPercentage` (Float, Default: 100): Tỷ lệ sở hữu (VD: 50%, 100%).
  * `certificateNumber` (String, Optional): Số sổ hồng / Giấy chứng nhận quyền sở hữu nhà ở.
  * `issueDate` (DateTime, Optional): Ngày cấp sổ.
  * `startDate` (DateTime, Default: now): Ngày bắt đầu có quyền sở hữu.
  * `endDate` (DateTime, Optional): Ngày chuyển nhượng sang tên (nếu đã bán).
  * `isCurrent` (Boolean, Default: true): Cờ xác nhận hiện đang là chủ sở hữu hợp pháp.
* **Constraints:** `@@index([apartmentId, isCurrent])`, `@@index([ownerResidentId])`.

---

### 3.3. Model `ApartmentResident` (`apartment_residents`) — [MÔ HÌNH ĐÍCH]
* **Mục đích:** Quản lý thực tế ai đang sinh sống tại căn hộ (Chủ nhà trực tiếp ở, Người thuê nhà, Con cái, Người tạm trú) với mốc thời gian rõ ràng.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `apartmentId` (String, references `Apartment.id`, `onDelete: Restrict`).
  * `residentId` (String, references `Resident.id`, `onDelete: Restrict`).
* **Fields:**
  * `roleInHousehold` (String): Vai trò (`HEAD_OF_HOUSEHOLD`, `SPOUSE`, `CHILD`, `PARENT`, `TENANT`, `GUEST`).
  * `isLivingHere` (Boolean, Default: true): Đang thực tế sinh sống tại căn hộ.
  * `startDate` (DateTime, Default: now): Ngày dọn vào ở.
  * `endDate` (DateTime, Optional): Ngày chuyển đi.
* **Constraints:** `@@unique([apartmentId, residentId, startDate])`.

---

## 4. PHÂN HỆ HỢP ĐỒNG (CONTRACTS)

### 4.1. Model `Contract` (`contracts`)
* **Mục đích:** Hợp đồng pháp lý ràng buộc giữa các bên (Hợp đồng cho thuê căn hộ hoặc Hợp đồng mua bán chuyển nhượng).
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `apartmentId` (String, references `Apartment.id`, `onDelete: Restrict`).
  * `residentId` (String, references `Resident.id`, `onDelete: Restrict`): Đại diện Bên thuê (Tenant) hoặc Bên mua (Buyer).
* **Constraints:** `contractCode` (String, Unique) — Số hợp đồng duy nhất (VD: `HDT-2026-A1001`).
* **Fields:**
  * `type` (Enum `ContractType`, Default: `RENT`): Loại hợp đồng (`RENT` - Thuê, `SALE` - Mua bán).
  * `startDate` (DateTime): Ngày bắt đầu hiệu lực.
  * `endDate` (DateTime): Ngày kết thúc thời hạn hợp đồng.
  * `monthlyRent` (Float, Optional): Tiền thuê hàng tháng (VNĐ).
  * `deposit` (Float, Optional): Tiền đặt cọc (VNĐ).
  * `status` (Enum `ContractStatus`, Default: `ACTIVE`): Trạng thái (`ACTIVE`, `EXPIRED`, `TERMINATED`).
  * `fileUrl` (String, Optional): Bản scan hợp đồng PDF có chữ ký.
  * `note` (String, Optional): Các điều khoản cam kết đặc biệt.

---

## 5. PHÂN HỆ TÀI CHÍNH, HÓA ĐƠN & THANH TOÁN

### 5.1. Model `FeeCategory` (`fee_categories`)
* **Mục đích:** Danh mục các loại phí chuẩn của hệ thống và đơn giá định mức (Biểu phí toàn cục).
* **Primary Key:** `id` (String, cuid).
* **Constraints:** `code` (String, Unique) — Mã biểu phí (VD: `MGMT`, `PARKING_CAR`, `WATER`).
* **Fields:**
  * `name` (String): Tên khoản phí (VD: "Phí dịch vụ quản lý tòa nhà", "Phí gửi xe ô tô").
  * `unit` (Enum `FeeUnit`): Đơn vị tính (`PER_M2`, `PER_MONTH`, `PER_VEHICLE`, `PER_M3`, `PER_KWH`, `FIXED`).
  * `unitPrice` (Float): Đơn giá (VNĐ).
  * `isSystem` (Boolean, Default: false): Cờ bảo vệ các khoản phí bắt buộc của hệ thống.

---

### 5.2. Model `Invoice` (`invoices`)
* **Mục đích:** Hóa đơn tổng hợp hàng tháng phát hành cho căn hộ (Bao gồm phí QL, điện, nước, gửi xe).
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `apartmentId` (String, references `Apartment.id`, `onDelete: Restrict`).
* **Constraints:** `code` (String, Unique) — Mã hóa đơn (VD: `INV-202610-A1001`).
* **Fields:**
  * `billingMonth` (String): Kỳ thu phí định dạng `YYYY-MM` (VD: `2026-10`).
  * `dueDate` (DateTime): Hạn chót thanh toán.
  * `totalAmount` (Float, Default: 0): Tổng số tiền phải nộp.
  * `status` (Enum `InvoiceStatus`, Default: `UNPAID`): Trạng thái (`UNPAID`, `PAID`, `OVERDUE`, `CANCELLED`).
  * `paidAt` (DateTime, Optional): Thời điểm hoàn tất nộp tiền.
  * `paymentMethod` (Enum `PaymentMethod`, Optional): Phương thức (`VNPAY`, `MOMO`, `BANK_TRANSFER`, `CASH`).
  * `transactionId` (String, Optional): Mã đối soát ngân hàng.

---

### 5.3. Model `InvoiceItem` (`invoice_items`)
* **Mục đích:** Chi tiết từng dòng cước trong hóa đơn.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `invoiceId` (String, references `Invoice.id`, `onDelete: Cascade`).
  * `feeCategoryId` (String, Optional, references `FeeCategory.id`, `onDelete: SetNull`).
* **Fields:**
  * `title` (String): Tên hiển thị của dịch vụ (VD: "Phí xe máy: 29B1-888.99").
  * `quantity` (Float, Default: 1): Số lượng / Chỉ số tiêu thụ.
  * `unitPrice` (Float): Đơn giá áp dụng tại thời điểm lập hóa đơn.
  * `amount` (Float): Thành tiền ($quantity \times unitPrice$).

---

### 5.4. Model `PaymentTransaction` (`payment_transactions`) — [MÔ HÌNH ĐÍCH]
* **Mục đích:** Nhật ký từng giao dịch thanh toán thực tế (hỗ trợ thanh toán từng phần, hoàn tiền, đối soát Webhook ngân hàng).
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `invoiceId` (String, references `Invoice.id`, `onDelete: Restrict`).
* **Fields:**
  * `transactionCode` (String, Unique): Mã giao dịch sinh bởi hệ thống.
  * `amount` (Float): Số tiền thanh toán của đợt này.
  * `paymentMethod` (Enum `PaymentMethod`): Hình thức thanh toán.
  * `gatewayTransactionNo` (String, Optional): Mã GD của cổng VNPAY/MOMO.
  * `bankCode` (String, Optional): Ngân hàng thanh toán (VD: `VCB`, `MBB`).
  * `status` (String, Default: "SUCCESS"): Trạng thái GD (`SUCCESS`, `PENDING`, `FAILED`, `REFUNDED`).
  * `transactedAt` (DateTime, Default: now): Thời điểm giao dịch thành công.

---

## 6. PHÂN HỆ PHƯƠNG TIỆN & BÃI ĐỖ XE THÔNG MINH

### 6.1. Model `Vehicle` (`vehicles`)
* **Mục đích:** Phương tiện giao thông của cư dân đăng ký gửi trong tòa nhà.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `apartmentId` (String, references `Apartment.id`, `onDelete: Cascade`): Căn hộ tính hạn ngạch.
  * `residentId` (String, Optional, references `Resident.id`, `onDelete: SetNull`): Người đứng tên xe.
* **Constraints:** `licensePlate` (String, Unique) — Biển số xe duy nhất toàn quốc (VD: `30A-999.88`).
* **Fields:**
  * `type` (Enum `VehicleType`, Default: `MOTORBIKE`): Loại xe (`CAR`, `MOTORBIKE`, `BICYCLE`, `ELECTRIC_BIKE`).
  * `brand` (String): Hãng xe (Toyota, Honda, VinFast).
  * `model` (String, Optional): Dòng xe (Vios, SH, VF8).
  * `color` (String, Optional): Màu xe.
  * `status` (Enum `VehicleStatus`, Default: `PENDING_APPROVAL`): Trạng thái (`PENDING_APPROVAL`, `ACTIVE`, `INACTIVE`, `REJECTED`).
  * `registrationDocumentUrl` (String, Optional): Ảnh chụp cavet/đăng ký xe.

---

### 6.2. Model `ParkingArea` (`parking_areas`)
* **Mục đích:** Khu vực bãi xe lớn trong tòa nhà (Tầng hầm B1, Tầng hầm B2, Bãi ngoài trời).
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `buildingId` (String, references `Building.id`, `onDelete: Cascade`).
* **Constraints:** `@@unique([buildingId, code])`.
* **Fields:**
  * `code` (String): Mã bãi (VD: `B1`, `B2`).
  * `name` (String): Tên bãi ("Tầng hầm B1").
  * `floor` (Int, Default: -1): Cao độ tầng hầm.
  * `totalCapacity` (Int, Default: 0): Sức chứa tối đa.

---

### 6.3. Model `ParkingZone` (`parking_zones`)
* **Mục đích:** Khu vực đỗ xe chuyên biệt trong bãi (Phân theo loại xe ô tô, xe máy, trạm sạc EV).
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `areaId` (String, references `ParkingArea.id`, `onDelete: Cascade`).
* **Constraints:** `@@unique([areaId, code])`.
* **Fields:**
  * `code` (String): Mã khu vực (VD: `ZONE-A`, `ZONE-B`).
  * `name` (String): Tên khu vực ("Khu A - Ô tô cư dân").
  * `vehicleType` (Enum `VehicleType`): Loại xe được phép đỗ.
  * `colorHex` (String, Optional): Mã màu hiển thị trên sơ đồ bãi đỗ.

---

### 6.4. Model `ParkingSlot` (`parking_slots`)
* **Mục đích:** Tọa độ ô đỗ xe cụ thể trên bản đồ 2D.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `zoneId` (String, references `ParkingZone.id`, `onDelete: Cascade`).
  * `areaId` (String, references `ParkingArea.id`, `onDelete: Cascade` — Duy trì để tương thích truy vấn phẳng).
* **Constraints:** `@@unique([areaId, code])`.
* **Fields:**
  * `code` (String): Mã ô đỗ (VD: `B1-A01`, `B1-A02`).
  * `type` (Enum `SlotVehicleType`): Kích thước tiêu chuẩn của ô.
  * `status` (Enum `ParkingSlotStatus`, Default: `AVAILABLE`): Trạng thái (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`, `BLOCKED`).
  * `positionX` (Float), `positionY` (Float): Tọa độ hiển thị trên sơ đồ SVG/Canvas.
  * `isReservable` (Boolean, Default: true): Cho phép cư dân đăng ký cố định.

---

### 6.5. Model `ParkingAssignment` (`parking_assignments`)
* **Mục đích:** Hợp đồng / Quyết định phân công ô đỗ xe cố định cho phương tiện đang có hiệu lực.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `slotId` (String, references `ParkingSlot.id`, `onDelete: Cascade`).
  * `vehicleId` (String, references `Vehicle.id`, `onDelete: Cascade`).
  * `apartmentId` (String, references `Apartment.id`, `onDelete: Cascade`).
  * `requestId` (String, Optional, Unique, references `ParkingRegistrationRequest.id`).
* **Constraints:** `assignmentCode` (String, Unique), `qrToken` (String, Unique).
* **Fields:**
  * `startDate` (DateTime, Default: now): Ngày bắt đầu giữ chỗ.
  * `endDate` (DateTime, Optional): Ngày hết hạn hợp đồng đỗ xe.
  * `status` (Enum `ParkingAssignmentStatus`, Default: `ACTIVE`): Trạng thái (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `TERMINATED`).
  * `monthlyFee` (Float, Default: 0): Phí gửi xe hàng tháng ghi nhận tại thời điểm cấp.
* **Business Rule:** Chỉ có tối đa **1 bản ghi có `status = ACTIVE`** trên cùng một `slotId` hoặc `vehicleId`.

---

## 7. PHÂN HỆ SỰ CỐ, KỸ THUẬT & BẢO TRÌ

### 7.1. Model `Feedback` (`feedbacks`)
* **Mục đích:** Phiếu phản ánh sự cố hoặc yêu cầu sửa chữa gửi từ cư dân.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `residentId` (String, references `Resident.id`, `onDelete: Restrict`).
  * `apartmentId` (String, references `Apartment.id`, `onDelete: Restrict`).
  * `assignedStaffId` (String, Optional, references `User.id`, `onDelete: SetNull`).
  * `assetId` (String, Optional, references `Asset.id`, `onDelete: SetNull`).
* **Constraints:** `code` (String, Unique) — Mã phiếu sự cố (VD: `FB-2026-0001`).
* **Fields:**
  * `title` (String), `content` (String), `images` (String[]): Nội dung phản ánh.
  * `category` (Enum `TicketCategory`): Phân loại sự cố (`ELECTRIC`, `WATER`, `ELEVATOR`, `SECURITY`, `CLEANLINESS`, `OTHER`).
  * `priority` (Enum `TicketPriority`, Default: `MEDIUM`): Mức độ khẩn cấp (`LOW`, `MEDIUM`, `HIGH`, `URGENT`, `CRITICAL`).
  * `status` (Enum `TicketStatus`, Default: `NEW`): Vòng đời ticket (`NEW` -> `ASSIGNED` -> `PROCESSING` -> `RESOLVED` -> `CLOSED` / `REJECTED`).
  * `slaDueAt` (DateTime, Optional): Thời hạn cam kết xử lý xong (SLA Deadline).
  * `rating` (Int, Optional): Đánh giá mức độ hài lòng của cư dân (1-5 sao).

---

### 7.2. Model `Asset` (`assets`)
* **Mục đích:** Quản lý danh mục tài sản, trang thiết bị kỹ thuật dùng chung của tòa nhà.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `buildingId` (String, Optional, references `Building.id`, `onDelete: SetNull`).
* **Constraints:** `code` (String, Unique) — Mã tài sản (VD: `AST-ELEV-001`, `AST-PUMP-002`).
* **Fields:**
  * `name` (String): Tên thiết bị (VD: "Thang máy tải khách số 1 - Tháp A").
  * `category` (Enum `AssetCategory`): Chủng loại (`ELEVATOR`, `WATER_PUMP`, `FIRE_ALARM`, `GENERATOR`, `CCTV`, `BARRIER`...).
  * `location` (String): Vị trí lắp đặt.
  * `supplier` (String, Optional): Nhà cung cấp / Đơn vị bảo hành.
  * `warrantyExpiry` (DateTime, Optional): Ngày hết hạn bảo hành.
  * `status` (Enum `AssetStatus`, Default: `OPERATIONAL`): Tình trạng (`OPERATIONAL`, `MAINTENANCE`, `BROKEN`, `RETIRED`).

---

### 7.3. Model `MaintenanceSchedule` (`maintenance_schedules`)
* **Mục đích:** Kế hoạch bảo trì phòng ngừa định kỳ thiết bị kỹ thuật do Ban Quản lý lập.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `assetId` (String, references `Asset.id`, `onDelete: Cascade`).
  * `technicianId` (String, Optional, references `User.id`, `onDelete: SetNull`).
* **Constraints:** `code` (String, Unique) — Mã lịch bảo trì (VD: `SCH-2026-001`).
* **Fields:**
  * `title` (String): Tiêu đề công việc bảo dưỡng.
  * `cycle` (Enum `MaintenanceCycle`): Chu kỳ (`DAILY`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `SEMI_ANNUALLY`, `ANNUALLY`).
  * `lastMaintenance` (DateTime, Optional): Ngày bảo trì gần nhất.
  * `nextMaintenance` (DateTime): Ngày bảo trì định kỳ kế tiếp.
  * `status` (Enum `MaintenanceStatus`, Default: `PENDING`): Trạng thái (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`).

---

### 7.4. Model `WorkOrder` (`work_orders`)
* **Mục đích:** Phiếu giao việc cụ thể cho kỹ thuật viên thực thi bảo dưỡng hoặc khắc phục sự cố.
* **Primary Key:** `id` (String, cuid).
* **Foreign Keys:**
  * `assetId` (String, references `Asset.id`, `onDelete: Cascade`).
  * `scheduleId` (String, Optional, references `MaintenanceSchedule.id`, `onDelete: SetNull`).
  * `technicianId` (String, Optional, references `User.id`, `onDelete: SetNull`).
* **Constraints:** `code` (String, Unique) — Mã phiếu việc (VD: `WO-2026-001`).
* **Fields:**
  * `title` (String), `description` (String, Optional): Yêu cầu kỹ thuật.
  * `findings` (String, Optional): Kết quả khảo sát thực tế của kỹ thuật viên.
  * `cost` (Float, Default: 0): Chi phí vật tư thay thế phát sinh.
  * `status` (Enum `MaintenanceStatus`, Default: `IN_PROGRESS`): Tiến độ.
  * `completedAt` (DateTime, Optional): Thời điểm nghiệm thu hoàn thành.
