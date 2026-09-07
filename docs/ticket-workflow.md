# Maintenance Management Workflow & State Machine Architecture

Tài liệu thiết kế kiến trúc và thông số kỹ thuật cho hệ thống **Maintenance Management Workflow** (Quản lý và giải quyết sự cố kỹ thuật tòa nhà) của dự án Smart Apartment Management System.

---

## 1. Mô Hình State Machine (FSM)

Vòng đời của một phiếu yêu cầu bảo trì / sự cố kỹ thuật tuân thủ nghiêm ngặt mô hình Finite State Machine:

```
                  ┌──────────────┐
                  │     NEW      │
                  │ (Tiếp nhận)  │
                  └──────┬───────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
 [Assign Staff]                 [Reject with reason]
        │                                 │
        ▼                                 ▼
 ┌──────────────┐                  ┌──────────────┐
 │   ASSIGNED   │                  │   REJECTED   │
 │ (Đã phân công)│                 │  (Từ chối)   │
 └──────┬───────┘                  └──────────────┘
        │
 [Start Work]
        │
        ▼
 ┌──────────────┐
 │  PROCESSING  │
 │(Đang sửa chữa)│
 └──────┬───────┘
        │
[Submit Resolution]
        │
        ▼
 ┌──────────────┐
 │   RESOLVED   │
 │ (Đã xử lý)   │
 └──────┬───────┘
        │
[Rate / Close]
        │
        ▼
 ┌──────────────┐
 │    CLOSED    │
 │  (Đã đóng)   │
 └──────────────┘
```

### 1.1. Bảng Quy Tắc Chuyển Đổi Trạng Thái & Phân Quyền
| Trạng thái hiện tại | Trạng thái tiếp theo | Thao tác (Action) | Quyền hạn (Role) | Ràng buộc nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- |
| `NEW` | `ASSIGNED` | `ASSIGN` | ADMIN, MANAGER | Phải chọn kỹ thuật viên phụ trách (`staffId`). |
| `NEW` | `REJECTED` | `REJECT` | ADMIN, MANAGER | Bắt buộc nhập lý do từ chối (`reason` ≥ 5 ký tự). |
| `ASSIGNED` | `PROCESSING` | `START_PROCESSING` | ADMIN, MANAGER, ASSIGNED STAFF | Kỹ thuật viên tiếp nhận xử lý tại hiện trường. |
| `PROCESSING` | `RESOLVED` | `RESOLVE` | ADMIN, MANAGER, ASSIGNED STAFF | Bắt buộc nhập mô tả kết quả sửa chữa (`resolutionNote` ≥ 5 ký tự). |
| `RESOLVED` | `CLOSED` | `CLOSE` hoặc `RATE` | RESIDENT, MANAGER, ADMIN | Cư dân đánh giá nghiệm thu (1-5 sao) hoặc BQL xác nhận đóng phiếu. |

> [!IMPORTANT]
> Backend `TicketWorkflowService.validateTransition` sẽ chặn và trả về lỗi `400` cho mọi hành vi chuyển trạng thái trái phép hoặc nhảy cóc (ví dụ: từ `NEW` nhảy thẳng sang `RESOLVED` hoặc `CLOSED`).

---

## 2. Cam Kết Chất Lượng Dịch Vụ (SLA Management)

### 2.1. Quy chuẩn thời gian theo Mức Độ Ưu Tiên
* **LOW (Ưu tiên Thấp)**: 72 giờ
* **MEDIUM (Bình thường)**: 48 giờ
* **HIGH (Ưu tiên Cao)**: 24 giờ
* **URGENT / CRITICAL (Khẩn cấp)**: 4 giờ

### 2.2. Cơ Chế Tính Toán Phía Backend
* Khi tạo ticket, `slaDueAt` được tính:
  $$\text{slaDueAt} = \text{createdAt} + \text{SLA\_HOURS}[\text{priority}]$$
* Khi BQL thay đổi độ ưu tiên (`changePriority`), hệ thống tự động tính lại `slaDueAt` mới và lưu vết vào Audit History.
* Trạng thái SLA thời gian thực (`slaStatus`):
  * 🟢 **ON_TRACK (Đúng cam kết)**: Quỹ thời gian còn > 25% tổng thời hạn và > 4 giờ.
  * 🟡 **APPROACHING (Sắp đến hạn)**: Quỹ thời gian còn ≤ 25% hoặc còn dưới 4 giờ.
  * 🔴 **OVERDUE (Quá hạn SLA)**: Thời gian hiện tại đã vượt quá `slaDueAt` mà ticket chưa đạt trạng thái `RESOLVED` hoặc `CLOSED`.
