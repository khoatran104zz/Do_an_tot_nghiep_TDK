# Tài Liệu Kỹ Thuật REST API: Phân Hệ Quản Lý Phương Tiện & Thẻ Gửi Xe (Vehicle & Parking Management)

> **Phân hệ**: Vehicle & Parking Card Management  
> **Kiến trúc**: Route Handlers (`src/app/api/**`) → Services (`src/modules/vehicle/**`) → Prisma Client  
> **Ngày hoàn thiện**: 11/09/2026

---

## 1. Danh Sách Endpoint REST API

### 1.1 Quản Lý Phương Tiện (Vehicles)

| Phương thức | Endpoint | Phân quyền (RBAC) | Mô tả |
|---|---|---|---|
| `GET` | `/api/vehicles` | `ADMIN`, `MANAGER`, `RESIDENT` | Lấy danh sách phương tiện (BQL xem tất cả, Cư dân tự động lọc theo căn hộ mình). |
| `GET` | `/api/vehicles/:id` | `ADMIN`, `MANAGER`, `RESIDENT` | Chi tiết phương tiện kèm thẻ gửi xe, thông tin căn hộ và chủ xe. |
| `POST` | `/api/vehicles` | `ADMIN`, `MANAGER`, `RESIDENT` | Đăng ký phương tiện mới. (Cư dân luôn bắt đầu ở `PENDING_APPROVAL`). |
| `PATCH` | `/api/vehicles/:id` | `ADMIN`, `MANAGER`, `RESIDENT` | Cập nhật thông tin xe (Cư dân chỉ sửa được khi đang chờ duyệt). |
| `DELETE` | `/api/vehicles/:id` | `ADMIN`, `MANAGER`, `RESIDENT` | Xóa phương tiện (Cư dân chỉ được hủy đơn khi đang chờ duyệt). |
| `POST` | `/api/vehicles/:id/approve` | `ADMIN`, `MANAGER` | Phê duyệt hồ sơ đăng ký xe (`PENDING_APPROVAL` → `ACTIVE`). Tùy chọn cấp thẻ ngay. |
| `POST` | `/api/vehicles/:id/reject` | `ADMIN`, `MANAGER` | Từ chối hồ sơ đăng ký xe (`PENDING_APPROVAL` → `REJECTED`) kèm lý do. |
| `POST` | `/api/vehicles/:id/deactivate` | `ADMIN`, `MANAGER` | Chuyển xe sang `INACTIVE` và tự động khóa các thẻ gửi xe liên quan. |
| `POST` | `/api/vehicles/:id/parking-card` | `ADMIN`, `MANAGER` | Cấp mới thẻ từ gửi xe cho phương tiện đã `ACTIVE`. |

### 1.2 Quản Lý Thẻ Gửi Xe (Parking Cards)

| Phương thức | Endpoint | Phân quyền (RBAC) | Mô tả |
|---|---|---|---|
| `GET` | `/api/parking-cards` | `ADMIN`, `MANAGER`, `RESIDENT` | Lấy danh sách thẻ từ RFID gửi xe. |
| `GET` | `/api/parking-cards/:id` | `ADMIN`, `MANAGER`, `RESIDENT` | Chi tiết thẻ từ RFID. |
| `PATCH` | `/api/parking-cards/:id` | `ADMIN`, `MANAGER` | Chỉnh sửa hạn sử dụng thẻ (`expiresAt`). |
| `DELETE` | `/api/parking-cards/:id` | `ADMIN`, `MANAGER` | Xóa bản ghi thẻ gửi xe. |
| `POST` | `/api/parking-cards/:id/lock` | `ADMIN`, `MANAGER` | Khóa thẻ (`status: LOCKED`), lưu lý do và thời điểm khóa. |
| `POST` | `/api/parking-cards/:id/unlock` | `ADMIN`, `MANAGER` | Mở khóa thẻ (`status: ACTIVE`), kiểm tra xung đột thẻ active khác. |

---

## 2. Chi Tiết Request / Response Payloads

### 2.1 `POST /api/vehicles` — Đăng ký Phương tiện Mới

#### Request Headers:
```http
Authorization: Bearer <JWT_SESSION>
Content-Type: application/json
```

