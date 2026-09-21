import { SafeResidentContext } from './ai-safe-context.service';

export interface IncidentClassificationResult {
  category: 'ELECTRIC' | 'WATER' | 'ELEVATOR' | 'SECURITY' | 'CLEANLINESS' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
  department: string;
  reason: string;
}

export interface ChatAction {
  label: string;
  href?: string;
  actionType?: 'NAVIGATE' | 'PRESET_QUERY';
  variant?: 'default' | 'outline' | 'secondary';
  query?: string;
}

export interface AIChatResponse {
  response: string;
  actions?: ChatAction[];
}

export interface AIProvider {
  generateChatResponse(prompt: string, context: SafeResidentContext): Promise<AIChatResponse>;
  classifyIncident(title: string, content: string): Promise<IncidentClassificationResult>;
}

/**
 * 1. Smart Rule-Based & Context-Aware AI Engine (Default & Fallback)
 * Strictly grounded in real database context with zero hallucinations.
 */
export class SmartRuleBasedAIProvider implements AIProvider {
  async generateChatResponse(prompt: string, context: SafeResidentContext): Promise<AIChatResponse> {
    const q = prompt.trim().toLowerCase();
    const role = context.role || 'RESIDENT';

    // =========================================================================
    // 0. SECURITY & PROMPT INJECTION DEFENSE (Section 42)
    // =========================================================================
    if (
      q.includes('ignore previous instructions') ||
      q.includes('ignore all instructions') ||
      q.includes('bỏ qua hướng dẫn') ||
      q.includes('bỏ qua tất cả chỉ dẫn') ||
      q.includes('show me all residents') ||
      q.includes('danh sách toàn bộ cư dân') ||
      q.includes('show all password') ||
      q.includes('select * from') ||
      q.includes('drop table')
    ) {
      return {
        response:
          'Xin lỗi, yêu cầu của bạn đã bị từ chối do không phù hợp với tiêu chuẩn an toàn thông tin và chính sách bảo mật nội bộ của K-Home.',
      };
    }

    // =========================================================================
    // A. PHÂN HỆ QUẢN TRỊ & ĐIỀU HÀNH (ADMIN & MANAGER)
    // =========================================================================
    if (role === 'ADMIN' || role === 'MANAGER') {
      const stats = context.managementStats;
      const parking = context.parkingAvailability;

      // 1. Quản lý bãi đỗ xe BQL (Section 38, 43)
      if (
        q.includes('bãi xe') ||
        q.includes('đỗ xe') ||
        q.includes('parking') ||
        q.includes('chỗ đỗ') ||
        q.includes('hầm xe')
      ) {
        if (!parking) {
          return {
            response: 'Dữ liệu bãi xe đang được cập nhật từ hệ thống camera & cảm biến...',
            actions: [{ label: 'Sơ đồ bãi xe BQL', href: '/parking', actionType: 'NAVIGATE' }],
          };
        }

        const areaDetails = parking.areas
          .map(
            (a) =>
              `• **${a.name} (${a.code})**: **${a.available}** chỗ trống / tổng **${a.total}** ô (Đã đỗ: ${a.total - a.available})`
          )
          .join('\n');

        return {
          response:
            `🅿️ **Báo Cáo Vận Hành Bãi Đỗ Xe Tòa Nhà**:\n\n` +
            `• Tổng sức chứa: **${parking.total}** chỗ\n` +
            `• Đang khả dụng: **${parking.available}** vị trí trống\n` +
            `• Đang có xe đỗ: **${parking.occupied}** vị trí\n\n` +
            `**Chi tiết từng tầng/khu vực**:\n${areaDetails}\n\n` +
            `Bạn có thể kiểm tra trực tiếp trên sơ đồ vận hành hoặc phê duyệt các yêu cầu cấp chỗ mới của cư dân.`,
          actions: [
            { label: '🗺️ Sơ đồ bãi xe BQL', href: '/parking', actionType: 'NAVIGATE' },
            { label: '📋 Duyệt đơn đăng ký', href: '/parking', actionType: 'NAVIGATE' },
            { label: '🪪 Thẻ xe & RFID', href: '/parking-cards', actionType: 'NAVIGATE' },
          ],
        };
      }

      // 2. Tổng quan vận hành / Tình hình tòa nhà
      if (
        q.includes('tổng quan') ||
        q.includes('tình hình') ||
        q.includes('vận hành') ||
        q.includes('báo cáo') ||
        q.includes('toàn cảnh') ||
        q.includes('hôm nay')
      ) {
        if (!stats) return { response: 'Hệ thống đang đồng bộ dữ liệu quản trị, vui lòng thử lại sau giây lát.' };
        return {
          response:
            `📊 **Báo cáo Tổng quan Vận hành K-Home**:\n\n` +
            `• **Căn hộ & Cư dân**: **${stats.occupiedApartments}/${stats.totalApartments}** căn đã có cư dân sinh sống (Tỷ lệ lấp đầy: **${stats.occupancyRate}%**)\n` +
            `• **Tài chính & Thu phí**: Còn **${stats.unpaidInvoicesCount}** hóa đơn chưa thanh toán (Tổng công nợ: **${stats.unpaidInvoicesAmount.toLocaleString('vi-VN')} đ**)\n` +
            `• **Bảo trì & Sự cố**: **${stats.openTicketsCount}** phiếu sự cố đang trong trạng thái xử lý\n` +
            `• **Bãi đỗ xe**: **${parking?.available ?? 0}/${parking?.total ?? 0}** vị trí khả dụng\n` +
            `• **An toàn & IoT**: **${stats.criticalAlertsCount}** cảnh báo cảm biến cần giám sát`,
          actions: [
            { label: '📊 Dashboard điều hành', href: '/dashboard', actionType: 'NAVIGATE' },
            { label: '🧾 Quản lý hóa đơn', href: '/invoices', actionType: 'NAVIGATE' },
            { label: '🛠️ Danh sách sự cố', href: '/feedbacks', actionType: 'NAVIGATE' },
          ],
        };
      }

      // 3. Tra cứu công nợ & hóa đơn chưa thu
      if (
        q.includes('công nợ') ||
        q.includes('chưa thu') ||
        q.includes('doanh thu') ||
        q.includes('hóa đơn') ||
        q.includes('tiền')
      ) {
        if (!stats) return { response: 'Không có dữ liệu công nợ khả dụng.' };
        return {
          response:
            `💰 **Tình hình Công nợ & Hóa đơn K-Home**:\n\n` +
            `• Số hóa đơn chưa thanh toán / quá hạn: **${stats.unpaidInvoicesCount}** hóa đơn\n` +
            `• Tổng số tiền cần thu: **${stats.unpaidInvoicesAmount.toLocaleString('vi-VN')} đ**\n\n` +
            `👉 Bạn có thể quản lý, gửi thông báo nhắc nhở hoặc gạch nợ thủ công tại phân hệ Hóa đơn.`,
          actions: [
            { label: '🧾 Quản lý hóa đơn', href: '/invoices', actionType: 'NAVIGATE' },
            { label: '📊 Báo cáo tài chính', href: '/reports', actionType: 'NAVIGATE' },
          ],
        };
      }

      // 4. Tra cứu sự cố kỹ thuật & bảo trì
      if (
        q.includes('sự cố') ||
        q.includes('phản ánh') ||
        q.includes('kỹ thuật') ||
        q.includes('bảo trì') ||
        q.includes('hỏng')
      ) {
        if (!stats) return { response: 'Không có dữ liệu sự cố khả dụng.' };
        return {
          response:
            `🛠️ **Tình trạng Sự cố Kỹ thuật Tòa nhà**:\n\n` +
            `• Hiện có **${stats.openTicketsCount}** phiếu phản ánh / sự cố đang chờ hoặc đang được đội kỹ thuật xử lý.\n` +
            `• Vui lòng theo dõi tiến độ SLA và phân công kỹ thuật viên kịp thời.`,
          actions: [{ label: '🛠️ Quản lý sự cố', href: '/feedbacks', actionType: 'NAVIGATE' }],
        };
      }

      // Default Admin / Manager response
      return {
        response:
          `Chào bạn! Tôi là **Trợ Lý Quản Trị K-Home AI** 🏢\n\n` +
          `Tôi có thể hỗ trợ nhanh các thông tin điều hành:\n` +
          `1. **Bãi đỗ xe**: Tình trạng chỗ trống, công suất, duyệt đơn đăng ký.\n` +
          `2. **Tài chính**: Công nợ toàn tòa nhà, số hóa đơn chưa thu.\n` +
          `3. **Bảo trì & Sự cố**: Các phiếu sự cố mở, phân công kỹ thuật.\n` +
          `4. **Giám sát IoT**: Cảnh báo rò rỉ nước, khói nhiệt thời gian thực.`,
        actions: [
          { label: '🅿️ Bãi đỗ xe', href: '/parking', actionType: 'NAVIGATE' },
          { label: '🧾 Hóa đơn', href: '/invoices', actionType: 'NAVIGATE' },
          { label: '🛠️ Sự cố', href: '/feedbacks', actionType: 'NAVIGATE' },
          { label: '📊 Tổng quan', href: '/dashboard', actionType: 'NAVIGATE' },
        ],
      };
    }

    // =========================================================================
    // B. PHÂN HỆ KỸ THUẬT VIÊN (STAFF_TECHNICIAN)
    // =========================================================================
    if (role === 'STAFF_TECHNICIAN') {
      const stats = context.technicianStats;
      if (q.includes('sự cố') || q.includes('phiếu') || q.includes('sửa chữa')) {
        return {
          response:
            `🔧 **Nhiệm vụ Kỹ thuật Hôm nay**:\n\n` +
            `• Hiện có **${stats?.openTicketsCount || 0}** sự cố đang chờ xử lý trong tòa nhà.\n` +
            `• Bạn hãy kiểm tra chi tiết phân công và cập nhật vật tư tại mục Bảo trì & Sự cố.`,
          actions: [{ label: '🛠️ Xem phiếu sự cố', href: '/feedbacks', actionType: 'NAVIGATE' }],
        };
      }

      if (q.includes('bảo trì') || q.includes('lịch') || q.includes('thiết bị')) {
        return {
          response:
            `📋 **Lịch Bảo trì Thiết bị Định kỳ**:\n\n` +
            `• Hiện có **${stats?.pendingMaintenanceCount || 0}** lịch bảo dưỡng định kỳ đang chờ thực hiện.\n` +
            `• Hãy kiểm tra tình trạng máy bơm, thang máy và hệ thống chiếu sáng.`,
          actions: [{ label: '📋 Lịch bảo trì', href: '/maintenance-schedules', actionType: 'NAVIGATE' }],
        };
      }

      return {
        response:
          `Chào anh/chị kỹ thuật viên! Tôi là **Trợ Lý Kỹ Thuật K-Home AI** 🔧\n\n` +
          `Tôi có thể hỗ trợ bạn theo dõi các phiếu sự cố đang mở, lịch bảo trì thiết bị và kiểm tra cảm biến IoT.`,
        actions: [
          { label: '🛠️ Phiếu sự cố', href: '/feedbacks', actionType: 'NAVIGATE' },
          { label: '📋 Lịch bảo trì', href: '/maintenance-schedules', actionType: 'NAVIGATE' },
        ],
      };
    }

    // =========================================================================
    // C. PHÂN HỆ CƯ DÂN (RESIDENT) - GROUNDED & ACTIONABLE
    // =========================================================================

    // 1. USE CASE: "Bãi xe còn chỗ không?" / Tình trạng bãi đỗ xe (Section 20, 25, 26, 38)
    if (
      q.includes('bãi xe') ||
      q.includes('chỗ đỗ') ||
      q.includes('đỗ xe') ||
      q.includes('còn chỗ không') ||
      q.includes('chỗ trống') ||
      q.includes('gửi xe') ||
      q.includes('hầm b1') ||
      q.includes('hầm b2')
    ) {
      const parking = context.parkingAvailability;

      // Sub-case: "Tôi đang đỗ xe ở đâu?" / Vị trí đỗ của tôi
      if (q.includes('ở đâu') || q.includes('của tôi') || q.includes('xe tôi') || q.includes('vị trí')) {
        const assignments = context.myParkingAssignments || [];
        if (assignments.length > 0) {
          const details = assignments
            .map(
              (a) =>
                `• **Vị trí**: **${a.slotCode}** (${a.areaName} • Tầng ${a.floor < 0 ? `Hầm ${Math.abs(a.floor)}` : a.floor})\n` +
                `  - Phương tiện: **${a.licensePlate}** (${a.vehicleBrand} ${a.vehicleModel || ''})\n` +
                `  - Hiệu lực: ${new Date(a.startDate).toLocaleDateString('vi-VN')}`
            )
            .join('\n\n');

          return {
            response:
              `Chào bạn! Bạn hiện đang có **${assignments.length}** chỗ đỗ xe đang hoạt động tại K-Home:\n\n` +
              `${details}\n\n` +
              `Bạn có thể xem vị trí trực tiếp trên sơ đồ hoặc quản lý thẻ xe tại mục Bãi đỗ xe.`,
            actions: [
              { label: '🗺️ Xem sơ đồ bãi xe', href: '/resident/parking', actionType: 'NAVIGATE' },
              { label: '🪪 Thẻ đỗ xe của tôi', href: '/resident/parking', actionType: 'NAVIGATE' },
            ],
          };
        } else {
          return {
            response:
              `Chào bạn! Hiện tại căn hộ **${context.apartmentCode || ''}** của bạn chưa có chỗ đỗ xe nào được cấp phát trong hệ thống.\n\n` +
              `Bạn có thể mở sơ đồ bãi xe để chọn vị trí còn trống và gửi đơn đăng ký cho Ban Quản Lý.`,
            actions: [
              { label: '🗺️ Xem sơ đồ chỗ trống', href: '/resident/parking', actionType: 'NAVIGATE' },
              { label: '🚗 Phương tiện của tôi', href: '/resident/vehicles', actionType: 'NAVIGATE' },
            ],
          };
        }
      }

      // Sub-case: "Đăng ký chỗ đỗ như thế nào?"
      if (q.includes('đăng ký') || q.includes('như thế nào') || q.includes('thủ tục') || q.includes('quy trình')) {
        return {
          response:
            `📝 **Quy trình đăng ký cấp chỗ đỗ xe tại K-Home**:\n\n` +
            `1. **Khai báo phương tiện**: Vào mục **Phương tiện** để đăng ký biển số và tải ảnh giấy tờ xe.\n` +
            `2. **Chọn ô đỗ khả dụng**: Truy cập **Sơ đồ bãi xe**, nhấp vào vị trí màu xanh đang còn trống.\n` +
            `3. **Gửi đơn đăng ký**: Điền thời gian hiệu lực và gửi yêu cầu. Ban Quản Lý sẽ xem xét và phê duyệt trong vòng 24 giờ.`,
          actions: [
            { label: '🚗 Khai báo phương tiện', href: '/resident/vehicles', actionType: 'NAVIGATE' },
            { label: '🗺️ Mở sơ đồ chọn chỗ', href: '/resident/parking', actionType: 'NAVIGATE' },
          ],
        };
      }

      // Default parking availability answer with real database data
      if (parking && parking.areas.length > 0) {
        const areaDetails = parking.areas
          .map((a) => `• **${a.name} (${a.code})**: **${a.available}** chỗ trống`)
          .join('\n');

        return {
          response:
            `🚗 **Tình trạng chỗ đỗ xe K-Home thời gian thực**:\n\n` +
            `${areaDetails}\n\n` +
            `Tổng cộng hiện còn **${parking.available}** vị trí khả dụng trên toàn bộ bãi đỗ.\n\n` +
            `Bạn có thể nhấp vào nút bên dưới để xem sơ đồ chi tiết hoặc gửi đơn đăng ký chỗ đỗ.`,
          actions: [
            { label: '🗺️ Xem sơ đồ bãi xe', href: '/resident/parking', actionType: 'NAVIGATE' },
            { label: '✍️ Đăng ký chỗ đỗ', href: '/resident/parking', actionType: 'NAVIGATE' },
          ],
        };
      } else {
        return {
          response:
            `Hiện tại dữ liệu bãi đỗ xe đang được cập nhật. Bạn vui lòng truy cập trực tiếp mục Bãi đỗ xe để xem sơ đồ trực quan.`,
          actions: [{ label: '🗺️ Xem sơ đồ bãi xe', href: '/resident/parking', actionType: 'NAVIGATE' }],
        };
      }
    }

    // 2. USE CASE: "Xe của tôi" / Phương tiện & Thẻ từ
    if (q.includes('xe của tôi') || q.includes('phương tiện') || q.includes('thẻ xe') || q.includes('thẻ từ')) {
      const vehicles = context.myVehicles || [];
      if (vehicles.length > 0) {
        const list = vehicles
          .map(
            (v) =>
              `• Biển số **${v.licensePlate}** (${v.brand} ${v.model || ''} - ${v.type === 'CAR' ? 'Ô tô' : 'Xe máy'})\n` +
              `  - Trạng thái xe: **${v.status === 'ACTIVE' ? 'Đã duyệt' : 'Chờ duyệt'}**\n` +
              `  - Thẻ RFID: **${v.cardCode ? `${v.cardCode} (${v.cardStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'})` : 'Chưa cấp thẻ'}**`
          )
          .join('\n\n');

        return {
          response:
            `🚗 **Danh sách phương tiện của bạn đã đăng ký**:\n\n` +
            `${list}\n\n` +
            `Bạn có thể cập nhật thông tin xe hoặc đăng ký thêm xe mới tại mục Phương tiện.`,
          actions: [
            { label: '🚗 Quản lý phương tiện', href: '/resident/vehicles', actionType: 'NAVIGATE' },
            { label: '🅿️ Bãi đỗ xe', href: '/resident/parking', actionType: 'NAVIGATE' },
          ],
        };
      } else {
        return {
          response:
            `Bạn hiện chưa đăng ký phương tiện nào với Ban Quản Lý.\n\n` +
            `Vui lòng vào mục **Phương tiện** để khai báo biển số xe trước khi đăng ký cấp chỗ đỗ.`,
          actions: [{ label: '🚗 Đăng ký xe mới', href: '/resident/vehicles', actionType: 'NAVIGATE' }],
        };
      }
    }

    // 3. USE CASE: "Hóa đơn tháng này bao nhiêu?" / Công nợ & Thanh toán (Section 20)
    if (
      q.includes('hóa đơn') ||
      q.includes('tiền điện') ||
      q.includes('tiền nước') ||
      q.includes('tiền phí') ||
      q.includes('phải đóng') ||
      q.includes('thanh toán') ||
      q.includes('cần đóng') ||
      q.includes('nợ') ||
      q.includes('bao nhiêu tiền')
    ) {
      if (!context.hasApartment) {
        return {
          response:
            'Tài khoản của bạn chưa được liên kết với căn hộ cụ thể trong hệ thống. Vui lòng liên hệ Ban Quản Lý để được cập nhật thông tin căn hộ.',
        };
      }

      const unpaidTotal = context.currentMonthInvoices?.reduce((sum: number, i: any) => sum + i.totalAmount, 0) || 0;
      const formattedTotal = unpaidTotal.toLocaleString('vi-VN') + ' đ';

      if (context.currentMonthInvoices && context.currentMonthInvoices.length > 0) {
        const details = context.currentMonthInvoices
          .map(
            (i: any) =>
              `- Hóa đơn **${i.code}**: **${i.totalAmount.toLocaleString('vi-VN')} đ** (Hạn nộp: ${new Date(
                i.dueDate
              ).toLocaleDateString('vi-VN')})`
          )
          .join('\n');

        return {
          response:
            `Chào bạn! Căn hộ **${context.apartmentCode}** có tổng số tiền cần thanh toán tháng này là **${formattedTotal}**:\n\n` +
            `${details}\n\n` +
            `Bạn có thể thanh toán trực tuyến nhanh chóng qua VNPay/MoMo/Chuyển khoản.`,
          actions: [{ label: '💳 Xem & Thanh toán ngay', href: '/resident/invoices', actionType: 'NAVIGATE' }],
        };
      } else {
        return {
          response:
            `Chào bạn! Căn hộ **${context.apartmentCode}** hiện không có hóa đơn nào cần thanh toán trong tháng này. Bạn đã hoàn tất mọi khoản phí sinh hoạt! 🎉`,
          actions: [{ label: '🧾 Lịch sử hóa đơn', href: '/resident/invoices', actionType: 'NAVIGATE' }],
        };
      }
    }

    // 4. USE CASE: Hóa đơn quá hạn
    if (q.includes('quá hạn') || q.includes('trễ hạn') || q.includes('chậm nộp')) {
      if (!context.hasApartment) {
        return { response: 'Tài khoản của bạn chưa liên kết căn hộ.' };
      }

      const overdue = context.overdueInvoices || [];
      if (overdue.length === 0) {
        return {
          response:
            `Tuyệt vời! Căn hộ **${context.apartmentCode}** của bạn không có hóa đơn nào bị quá hạn thanh toán. Cảm ơn bạn đã luôn đóng phí đúng hạn! 👍`,
          actions: [{ label: '🧾 Xem hóa đơn', href: '/resident/invoices', actionType: 'NAVIGATE' }],
        };
      }

      const totalOverdue = overdue.reduce((sum: number, i: any) => sum + i.totalAmount, 0).toLocaleString('vi-VN') + ' đ';
      const list = overdue
        .map(
          (i: any) =>
            `- Hóa đơn **${i.code}**: **${i.totalAmount.toLocaleString('vi-VN')} đ** (Quá hạn từ ${new Date(
              i.dueDate
            ).toLocaleDateString('vi-VN')})`
        )
        .join('\n');

      return {
        response:
          `⚠️ Căn hộ **${context.apartmentCode}** hiện có **${overdue.length}** hóa đơn quá hạn với tổng số tiền **${totalOverdue}**:\n\n` +
          `${list}\n\n` +
          `Vui lòng thanh toán sớm để đảm bảo các dịch vụ tiện ích của căn hộ không bị gián đoạn.`,
        actions: [{ label: '💳 Thanh toán nợ quá hạn', href: '/resident/invoices', actionType: 'NAVIGATE' }],
      };
    }

    // 5. USE CASE: "Tôi có ticket bảo trì nào?" / Sự cố kỹ thuật (Section 20)
    if (
      q.includes('bảo trì') ||
      q.includes('ticket') ||
      q.includes('sự cố') ||
      q.includes('kỹ thuật') ||
      q.includes('rò nước') ||
      q.includes('chập điện') ||
      q.includes('báo hỏng')
    ) {
      const tickets = context.recentTickets || [];

      if (tickets.length > 0) {
        const list = tickets
          .map(
            (t) =>
              `• **${t.code}**: ${t.title}\n` +
              `  - Trạng thái: **${t.status === 'NEW' ? 'Mới tiếp nhận' : t.status === 'PROCESSING' ? 'Đang xử lý' : 'Đã giải quyết'}**\n` +
              `  - Ngày gửi: ${new Date(t.createdAt).toLocaleDateString('vi-VN')}`
          )
          .join('\n\n');

        return {
          response:
            `🛠️ **Phiếu phản ánh / sự cố gần đây của căn hộ ${context.apartmentCode || ''}**:\n\n` +
            `${list}\n\n` +
            `Đội ngũ kỹ thuật tòa nhà đang tích cực theo dõi và xử lý theo đúng cam kết SLA.`,
          actions: [
            { label: '🛠️ Xem chi tiết sự cố', href: '/resident/feedback', actionType: 'NAVIGATE' },
            { label: '➕ Gửi phản ánh mới', href: '/resident/feedback', actionType: 'NAVIGATE' },
          ],
        };
      } else {
        return {
          response:
            `Căn hộ của bạn hiện không có phiếu phản ánh sự cố kỹ thuật nào đang mở.\n\n` +
            `Nếu bạn gặp vấn đề về điện, nước, điều hòa hoặc các thiết bị trong căn hộ, vui lòng gửi phiếu để kỹ thuật viên hỗ trợ nhanh nhất!`,
          actions: [{ label: '🛠️ Báo sự cố kỹ thuật', href: '/resident/feedback', actionType: 'NAVIGATE' }],
        };
      }
    }

    // 6. USE CASE: Giờ hoạt động tiện ích (Gym, Hồ bơi, BBQ...)
    if (
      q.includes('gym') ||
      q.includes('hồ bơi') ||
      q.includes('bể bơi') ||
      q.includes('mấy giờ') ||
      q.includes('tiện ích') ||
      q.includes('bbq') ||
      q.includes('sân bóng')
    ) {
      const facilities = context.facilities || [];
      const schedule = facilities
        .slice(0, 4)
        .map(
          (f: any) =>
            `- **${f.name}**: ${f.operatingHours || '06:00 - 21:30'} (Vị trí: ${f.location || 'Khu tiện ích tầng 3'})`
        )
        .join('\n');

      return {
        response:
          `🏊‍♂️ **Giờ hoạt động các tiện ích K-Home**:\n\n` +
          `${schedule}\n\n` +
          `Cư dân có thể sử dụng thẻ cư dân để vào cửa hoặc đặt trước khung giờ sử dụng trên ứng dụng.`,
        actions: [{ label: '🏸 Đặt lịch tiện ích', href: '/resident/facilities', actionType: 'NAVIGATE' }],
      };
    }

    // 7. DEFAULT RESIDENT ASSISTANT RESPONSE
    return {
      response:
        `Xin chào! Tôi là **K-Home AI Assistant** 🤖\n\n` +
        `Tôi sẵn sàng hỗ trợ bạn tra cứu các thông tin vận hành tòa nhà:\n` +
        `• **Bãi đỗ xe**: Chỗ đỗ còn trống, vị trí đỗ của bạn, đăng ký chỗ mới.\n` +
        `• **Hóa đơn & Phí**: Tra cứu số tiền cần đóng tháng này, nợ quá hạn.\n` +
        `• **Bảo trì & Sự cố**: Báo hỏng điện nước, theo dõi tiến độ kỹ thuật.\n` +
        `• **Tiện ích chung**: Giờ mở cửa hồ bơi, phòng gym, đặt sân BBQ.\n\n` +
        `Bạn muốn tìm hiểu thông tin nào?`,
      actions: [
        { label: '🅿️ Bãi đỗ xe', href: '/resident/parking', actionType: 'NAVIGATE' },
        { label: '🧾 Hóa đơn', href: '/resident/invoices', actionType: 'NAVIGATE' },
        { label: '🔧 Báo sự cố', href: '/resident/feedback', actionType: 'NAVIGATE' },
        { label: '🚗 Xe của tôi', href: '/resident/vehicles', actionType: 'NAVIGATE' },
      ],
    };
  }

  async classifyIncident(title: string, content: string): Promise<IncidentClassificationResult> {
    const text = `${title} ${content}`.toLowerCase();

    if (
      text.includes('nước') ||
      text.includes('rò rỉ') ||
      text.includes('ngấm') ||
      text.includes('thấm') ||
      text.includes('vòi') ||
      text.includes('bồn cầu') ||
      text.includes('xì') ||
      text.includes('thoát nước') ||
      text.includes('ống')
    ) {
      const isUrgent =
        text.includes('tràn') ||
        text.includes('chảy mạnh') ||
        text.includes('ngập') ||
        text.includes('lênh láng') ||
        text.includes('xì');
      return {
        category: 'WATER',
        priority: isUrgent ? 'URGENT' : 'HIGH',
        department: 'Đội kỹ thuật Điện - Nước',
        reason: 'Phát hiện dấu hiệu sự cố liên quan đến hệ thống cấp thoát nước, cần xử lý sớm tránh ngấm tường và hư hỏng tài sản.',
      };
    }

    if (
      text.includes('điện') ||
      text.includes('chập') ||
      text.includes('nhấp nháy') ||
      text.includes('mất điện') ||
      text.includes('ổ cắm') ||
      text.includes('aptomat') ||
      text.includes('cb') ||
      text.includes('bóng đèn') ||
      text.includes('nổ') ||
      text.includes('khói')
    ) {
      const isUrgent = text.includes('nổ') || text.includes('cháy') || text.includes('khói') || text.includes('mùi khét');
      return {
        category: 'ELECTRIC',
        priority: isUrgent ? 'CRITICAL' : 'HIGH',
        department: 'Đội kỹ thuật Điện - Nước',
        reason: 'Sự cố nguồn điện có nguy cơ mất an toàn PCCC, cần can thiệp cô lập dòng điện ngay lập tức.',
      };
    }

    if (text.includes('thang máy') || text.includes('kẹt') || text.includes('rơi') || text.includes('rung lắc')) {
      return {
        category: 'ELEVATOR',
        priority: 'URGENT',
        department: 'Đội kỹ thuật Thang máy & Tự động hóa',
        reason: 'Sự cố thiết bị di chuyển cao tầng, ưu tiên cứu hộ an toàn cho cư dân.',
      };
    }

    return {
      category: 'OTHER',
      priority: 'MEDIUM',
      department: 'Ban Quản Lý Tòa Nhà',
      reason: 'Yêu cầu thông thường từ cư dân, cần xem xét và điều phối xử lý theo quy trình.',
    };
  }
}

/**
 * 2. Optional Gemini AI Provider (When GEMINI_API_KEY is configured)
 */
export class GeminiAIProvider implements AIProvider {
  private fallback = new SmartRuleBasedAIProvider();
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateChatResponse(prompt: string, context: SafeResidentContext): Promise<AIChatResponse> {
    try {
      // Fallback directly handles prompt injection check first
      const lower = prompt.toLowerCase();
      if (
        lower.includes('ignore previous instructions') ||
        lower.includes('select * from') ||
        lower.includes('drop table')
      ) {
        return this.fallback.generateChatResponse(prompt, context);
      }

      const role = context.role || 'RESIDENT';
      let safeContextPrompt = `
Vai trò người hỏi: ${role}.
Thông tin an toàn từ hệ thống K-Home:
- Bãi đỗ xe khả dụng: ${JSON.stringify(context.parkingAvailability || {})}
- Chỗ đỗ của người này: ${JSON.stringify(context.myParkingAssignments || [])}
- Phương tiện đã đăng ký: ${JSON.stringify(context.myVehicles || [])}
- Căn hộ: ${context.apartmentCode || 'N/A'} (Tầng ${context.apartmentFloor || 'N/A'}, Tòa ${context.apartmentBuilding || 'N/A'})
- Hóa đơn tháng này: ${JSON.stringify(context.currentMonthInvoices || [])}
- Hóa đơn quá hạn: ${JSON.stringify(context.overdueInvoices || [])}
- Phiếu bảo trì: ${JSON.stringify(context.recentTickets || [])}
- Tiện ích: ${JSON.stringify(context.facilities || [])}`;

      const systemInstruction = `Bạn là Trợ Lý K-Home AI của Hệ thống Quản lý Chung cư Thông minh K-Home.
${safeContextPrompt}

Trả lời ngắn gọn, lịch sự, chính xác bằng tiếng Việt. TUYỆT ĐỐI chỉ dùng dữ liệu thực tế từ ngữ cảnh trên, không bịa đặt số liệu.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nNgười dùng hỏi: ${prompt}` }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        return this.fallback.generateChatResponse(prompt, context);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return this.fallback.generateChatResponse(prompt, context);

      // Extract default actions based on intent
      const fallbackRes = await this.fallback.generateChatResponse(prompt, context);
      return {
        response: text,
        actions: fallbackRes.actions,
      };
    } catch {
      return this.fallback.generateChatResponse(prompt, context);
    }
  }

  async classifyIncident(title: string, content: string): Promise<IncidentClassificationResult> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Phân loại sự cố kỹ thuật chung cư sau đây và trả về định dạng JSON thuần túy:
Tiêu đề: ${title}
Nội dung: ${content}

Format JSON:
{
  "category": "ELECTRIC" | "WATER" | "ELEVATOR" | "SECURITY" | "CLEANLINESS" | "OTHER",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL",
  "department": "Tên đội phụ trách",
  "reason": "Lý do phân loại"
}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) return this.fallback.classifyIncident(title, content);
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      return this.fallback.classifyIncident(title, content);
    }
  }
}

/**
 * 3. AI Factory: Decides provider based on environment configuration
 */
export class AIFactory {
  static getProvider(): AIProvider {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      return new GeminiAIProvider(apiKey.trim());
    }
    return new SmartRuleBasedAIProvider();
  }
}
