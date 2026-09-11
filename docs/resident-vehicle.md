# Cổng Phương Tiện & Thẻ Giữ Xe Dành Cho Cư Dân (Resident Vehicle Portal)

Tài liệu thiết kế kiến trúc, bảo mật và hướng dẫn sử dụng cổng dịch vụ tự phục vụ (**Resident Self-Service Vehicle Portal**) dành cho cư dân chung cư thông minh.

---

## 1. Tổng quan & Triết lý Thiết kế

Phân hệ **Resident Vehicle Portal** được thiết kế nhằm thay thế hoàn toàn việc cư dân phải đăng ký xe thủ công bằng giấy tại quầy ban quản lý. Cư dân có thể chủ động:
- Khai báo hồ sơ phương tiện (ô tô, xe máy, xe điện, xe đạp).
- Tải lên ảnh chụp cà vẹt / giấy đăng ký xe để đối soát.
- Theo dõi tiến trình thụ lý hồ sơ trực tiếp theo thời gian thực (Submitted → Under Review → Approved / Rejected).
- Xem thông tin thẻ từ RFID gắn với xe, thời hạn hiệu lực và trạng thái thẻ.

### Triết lý UX:
* **Mobile-First & Card-Based**: Tối ưu hóa cho màn hình điện thoại cảm ứng, hiển thị dạng thẻ xe trực quan thay vì các bảng dữ liệu (DataTable) phức tạp.
* **Minh bạch thông tin**: Hiển thị rõ lý do nếu hồ sơ bị từ chối phê duyệt để cư dân bổ sung giấy tờ kịp thời.
* **Không làm phiền**: Tự động thông báo và cập nhật trạng thái theo chu trình xử lý của BQL.

---

## 2. Tuyến đường (Routes)

Tuân thủ quy ước tuyến đường của phân hệ cư dân:
* `/resident/vehicles`: Trang tổng quan danh sách xe của hộ gia đình, thống kê nhanh, bộ lọc phân loại và nút đăng ký xe mới.
* `/resident/vehicles/[id]`: Trang chi tiết độc lập hiển thị thông số kỹ thuật, tiến độ xét duyệt, thẻ RFID và ảnh cà vẹt xe.

---

## 3. Các Chức Năng Chính

### 3.1. Danh sách Xe Của Tôi (My Vehicles)
* **Thẻ phương tiện trực quan**:
  * Biển số xe dập nổi dạng badge chuẩn Việt Nam (VD: `30A-999.88`, `29-G1 888.66`).
  * Phân loại phương tiện kèm biểu tượng sinh động: Ô tô (`CAR`), Xe máy (`MOTORBIKE`), Xe điện (`ELECTRIC_BIKE`), Xe đạp (`BICYCLE`).
  * Hãng xe, Model (dòng xe), Màu sơn xe.
  * Trạng thái duyệt hồ sơ: `Đang hoạt động (ACTIVE)`, `Chờ phê duyệt (PENDING_APPROVAL)`, `Từ chối duyệt (REJECTED)`, `Ngưng hoạt động (INACTIVE)`.
  * Thẻ gửi xe RFID: Hiển thị mã thẻ (VD: `CARD-CAR-001`), trạng thái thẻ (`Hoạt động`, `Đang khóa`, `Hết hạn`), ngày cấp và hạn sử dụng.
* **Thống kê nhanh**:
  * Tổng xe đăng ký, Số xe đang hoạt động, Số xe chờ duyệt, Số thẻ RFID đã cấp.
* **Bộ lọc nhanh (Tabs)**:
  * Tất cả xe, Ô tô, Xe máy, Xe chờ duyệt.

---

### 3.2. Đăng Ký Phương Tiện Mới (Register Vehicle)
* **Nút bấm CTA**: `+ Đăng ký phương tiện`.
* **Biểu mẫu đăng ký**:
  * Biển số xe (*Bắt buộc*, tự động chuẩn hóa chữ hoa).
  * Loại phương tiện (*Bắt buộc*: Ô tô, Xe máy, Xe điện, Xe đạp).
  * Hãng sản xuất (*Bắt buộc*: Honda, Toyota, VinFast, Mercedes-Benz...).
  * Dòng xe / Model (*Tùy chọn*: SH 150i, Camry, VF8...).
  * Màu sơn xe (*Tùy chọn*).
  * Link ảnh chụp cà vẹt / giấy đăng ký xe (*Đối soát tính chính chủ*).
* **Quy tắc nghiệp vụ**:
  * Sau khi gửi, hồ sơ luôn ở trạng thái **Chờ duyệt (`PENDING_APPROVAL`)**.
  * Căn hộ sở hữu và định danh cư dân được gán tự động từ phiên đăng nhập (Session JWT), cư dân không thể đăng ký hộ căn khác.

---