#### Request Body (Cư dân gửi đơn đăng ký):
```json
{
  "licensePlate": "30A-112.34",
  "type": "CAR",
  "brand": "Toyota",
  "model": "Corolla Cross",
  "color": "Trắng ngọc trai",
  "registrationDocumentUrl": "https://res.cloudinary.com/demo/image/upload/cavet_30a11234.jpg"
}
```
*Lưu ý an toàn: Cư dân không cần gửi `apartmentId` và `residentId`. Backend tự động truy xuất hồ sơ đã xác thực từ session để gán vào căn hộ cư dân đang ở. Nếu cư dân cố tình gửi `apartmentId` của căn hộ khác, backend sẽ từ chối ngay lập tức với mã lỗi `403 INVALID_APARTMENT`.*

#### Request Body (Ban Quản Lý tạo trực tiếp):
```json
{
  "licensePlate": "29-A1 555.99",
  "type": "MOTORBIKE",
  "brand": "Honda",
  "model": "Air Blade 160",
  "color": "Đen nhám",
  "apartmentId": "cuid_apartment_a1001",
  "residentId": "cuid_resident_an",
  "status": "ACTIVE"
}
```

#### Response Thành công (`201 Created`):
```json
{
  "success": true,
  "data": {
    "id": "cmtx0to56002kzqu167nqbqqi",
    "licensePlate": "30A-112.34",
    "type": "CAR",
    "brand": "Toyota",
    "model": "Corolla Cross",
    "color": "Trắng ngọc trai",
    "apartmentId": "cuid_apartment_a1001",
    "residentId": "cuid_resident_an",
    "status": "PENDING_APPROVAL",
    "registrationDocumentUrl": "https://res.cloudinary.com/demo/image/upload/cavet_30a11234.jpg",
    "createdAt": "2026-09-11T14:10:00.000Z",
    "updatedAt": "2026-09-11T14:10:00.000Z",
    "apartment": {
      "id": "cuid_apartment_a1001",
      "code": "A-1001",
      "building": "Tòa A (Sky)",
      "floor": 10
    },
    "resident": {
      "id": "cuid_resident_an",
      "fullName": "Nguyễn Văn An",
      "phone": "0987654321"
    },
    "parkingCards": []
  },
  "message": "Đăng ký phương tiện thành công"
}
```

---

### 2.2 `POST /api/vehicles/:id/approve` — Phê duyệt Hồ sơ & Cấp Thẻ

#### Request Body (Tùy chọn cấp thẻ ngay):
```json
{
  "cardCode": "CARD-CAR-008",
  "expiresAt": "2027-09-11T00:00:00.000Z"
}
```

#### Response Thành công (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "cmtx0to56002kzqu167nqbqqi",
    "licensePlate": "30A-112.34",
    "status": "ACTIVE",
    "parkingCards": [
      {
        "id": "cmtx0to5u002mzqu1dw1ree6n",
        "cardCode": "CARD-CAR-008",
        "status": "ACTIVE",
        "issuedAt": "2026-09-11T14:15:00.000Z",
        "expiresAt": "2027-09-11T00:00:00.000Z"
      }
    ]
  },
  "message": "Phê duyệt phương tiện thành công"
}
```

---

### 2.3 `POST /api/parking-cards/:id/lock` — Khóa Thẻ Từ

#### Request Body:
```json
{
  "lockReason": "Cư dân báo rơi mất thẻ xe tại siêu thị tầng 1"
}
```

#### Response Thành công (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "cmtx0to5u002mzqu1dw1ree6n",
    "cardCode": "CARD-CAR-008",
    "status": "LOCKED",
    "lockedAt": "2026-09-11T14:20:00.000Z",
    "lockReason": "Cư dân báo rơi mất thẻ xe tại siêu thị tầng 1"
  },
  "message": "Khóa thẻ gửi xe thành công"
}
```

---

## 3. Chuẩn Hóa Lỗi & Mã Lỗi Nghiệp Vụ (Error Handling)

Hệ thống chuẩn hóa toàn bộ mã lỗi qua đối tượng `VehicleError`, không bao giờ để lộ trực tiếp lỗi hệ thống hoặc câu truy vấn Prisma:

