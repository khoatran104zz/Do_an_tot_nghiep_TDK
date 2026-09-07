# Kiến Trúc Lớp Vận Hành Thông Minh (Smart Operations Layer)

Tài liệu thiết kế kiến trúc và đặc tả kỹ thuật cho phân hệ **Smart Operations** (Vận hành thông minh dựa trên dữ liệu thực tế) trong Smart Apartment Management System.

---

## 1. Triết Lý Thiết Kế (Design Philosophy)

* **Nói KHÔNG với AI giả tạo (No Fake AI)**: Không chèn các cụm từ "AI dự đoán...", "AI gợi ý..." khi hệ thống không thực sự có model machine learning.
* **Vận hành dựa trên luật thông minh (Rule-based Operational Intelligence)**: Sử dụng các giải thuật toán học và bộ quy tắc nghiệp vụ chặt chẽ quét liên tục trên toàn bộ cơ sở dữ liệu quan hệ (PostgreSQL) để tự động phát hiện rủi ro, cảnh báo và điều phối công việc cho Ban Quản Lý (BQL).
* **Minh bạch & Dễ giải thích (Explainable & Deterministic)**: Mỗi cảnh báo và chỉ số insight đều gắn liền với nguyên nhân cụ thể, số liệu thực và dẫn link trực tiếp tới đối tượng nghiệp vụ tương ứng (`actionUrl`).
* **Sẵn sàng mở rộng (ML/AI Ready)**: Tách lớp dịch vụ rõ ràng (`SmartAlertService`, `SmartInsightService`), sau này có thể cắm thêm các model hồi quy dự báo phụ tải điện nước hoặc phát hiện gian lận mà không phá vỡ kiến trúc hiện tại.

---

## 2. Hệ Thống Cảnh Báo Thông Minh (Smart Alerts)

Hệ thống tự động rà soát cơ sở dữ liệu theo 3 nhóm đối tượng trọng yếu:

### 2.1. Quản lý Hợp Đồng (Contract Alerts)
| Loại cảnh báo | Điều kiện kích hoạt | Mức độ nghiêm trọng | Hành động điều phối |
| :--- | :--- | :--- | :--- |
| `CONTRACT_EXPIRED` | `status = 'ACTIVE'` và `endDate < now` | 🔴 **CRITICAL** | Thông báo hợp đồng đã quá hạn nhưng chưa thanh lý. |
| `CONTRACT_EXPIRING_CRITICAL` | `status = 'ACTIVE'` và `endDate <= now + 7 ngày` | 🔴 **CRITICAL** | Đáo hạn gấp trong 7 ngày, cần liên hệ cư dân chốt gia hạn ngay. |
| `CONTRACT_EXPIRING_SOON` | `status = 'ACTIVE'` và `endDate <= now + 30 ngày` | 🟠 **WARNING** | Sắp hết hạn trong tháng, chuẩn bị hồ sơ gia hạn. |

### 2.2. Quản lý Thu Phí & Hóa Đơn (Invoice Alerts)
| Loại cảnh báo | Điều kiện kích hoạt | Mức độ nghiêm trọng | Hành động điều phối |
| :--- | :--- | :--- | :--- |
| `INVOICE_OVERDUE_CHRONIC` | Chưa thanh toán và trễ hạn `> 15 ngày` | 🔴 **CRITICAL** | Nợ đọng kéo dài, cần gửi thông báo nhắc phí lần 2/3 hoặc tạm dừng dịch vụ. |
| `INVOICE_OVERDUE` | `dueDate < now` và chưa thanh toán | 🟠 **WARNING** | Hóa đơn quá hạn nộp phí sinh hoạt hàng tháng. |
| `INVOICE_HIGH_DEBT` | Hóa đơn có giá trị `≥ 5.000.000 VNĐ` | 🟠 **WARNING** | Công nợ phát sinh lớn cần bám sát thu hồi. |

### 2.3. Quản lý Sự Cố Kỹ Thuật & SLA (Ticket Alerts)
| Loại cảnh báo | Điều kiện kích hoạt | Mức độ nghiêm trọng | Hành động điều phối |
| :--- | :--- | :--- | :--- |
| `TICKET_SLA_BREACHED` | `status in [NEW, ASSIGNED, PROCESSING]` và `slaDueAt < now` | 🔴 **CRITICAL** | Quá hạn cam kết xử lý kỹ thuật (SLA), cần can thiệp gấp. |
| `TICKET_SLA_APPROACHING` | Còn `≤ 4 giờ` trước khi hết hạn SLA | 🟠 **WARNING** | Sắp chạm mốc SLA, đôn đốc kỹ thuật viên hoàn tất. |
| `TICKET_CRITICAL_PENDING` | Mức ưu tiên `URGENT/CRITICAL` và còn ở trạng thái `NEW` | 🔴 **CRITICAL** | Sự cố khẩn cấp cấp độ 1 chưa được phân công người xử lý. |