* **Frontend tuân thủ nguyên tắc**: Không tự ý tính toán SLA mà trực tiếp hiển thị huy hiệu `SLAIndicator` từ dữ liệu backend.

---

## 3. Quản Lý Phân Công & Ghi Chú Nội Bộ (Internal Notes)

### 3.1. Phân quyền Ban Quản Lý (Management)
* Chỉ định kỹ thuật viên phụ trách từ danh sách nhân sự nội bộ (`GET /api/staff`).
* Thay đổi danh mục sự cố (`changeCategory`) và mức độ ưu tiên (`changePriority`).
* Thêm ghi chú nội bộ (`internalNote` và `TicketComment.isInternal = true`).

### 3.2. Bảo mật quyền riêng tư cho Cư Dân (Resident Privacy)
* Khi Cư dân truy cập chi tiết sự cố (`GET /api/feedbacks/[id]`), `TicketWorkflowService.getTicketDetail` tự động:
  * Loại bỏ trường `internalNote` (`visibleInternalNote = null`).
  * Lọc sạch toàn bộ comment có `isInternal === true`.
* Cư dân chỉ nhìn thấy các tin nhắn trao đổi công khai và thông tin báo cáo giải quyết chính thức.

---

## 4. Dòng Thời Gian Xử Lý (Audit History Timeline)

Mỗi lần trạng thái thay đổi, một bản ghi `TicketStatusHistory` được lưu trữ bất biến:
* `feedbackId`: Khóa ngoại trỏ đến sự cố.
* `fromStatus`: Trạng thái trước khi chuyển.
* `toStatus`: Trạng thái sau khi chuyển.
* `changedById`: Người thực hiện (kèm quan hệ Role và Họ tên).
* `changedAt`: Mốc thời gian chính xác.
* `note`: Ghi chú mô tả hành động (Ai phân công cho ai, phương án xử lý, lý do từ chối...).

Component `TicketTimeline` trực quan hóa toàn bộ chuỗi sự kiện này theo thứ tự thời gian tăng dần, kết thúc bằng cột mốc Cư dân nghiệm thu đánh giá sao.

---

## 5. Kiến Trúc Sự Kiện Thông Báo (Notification Events)

Hệ thống cung cấp service abstraction `ticketNotificationService` kích hoạt tự động theo 5 sự kiện:

| Sự kiện | Đối tượng nhận | Nội dung thông báo |
| :--- | :--- | :--- |
| **Ticket created** | MANAGER / ADMIN | Thông báo phòng và tiêu đề sự cố mới cần điều phối. |
| **Ticket assigned** | ASSIGNED STAFF | Thông báo cho kỹ thuật viên về sự cố mới được giao. |
| **Ticket resolved** | RESIDENT | Báo tin cho căn hộ sự cố đã khắc phục, mời nghiệm thu. |
| **Ticket rejected** | RESIDENT | Báo tin kèm lý do không tiếp nhận sự cố. |
| **Rating submitted** | MANAGER / ADMIN | Báo cáo số sao đánh giá (1-5⭐) và ý kiến của cư dân. |

---

## 6. Danh Mục API Endpoint Bổ Sung

* `GET /api/feedbacks/[id]`: Trả về chi tiết ticket, tiến trình, SLA và trao đổi (đã lọc quyền riêng tư theo vai trò người gọi).
* `POST /api/feedbacks/[id]/workflow`: Tiếp nhận các thao tác:
  * `{ action: "ASSIGN", payload: { staffId, internalNote } }`
  * `{ action: "START_PROCESSING" }`
  * `{ action: "RESOLVE", payload: { resolutionNote } }`
  * `{ action: "REJECT", payload: { reason } }`
  * `{ action: "CLOSE" }`
  * `{ action: "PRIORITY", payload: { priority } }`
  * `{ action: "CATEGORY", payload: { category } }`
* `POST /api/feedbacks/[id]/comments`: Gửi trao đổi tin nhắn hoặc ghi chú nội bộ.
* `POST /api/feedbacks/[id]/rate`: Cư dân gửi đánh giá sao và nghiệm thu đóng ticket.
* `GET /api/staff`: Lấy danh sách nhân viên kỹ thuật & quản lý sẵn sàng phân công.

---

## 7. Kiểm Thử Tự Động (Automated Test Suite)

Chạy bộ kiểm thử tự động xác thực:
```bash
npm run test:workflow
```
Kết quả: **12/12 PASS** bao gồm kiểm thử Finite State Machine, thuật toán SLA, quyền hạn vai trò và tính toàn vẹn dữ liệu.