| Mã Lỗi (Error Code) | HTTP Status | Trường hợp phát sinh |
|---|---|---|
| `VALIDATION_ERROR` | `400` | Dữ liệu đầu vào sai định dạng Zod (biển số thiếu chữ/số, mã thẻ quá ngắn...). |
| `DUPLICATE_LICENSE_PLATE` | `400` | Biển số xe đã đăng ký trên hệ thống (đối soát cả biến thể dấu chấm, gạch ngang và dấu cách). |
| `DUPLICATE_ACTIVE_CARD` | `400` | Phương tiện đã có thẻ `ACTIVE`, không thể cấp thêm hoặc mở khóa thẻ trùng lặp. |
| `INVALID_STATUS_TRANSITION` | `400` | Chuyển đổi trạng thái sai quy trình (VD: duyệt xe đang `ACTIVE`, khóa thẻ đang `LOCKED`...). |
| `INVALID_APARTMENT` | `400` / `403` | Căn hộ không tồn tại hoặc cư dân cố tình đăng ký xe cho căn hộ của người khác. |
| `INVALID_RESIDENT` | `400` | Cư dân gán vào xe không thuộc về căn hộ chỉ định. |
| `NOT_FOUND` | `404` | Không tìm thấy xe hoặc thẻ từ với ID cung cấp. |
| `FORBIDDEN` | `403` | Cư dân cố tình truy cập xe căn hộ khác hoặc gọi các hàm của Ban Quản Lý. |
| `UNAUTHORIZED` | `401` | Người dùng chưa đăng nhập hoặc phiên JWT hết hạn. |

#### Cấu trúc Payload Lỗi Chuẩn:
```json
{
  "success": false,
  "message": "Biển số xe \"30A-999.88\" đã được đăng ký trên hệ thống",
  "errorCode": "DUPLICATE_LICENSE_PLATE",
  "error": {
    "code": "DUPLICATE_LICENSE_PLATE",
    "message": "Biển số xe \"30A-999.88\" đã được đăng ký trên hệ thống"
  }
}
```

---

## 4. Chuẩn Hóa Biển Số Xe (License Plate Normalization)

Hàm `normalizeLicensePlate` được tích hợp chặt chẽ:
```typescript
export function normalizeLicensePlate(plate: string): string {
  if (!plate) return '';
  return plate.replace(/[\s\.\-_]/g, '').toUpperCase();
}
```
**Quy tắc:**
- `30A-999.88`, `30A99988`, `30-A.999 88` đều được quy về chuỗi `30A99988`.
- Repository thực hiện đối soát `findByNormalizedPlate` trước mọi thao tác tạo mới và đổi biển số, ngăn chặn tuyệt đối tình trạng đăng ký trùng lặp vì khác ký tự phân cách.

---

## 5. Quy Tắc Bảo Mật Sở Hữu (Resource Ownership & RBAC)

1. **Kiểm soát Truy cập Căn hộ (IDOR Guard)**:
   - Sử dụng `authorizeVehicleAccess(user, vehicleApartmentId)` từ [`src/lib/authorization.ts`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/lib/authorization.ts).
   - Truy vấn database độc lập để lấy `residentId` và `apartmentId` chính chủ từ `user.id`, tuyệt đối không tin cậy query parameter hay JSON body gửi lên từ client.
2. **Quyền Hạn của Cư Dân**:
   - `GET /api/vehicles`: Chỉ trả về danh sách xe thuộc căn hộ cư dân đang cư trú.
   - `POST /api/vehicles`: Luôn gán trạng thái `PENDING_APPROVAL`, `apartmentId` và `residentId` của cư dân.
   - `PATCH /api/vehicles/:id`: Chỉ cho phép chỉnh sửa thông tin xe khi hồ sơ đang ở trạng thái `PENDING_APPROVAL`. Không được sửa biển số xe hay gán lại căn hộ.
   - `DELETE /api/vehicles/:id`: Chỉ cho phép hủy đơn khi trạng thái là `PENDING_APPROVAL`.
   - **Bị chặn hoàn toàn (403 Forbidden)** đối với: `approve`, `reject`, `deactivate`, `parking-card` (issue/lock/unlock).