### 3.3. Chi Tiết Phương Tiện & Tiến Trình Phê Duyệt (Approval Status)
* **Dòng thời gian phê duyệt (Timeline)**:
  * **Trường hợp hồ sơ hợp lệ**:
    1. *Đã gửi thông tin đăng ký (Submitted)*: Ghi nhận ngày giờ nộp hồ sơ.
    2. *Ban Quản Lý thụ lý & đối soát (Under Review)*: Cán bộ BQL kiểm tra tính hợp lệ và định mức đỗ xe của căn hộ.
    3. *Phê duyệt & Kích hoạt thẻ (Approved)*: Cấp thẻ RFID và mở cổng barie hầm xe.
  * **Trường hợp hồ sơ bị từ chối**:
    1. *Đã gửi thông tin đăng ký (Submitted)*.
    2. *Từ chối phê duyệt (Rejected)*: **Hiển thị rõ lý do từ chối** (VD: *Ảnh cà vẹt mờ; Biển số không trùng khớp; Hết chỗ đỗ ô tô trong hầm...*).
* **Quyền hạn chỉnh sửa của Cư dân**:
  * Cư dân **chỉ được phép chỉnh sửa** thông tin xe khi hồ sơ đang ở trạng thái `PENDING_APPROVAL` (cho phép sửa hãng, model, màu, bổ sung link ảnh cà vẹt).
  * Khi xe đã ở trạng thái `ACTIVE` hoặc `REJECTED`, giao diện khóa chỉnh sửa.
  * Cư dân **tuyệt đối không được phép** tự ý thay đổi: Biển số xe, Căn hộ sở hữu, Trạng thái duyệt (`status`), Mã thẻ RFID, Trạng thái thẻ RFID.

---

## 4. Kiến Trúc Bảo Mật & Phân Quyền (RBAC / IDOR Protection)

> [!IMPORTANT]
> **Nguyên tắc cốt lõi**: Ẩn giao diện trên Frontend (**Frontend hiding**) không được coi là giải pháp bảo mật. Toàn bộ logic phân quyền phải được thẩm định nghiêm ngặt tại Backend Service và Database Layer.

### 4.1. Chống IDOR (Insecure Direct Object Reference)
* Tại API `GET /api/vehicles`:
  * Nếu người dùng có vai trò `RESIDENT`, backend truy vấn thông tin căn hộ của tài khoản trong cơ sở dữ liệu (`getVerifiedResidentInfo(user.id)`).
  * Bộ lọc `apartmentId` bị ghi đè bắt buộc bằng căn hộ thực của cư dân, bỏ qua mọi tham số query mà client cố tình truyền vào.
* Tại API `GET /api/vehicles/:id`:
  * Trước khi trả về dữ liệu, hàm `authorizeVehicleAccess(user, vehicle.apartmentId)` kiểm tra xem xe có thuộc căn hộ của cư dân hay không.
  * Nếu một cư dân ở căn A-1001 cố tình đổi URL thành ID xe của căn B-2001, hệ thống ngay lập tức trả về mã lỗi **403 Forbidden** (`Bạn không có quyền truy cập phương tiện của căn hộ khác`).

### 4.2. Chống giả mạo căn hộ khi tạo xe
* Tại API `POST /api/vehicles`:
  * Cư dân gửi request kèm bất kỳ `apartmentId` nào khác căn hộ của mình sẽ bị hàm kiểm tra từ chối với lỗi **403 Forbidden** (`INVALID_APARTMENT`).
  * Trạng thái khởi tạo luôn bị ép cứng là `PENDING_APPROVAL`.

### 4.3. Chống sửa đổi trạng thái & khóa/mở thẻ trái phép
* Các hành động quản trị: Phê duyệt (`POST /approve`), Từ chối (`POST /reject`), Ngưng hoạt động (`POST /deactivate`), Cấp thẻ (`POST /parking-card`), Khóa thẻ (`POST /lock`), Mở khóa thẻ (`POST /unlock`) đều có guard role bắt buộc là `ADMIN` hoặc `MANAGER`. Tài khoản `RESIDENT` thực hiện sẽ nhận về lỗi **403 Forbidden**.

---

## 5. Danh Sách Test Tự Động (Automated Test Suite)

Tất cả các kịch bản phân quyền và bảo mật đã được bao phủ 100% trong bộ kiểm thử `tests/vehicle-management.test.ts`:
1. `MUST normalize plate by removing spaces, hyphens, and dots into uppercase`: Kiểm tra chuẩn hóa biển số.
2. `MUST detect duplicate plates with different punctuation styles`: Chống trùng biển số xe.
3. `MUST force RESIDENT vehicle creation to PENDING_APPROVAL and their own apartment`: Ép trạng thái chờ duyệt và đúng căn hộ.
4. `MUST REJECT when RESIDENT tries to register vehicle for another apartment`: Chống đăng ký xe hộ căn khác.
5. `MUST DENY resident accessing vehicle details of another apartment`: Chống truy cập IDOR trái phép qua ID.
6. `MUST ALLOW resident to view vehicles belonging to their own apartment`: Cho phép xem xe của chính mình.
7. `MUST DENY resident trying to approve or reject vehicles`: Cấm cư dân tự phê duyệt xe.
8. `MUST DENY resident from locking or unlocking cards`: Cấm cư dân tự khóa/mở thẻ RFID.
9. `MUST scope getVehicles query strictly to resident apartment regardless of query spoofing`: Chống bypass query lọc xe.
10. `MUST block resident from modifying vehicle details when status is ACTIVE`: Khóa sửa đổi khi xe đã được duyệt.
11. `MUST block resident from altering vehicle status or changing license plate`: Chống đổi biển số hoặc đổi trạng thái xe.