---

## 3. Khối "5 Việc Cần Chú Ý Hôm Nay" (Smart Dashboard Queue)

* **Vị trí**: Nằm ngay đầu Management Operations Dashboard, dưới lời chào bối cảnh.
* **Nguyên tắc ưu tiên (Priority Queue)**:
  1. Xếp toàn bộ cảnh báo `CRITICAL` lên hàng đầu.
  2. Kế tiếp là các cảnh báo `WARNING`.
  3. Cuối cùng là các thông tin `INFO`.
  4. Lấy ra **Top 5 việc khẩn cấp nhất** để Ban Quản Lý giải quyết đầu ngày làm việc.
* **Tương tác 1-Click**: Khi nhấp chuột vào bất kỳ thẻ việc nào, giao diện tự động điều hướng trực tiếp (`actionUrl`) tới trang chi tiết hóa đơn, sự cố hoặc hợp đồng cần xử lý.

---

## 4. Các Chỉ Số Vận Hành Thông Minh (Operational Insights)

### 4.1. Collection Insight (Hiệu quả thu phí)
* **Công thức**:
  $$\text{Collection Rate} = \frac{\text{Số hóa đơn đã thanh toán}}{\text{Tổng số hóa đơn phát hành trong tháng}} \times 100\%$$
* So sánh động với tháng trước ($\pm \Delta\%$) để đánh giá tốc độ thu hồi dòng tiền.
* Hiển thị thanh tiến trình trực quan theo số tiền thực thu vs tổng tiền phát hành.

### 4.2. Occupancy Insight (Tỷ lệ lấp đầy & mặt bằng)
* Phân rã 3 nhóm:
  * **Đang ở (Occupied)**: Số căn có cư dân thường trú hoặc đang thuê.
  * **Đang trống (Vacant)**: Sẵn sàng cho thuê hoặc bán mới.
  * **Đang bảo dưỡng (Maintenance)**: Đang sửa chữa bàn giao.
* Vẽ biểu đồ xu hướng lấp đầy qua các tháng gần nhất.

### 4.3. Ticket Insight (Hiệu suất kỹ thuật & Hài lòng cư dân)
* **Average Resolution Time**: Thời gian trung bình từ khi cư dân gửi báo hỏng đến lúc kỹ thuật viên hoàn tất sửa chữa (Ví dụ: `18.4 giờ`).
* **SLA On-track Rate**: Tỷ lệ phần trăm sự cố được khắc phục đúng thời hạn cam kết.
* **Average Resident Rating**: Điểm đánh giá trung bình từ cư dân (Ví dụ: `4.8 / 5 ⭐`).

### 4.4. Live Management Insights Feed
Bộ sinh khuyến nghị thông minh phía Backend trả về mảng `insights[]`:
```json
{
  "id": "insight_coll_good",
  "type": "COLLECTION_RATE",
  "severity": "INFO",
  "title": "Hiệu quả thu phí tích cực",
  "message": "Tỷ lệ thu phí tháng này đạt 92.5% (+4.2%). Đã thu được 185.0M VNĐ.",
  "actionUrl": "/invoices",
  "metric": "92.5%"
}
```
Giao diện frontend chỉ việc render card, không cài cắm bất kỳ logic tính toán phức tạp nào trên UI.

---

## 5. Kiến Trúc Backend & Chiến Lược Caching

* **Dịch vụ cốt lõi**:
  * [`smart-alert.service.ts`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/modules/smart-operations/smart-alert.service.ts)
  * [`smart-insight.service.ts`](file:///c:/Users/rosek/OneDrive/Documents/DATN_1/src/modules/smart-operations/smart-insight.service.ts)
* **Chiến lược Caching (In-memory TTL 30s)**:
  * Để tránh việc mỗi request lại quét toàn bộ bảng hợp đồng, hóa đơn và sự cố, backend lưu snapshot kết quả trong bộ nhớ với thời gian sống 30 giây.
  * Khi có yêu cầu làm mới tức thời (`refresh=true` hoặc mutation), cache được tự động làm mới.
* **Danh mục API Endpoints**:
  * `GET /api/alerts`: Trả về danh sách cảnh báo, đếm phân loại và Top 5 việc hôm nay.
  * `GET /api/alerts/insights`: Trả về số liệu Collection, Occupancy, Ticket và Insights feed.

---

## 6. Kiểm Thử Tự Động (Automated Test Suite)

Chạy bộ test tự động xác thực luật cảnh báo và tính toán số liệu:
```bash
npm run test:smart
```
Kết quả: **11/11 PASS (100%)** bao gồm các quy tắc hợp đồng hết hạn, hóa đơn nợ đọng, sự cố chạm mốc SLA và hàng đợi ưu tiên Top 5.
Chạy toàn bộ test hệ thống: `npm test` (**33/33 PASS**).
