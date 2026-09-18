import { SafeResidentContext } from './ai-safe-context.service';

export interface IncidentClassificationResult {
  category: 'ELECTRIC' | 'WATER' | 'ELEVATOR' | 'SECURITY' | 'CLEANLINESS' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
  department: string;
  reason: string;
}

export interface AIProvider {
  generateChatResponse(prompt: string, context: SafeResidentContext): Promise<string>;
  classifyIncident(title: string, content: string): Promise<IncidentClassificationResult>;
}

/**
 * 1. Smart Rule-Based AI Engine (Default & Fallback)
 * Works 100% offline without requiring external API keys.
 */
export class SmartRuleBasedAIProvider implements AIProvider {
  async generateChatResponse(prompt: string, context: SafeResidentContext): Promise<string> {
    const q = prompt.toLowerCase();
    const role = context.role || 'RESIDENT';

    // =========================================================================
    // A. PHÂN HỆ QUẢN TRỊ & ĐIỀU HÀNH (ADMIN & MANAGER)
    // =========================================================================
    if (role === 'ADMIN' || role === 'MANAGER') {
      const stats = context.managementStats;

      // 1. Tổng quan vận hành / Tình hình tòa nhà
      if (
        q.includes('tổng quan') ||
        q.includes('tình hình') ||
        q.includes('vận hành') ||
        q.includes('báo cáo') ||
        q.includes('toàn cảnh') ||
        q.includes('hôm nay')
      ) {
        if (!stats) return 'Hệ thống đang đồng bộ dữ liệu quản trị, vui lòng thử lại sau giây lát.';
        return (
          `📊 **Báo cáo Tổng quan Vận hành K-Home**:\n\n` +
          `• **Căn hộ & Cư dân**: **${stats.occupiedApartments}/${stats.totalApartments}** căn đã có cư dân sinh sống (Tỷ lệ lấp đầy: **${stats.occupancyRate}%**)\n` +
          `• **Tài chính & Thu phí**: Còn **${stats.unpaidInvoicesCount}** hóa đơn chưa thanh toán (Tổng công nợ: **${stats.unpaidInvoicesAmount.toLocaleString('vi-VN')} đ**)\n` +
          `• **Bảo trì & Sự cố**: **${stats.openTicketsCount}** phiếu sự cố đang trong trạng thái xử lý\n` +
          `• **An toàn & IoT**: **${stats.criticalAlertsCount}** cảnh báo cảm biến cần giám sát\n\n` +
          `💡 *Bạn có thể bấm vào các mục tương ứng trên thanh điều hướng để xem chi tiết từng danh mục.*`
        );
      }

      // 2. Tra cứu công nợ & hóa đơn chưa thu
      if (
        q.includes('công nợ') ||
        q.includes('chưa thu') ||
        q.includes('doanh thu') ||
        q.includes('hóa đơn') ||
        q.includes('tiền')
      ) {
        if (!stats) return 'Không có dữ liệu công nợ khả dụng.';
        return (
          `💰 **Tình hình Công nợ & Hóa đơn K-Home**:\n\n` +
          `• Số hóa đơn chưa thanh toán / quá hạn: **${stats.unpaidInvoicesCount}** hóa đơn\n` +
          `• Tổng số tiền cần thu: **${stats.unpaidInvoicesAmount.toLocaleString('vi-VN')} đ**\n\n` +
          `👉 Bạn có thể quản lý, gửi nhắc nhở hoặc gạch nợ thủ công tại mục **Hóa đơn toàn hệ thống** (\`/invoices\`).`
        );
      }

      // 3. Tra cứu sự cố kỹ thuật & bảo trì
      if (
        q.includes('sự cố') ||
        q.includes('phản ánh') ||
        q.includes('kỹ thuật') ||
        q.includes('bảo trì') ||
        q.includes('hỏng')
      ) {
        if (!stats) return 'Không có dữ liệu sự cố khả dụng.';
        return (
          `🛠️ **Tình trạng Sự cố Kỹ thuật Tòa nhà**:\n\n` +
          `• Hiện có **${stats.openTicketsCount}** phiếu phản ánh / sự cố đang chờ hoặc đang được đội kỹ thuật xử lý.\n` +
          `• Vui lòng truy cập mục **Bảo trì & Sự cố** (\`/feedbacks\`) để theo dõi tiến độ SLA và phân công kỹ thuật viên kịp thời.`
        );
      }

      // 4. Giám sát an toàn & Cảm biến IoT
      if (
        q.includes('cảnh báo') ||
        q.includes('iot') ||
        q.includes('cảm biến') ||
        q.includes('cháy') ||
        q.includes('rò nước')
      ) {
        if (!stats) return 'Không có dữ liệu cảm biến IoT.';
        return (
          `🚨 **Giám sát Cảm biến & Cảnh báo Tòa nhà**:\n\n` +
          `• Hệ thống ghi nhận **${stats.criticalAlertsCount}** cảnh báo cảm biến đang kích hoạt hoặc cần xác nhận.\n` +
          `• Bạn có thể theo dõi biểu đồ thời gian thực và kích hoạt diễn tập tại mục **Giám sát Vận hành IoT** (\`/smart-operations\`).`
        );
      }

      // Default Admin / Manager response
      return (
        `Chào bạn! Tôi là **Trợ Lý Quản Trị K-Home AI** 🏢\n\n` +
        `Tôi có thể hỗ trợ bạn nhanh các thông tin điều hành:\n` +
        `1. **Tổng quan vận hành**: Tỷ lệ lấp đầy căn hộ, số liệu tổng thể hôm nay.\n` +
        `2. **Tài chính & Thu phí**: Số hóa đơn chưa thu, tổng công nợ cần giải quyết.\n` +
        `3. **Bảo trì & Kỹ thuật**: Số lượng sự cố đang mở, tiến độ xử lý của kỹ thuật.\n` +
        `4. **Giám sát IoT**: Cảnh báo rò rỉ nước, khói nhiệt thời gian thực.\n\n` +
        `Bạn muốn tra cứu thông tin điều hành nào?`
      );
    }

    // =========================================================================
    // B. PHÂN HỆ KỸ THUẬT VIÊN (STAFF_TECHNICIAN)
    // =========================================================================
    if (role === 'STAFF_TECHNICIAN') {
      const stats = context.technicianStats;

      if (q.includes('sự cố') || q.includes('công việc') || q.includes('phiếu') || q.includes('sửa chữa')) {
        return (
          `🔧 **Nhiệm vụ Kỹ thuật Hôm nay**:\n\n` +
          `• Hiện có **${stats?.openTicketsCount || 0}** sự cố đang chờ xử lý trong tòa nhà.\n` +
          `• Bạn hãy kiểm tra chi tiết phân công và cập nhật vật tư tại mục **Bảo trì & Sự cố** (\`/feedbacks\`).`
        );
      }

      if (q.includes('bảo trì') || q.includes('lịch') || q.includes('định kỳ') || q.includes('thiết bị')) {
        return (
          `📋 **Lịch Bảo trì Thiết bị Định kỳ**:\n\n` +
          `• Hiện có **${stats?.pendingMaintenanceCount || 0}** lịch bảo dưỡng định kỳ đang chờ thực hiện.\n` +
          `• Truy cập **Lịch bảo trì định kỳ** (\`/maintenance-schedules\`) để xem danh sách máy bơm, thang máy và hệ thống chiếu sáng.`
        );
      }

      if (q.includes('iot') || q.includes('cảm biến') || q.includes('bất thường')) {
        return (
          `📡 **Tình trạng Cảm biến IoT**:\n\n` +
          `• Có **${stats?.abnormalSensorsCount || 0}** cảm biến đang ở mức Cảnh báo hoặc Nghiêm trọng.\n` +
          `• Hãy kiểm tra ngay tại màn hình **Giám sát Vận hành IoT** (\`/smart-operations/iot\`).`
        );
      }

      if (q.includes('rò nước') || q.includes('chảy nước') || q.includes('quy trình')) {
        return (
          `💧 **Quy trình chuẩn xử lý rò rỉ nước**:\n\n` +
          `1. Khóa ngay van nhánh tầng tương ứng để cô lập dòng chảy.\n` +
          `2. Liên hệ căn hộ bị ảnh hưởng và căn hộ phía dưới để khảo sát ngấm trần.\n` +
          `3. Kiểm tra đồng hồ áp lực và mối nối gioăng cao su.\n` +
          `4. Chụp ảnh biên bản hiện trường và cập nhật trạng thái phiếu lên hệ thống.`
        );
      }

      return (
        `Chào anh/chị kỹ thuật viên! Tôi là **Trợ Lý Kỹ Thuật K-Home AI** 🛠️\n\n` +
        `Tôi có thể hỗ trợ bạn:\n` +
        `• Tra cứu danh sách sự cố đang mở (**${stats?.openTicketsCount || 0}** phiếu)\n` +
        `• Xem lịch bảo trì định kỳ (**${stats?.pendingMaintenanceCount || 0}** lịch)\n` +
        `• Kiểm tra cảm biến IoT bất thường và hướng dẫn quy trình sửa chữa chuẩn.`
      );
    }

    // =========================================================================
    // C. PHÂN HỆ AN NINH & BẢO VỆ (STAFF_SECURITY)
    // =========================================================================
    if (role === 'STAFF_SECURITY') {
      const stats = context.securityStats;

      if (q.includes('khách') || q.includes('ra vào') || q.includes('quét') || q.includes('qr')) {
        return (
          `🛡️ **Tình hình Khách ra vào Hôm nay**:\n\n` +
          `• Đã có **${stats?.todayVisitorsCount || 0}** lượt đăng ký khách ghé thăm trong ngày.\n` +
          `• Có **${stats?.pendingPassesCount || 0}** mã QR đang chờ quét check-in tại cổng.\n` +
          `👉 Sử dụng chức năng **Quét mã QR khách** (\`/visitors/scan\`) để kiểm tra hợp lệ và mở barie nhanh chóng.`
        );
      }

      if (q.includes('thẻ xe') || q.includes('bãi xe') || q.includes('xe') || q.includes('đỗ xe')) {
        return (
          `🚗 **Quản lý Thẻ xe & Phương tiện**:\n\n` +
          `• Toàn tòa nhà đang có **${stats?.activeParkingCardsCount || 0}** thẻ xe đang kích hoạt.\n` +
          `• **Mất thẻ xe**: Cần vào mục **Thẻ gửi xe** (\`/parking-cards\`) để chọn 'Khóa thẻ' ngay lập tức, tránh kẻ gian sử dụng.`
        );
      }

      if (q.includes('mất thẻ')) {
        return (
          `⚠️ **Quy trình xử lý Cư dân báo mất thẻ xe**:\n\n` +
          `1. Yêu cầu cư dân cung cấp CCCD và số căn hộ.\n` +
          `2. Vào mục **Thẻ gửi xe** (\`/parking-cards\`), tìm theo biển số xe hoặc mã thẻ và bấm **Khóa thẻ**.\n` +
          `3. Đối chiếu hình ảnh xe thực tế tại bãi trước khi cho xe ra ngoài.\n` +
          `4. Hướng dẫn cư dân liên hệ BQL vào giờ hành chính để làm thủ tục cấp lại thẻ mới.`
        );
      }

      return (
        `Chào đồng chí an ninh! Tôi là **Trợ Lý An Ninh K-Home AI** 👮\n\n` +
        `Tôi có thể hỗ trợ bạn:\n` +
        `• Tra cứu lượt khách ghé thăm hôm nay (**${stats?.todayVisitorsCount || 0}** khách)\n` +
        `• Hướng dẫn kiểm tra QR check-in và xử lý sự cố mất thẻ xe, đỗ sai vị trí.`
      );
    }

    // =========================================================================
    // D. PHÂN HỆ LỄ TÂN & SẢNH (STAFF_RECEPTIONIST)
    // =========================================================================
    if (role === 'STAFF_RECEPTIONIST') {
      const stats = context.receptionistStats;

      if (q.includes('bưu kiện') || q.includes('hàng') || q.includes('shipper') || q.includes('giao hàng')) {
        return (
          `📦 **Quản lý Bưu kiện tại Quầy Lễ Tân**:\n\n` +
          `• Hiện tại có **${stats?.waitingParcelsCount || 0}** bưu kiện đang chờ cư dân xuống nhận tại sảnh.\n` +
          `• Để tiếp nhận bưu kiện mới từ shipper, bạn vào mục **Quản lý Bưu kiện** (\`/parcels\`) và bấm 'Tiếp nhận bưu kiện'. Hệ thống sẽ tự động gửi thông báo đến app cư dân.`
        );
      }

      if (q.includes('khách') || q.includes('hẹn')) {
        return (
          `🤝 **Lịch đón tiếp Khách hôm nay**:\n\n` +
          `• Ghi nhận **${stats?.todayVisitorsCount || 0}** lượt khách đăng ký đến tòa nhà trong ngày.\n` +
          `• Bạn có thể tra cứu thông tin căn hộ đón khách tại mục **Khách ra vào** (\`/visitors\`).`
        );
      }

      return (
        `Chào bạn! Tôi là **Trợ Lý Lễ Tân K-Home AI** 🛎️\n\n` +
        `Tôi có thể hỗ trợ bạn:\n` +
        `• Kiểm tra bưu kiện tồn tại sảnh (**${stats?.waitingParcelsCount || 0}** kiện)\n` +
        `• Tra cứu khách hẹn hôm nay (**${stats?.todayVisitorsCount || 0}** khách)\n` +
        `• Hướng dẫn tiếp nhận hàng bưu kiện và kết nối thông tin với cư dân.`
      );
    }

    // =========================================================================
    // E. PHÂN HỆ CƯ DÂN (RESIDENT)
    // =========================================================================
    // 1. USE CASE: Tra cứu hóa đơn & tiền phí
    if (
      q.includes('hóa đơn') ||
      q.includes('hoa don') ||
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
        return 'Tài khoản của bạn chưa được liên kết với căn hộ cụ thể trong hệ thống. Vui lòng liên hệ Ban Quản Lý để được cập nhật thông tin căn hộ.';
      }

      const unpaidTotal = context.currentMonthInvoices?.reduce((sum: number, i: any) => sum + i.totalAmount, 0) || 0;
      const formattedTotal = unpaidTotal.toLocaleString('vi-VN') + ' đ';

      if (context.currentMonthInvoices && context.currentMonthInvoices.length > 0) {
        const details = context.currentMonthInvoices
          .map((i: any) => `- Hóa đơn ${i.code}: ${i.totalAmount.toLocaleString('vi-VN')} đ (Hạn nộp: ${new Date(i.dueDate).toLocaleDateString('vi-VN')})`)
          .join('\n');

        return `Chào bạn! Căn hộ **${context.apartmentCode}** có tổng số tiền cần thanh toán tháng này là **${formattedTotal}**:\n\n${details}\n\nBạn có thể thanh toán trực tiếp qua mục **Hóa đơn & Thanh toán** trên ứng dụng cư dân.`;
      } else {
        return `Chào bạn! Căn hộ **${context.apartmentCode}** hiện không có hóa đơn nào cần thanh toán trong tháng này. Bạn đã hoàn tất mọi khoản phí sinh hoạt!`;
      }
    }

    // 2. USE CASE: Hóa đơn quá hạn
    if (
      q.includes('quá hạn') ||
      q.includes('trễ hạn') ||
      q.includes('chậm nộp')
    ) {
      if (!context.hasApartment) {
        return 'Tài khoản của bạn chưa liên kết căn hộ.';
      }

      const overdue = context.overdueInvoices || [];
      if (overdue.length === 0) {
        return `Tuyệt vời! Căn hộ **${context.apartmentCode}** của bạn không có hóa đơn nào bị quá hạn thanh toán. Cảm ơn bạn đã luôn đóng phí đúng hạn!`;
      }

      const totalOverdue = overdue.reduce((sum: number, i: any) => sum + i.totalAmount, 0).toLocaleString('vi-VN') + ' đ';
      const list = overdue
        .map((i: any) => `- Hóa đơn **${i.code}**: ${i.totalAmount.toLocaleString('vi-VN')} đ (Đã quá hạn từ ngày ${new Date(i.dueDate).toLocaleDateString('vi-VN')})`)
        .join('\n');

      return `Căn hộ **${context.apartmentCode}** hiện có **${overdue.length}** hóa đơn đang quá hạn thanh toán với tổng số tiền **${totalOverdue}**:\n\n${list}\n\n⚠️ Vui lòng thanh toán sớm để tránh bị gián đoạn các dịch vụ tiện ích của tòa nhà.`;
    }

    // 3. USE CASE: Giờ hoạt động tiện ích (Gym, Hồ bơi, BBQ...)
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
      if (facilities.length === 0) {
        return 'Hiện tại các tiện ích chung của tòa nhà (Phòng Gym, Bể bơi) mở cửa từ **06:00 sáng đến 21:30 tối** hàng ngày. Bạn có thể sử dụng thẻ cư dân để quẹt vào cửa.';
      }

      const matched = facilities.filter((f: any) => {
        const name = f.name.toLowerCase();
        if (q.includes('gym') && name.includes('gym')) return true;
        if ((q.includes('bể bơi') || q.includes('hồ bơi')) && (name.includes('bơi') || name.includes('pool'))) return true;
        if (q.includes('bbq') && name.includes('bbq')) return true;
        return false;
      });

      const targets = matched.length > 0 ? matched : facilities.slice(0, 3);
      const schedule = targets
        .map((f: any) => `- **${f.name}**: ${f.operatingHours || '06:00 - 21:30'} (Vị trí: ${f.location || 'Khu tiện ích tầng 3'})`)
        .join('\n');

      return `Thông tin giờ hoạt động các tiện ích của tòa nhà:\n\n${schedule}\n\nBạn có thể đặt trước sân hoặc lịch sử dụng tại mục **Đặt tiện ích** trên ứng dụng!`;
    }

    // 4. USE CASE: Báo sự cố rò rỉ nước, chập điện
    if (
      q.includes('rò nước') ||
      q.includes('chảy nước') ||
      q.includes('thấm trần') ||
      q.includes('chập điện') ||
      q.includes('mất điện') ||
      q.includes('sửa chữa') ||
      q.includes('báo sự cố') ||
      q.includes('hỏng')
    ) {
      return (
        'Tôi đã ghi nhận thông tin bạn muốn báo sự cố! 🛠️\n\n' +
        'Để đội kỹ thuật hỗ trợ nhanh và chính xác nhất, bạn vui lòng tạo một phiếu tại mục **Yêu cầu bảo trì** (gửi kèm ảnh chụp vị trí sự cố nếu có).\n\n' +
        '⚠️ **Lưu ý khẩn cấp**: Nếu nước đang chảy tràn hoặc có nguy cơ chập điện, vui lòng liên hệ ngay **Hotline Ban Quản Lý: 1900 8899** (Trực 24/7) để được hỗ trợ tức thi!'
      );
    }

    // 5. USE CASE: Nội quy, quy định, thú cưng
    if (
      q.includes('thú cưng') ||
      q.includes('chó') ||
      q.includes('mèo') ||
      q.includes('quy định') ||
      q.includes('nội quy') ||
      q.includes('giờ yên tĩnh') ||
      q.includes('đỗ xe')
    ) {
      return (
        '**Quy định chung của Tòa nhà**:\n\n' +
        '1. **Nuôi thú cưng**: Cư dân được phép nuôi thú cưng nhỏ, yêu cầu đăng ký với BQL, tiêm phòng đầy đủ, đeo rọ mõm và có dây xích khi ra khu vực công cộng.\n' +
        '2. **Giờ yên tĩnh**: Từ 22:00 đến 06:00 sáng hôm sau. Vui lòng không bật nhạc lớn hoặc gây ồn ào.\n' +
        '3. **Đỗ xe**: Đỗ đúng vị trí đã đăng ký, tuân thủ hướng dẫn của nhân viên an ninh.\n' +
        '4. **Rác sinh hoạt**: Phân loại rác và bỏ vào phòng rác tầng theo khung giờ quy định.'
      );
    }

    // Default polite response for resident
    return (
      `Chào bạn, tôi là **Trợ lý K-Home AI** của cư dân tòa nhà! 🤖\n\n` +
      `Tôi có thể giúp bạn giải đáp các thông tin:\n` +
      `1. **Hóa đơn & Phí sinh hoạt**: Tra cứu tiền phải đóng tháng này, hóa đơn quá hạn.\n` +
      `2. **Tiện ích tòa nhà**: Giờ mở cửa phòng Gym, Hồ bơi, khu BBQ.\n` +
      `3. **Báo cáo sự cố**: Hướng dẫn gửi yêu cầu sửa chữa điện nước cho ban quản lý.\n` +
      `4. **Nội quy & Quy định**: Quy định nuôi thú cưng, giờ yên tĩnh tòa nhà.\n\n` +
      `Bạn cần tôi hỗ trợ thông tin gì hôm nay?`
    );
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
      const isUrgent = text.includes('tràn') || text.includes('chảy mạnh') || text.includes('ngập') || text.includes('lênh láng') || text.includes('xì');
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
      text.includes('khét')
    ) {
      const isUrgent = text.includes('khét') || text.includes('nổ') || text.includes('tia lửa') || text.includes('khói');
      const isMinor = text.includes('bóng đèn') || text.includes('nhấp nháy') || text.includes('chập chờn');
      return {
        category: 'ELECTRIC',
        priority: isUrgent ? 'URGENT' : isMinor ? 'MEDIUM' : 'HIGH',
        department: 'Đội kỹ thuật Điện - Nước',
        reason: isMinor
          ? 'Sự cố thiết bị chiếu sáng cục bộ, cần kỹ thuật kiểm tra và thay thế bóng/chấn lưu.'
          : 'Sự cố liên quan tới hệ thống điện hoặc nguồn tải, cần kiểm tra đảm bảo an toàn phòng cháy chữa cháy.',
      };
    }

    if (
      text.includes('thang máy') ||
      text.includes('kẹt thang') ||
      text.includes('thang rung') ||
      text.includes('tiếng ồn thang') ||
      text.includes('cửa thang')
    ) {
      const isUrgent = text.includes('kẹt người') || text.includes('nhốt') || text.includes('rơi');
      return {
        category: 'ELEVATOR',
        priority: isUrgent ? 'CRITICAL' : 'HIGH',
        department: 'Đội kỹ thuật Cơ điện Thang máy',
        reason: 'Sự cố liên quan tới hệ thống thang máy vận chuyển thẳng đứng, cần kỹ sư chuyên trách kiểm định.',
      };
    }

    if (
      text.includes('cháy') ||
      text.includes('khói') ||
      text.includes('báo cháy') ||
      text.includes('chuông kêu') ||
      text.includes('vòi phun') ||
      text.includes('sprinkler')
    ) {
      return {
        category: 'SECURITY',
        priority: 'CRITICAL',
        department: 'Đội PCCC & An ninh Tòa nhà',
        reason: 'Cảnh báo nguy cơ hỏa hoạn hoặc lỗi thiết bị PCCC, kích hoạt cơ chế ứng phó khẩn cấp.',
      };
    }

    if (
      text.includes('ồn') ||
      text.includes('cãi nhau') ||
      text.includes('trộm') ||
      text.includes('mất đồ') ||
      text.includes('người lạ') ||
      text.includes('đỗ xe sai') ||
      text.includes('chắn cửa')
    ) {
      return {
        category: 'SECURITY',
        priority: 'MEDIUM',
        department: 'Đội Bảo vệ & An ninh Trật tự',
        reason: 'Phản ánh liên quan đến an ninh trật tự, tranh chấp hoặc vi phạm nội quy công cộng.',
      };
    }

    if (
      text.includes('rác') ||
      text.includes('bẩn') ||
      text.includes('mùi') ||
      text.includes('hôi') ||
      text.includes('chưa dọn') ||
      text.includes('hành lang bẩn')
    ) {
      return {
        category: 'CLEANLINESS',
        priority: 'LOW',
        department: 'Đội Vệ sinh Môi trường',
        reason: 'Yêu cầu dọn dẹp vệ sinh khu vực chung hoặc xử lý mùi hôi phòng rác.',
      };
    }

    return {
      category: 'OTHER',
      priority: 'LOW',
      department: 'Ban Quản Lý & Chăm sóc Cư dân',
      reason: 'Yêu cầu hoặc phản ánh chung, cần nhân viên BQL tiếp nhận và phân loại cụ thể.',
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

  async generateChatResponse(prompt: string, context: SafeResidentContext): Promise<string> {
    try {
      const role = context.role || 'RESIDENT';
      let roleSpecificContext = '';

      if (role === 'ADMIN' || role === 'MANAGER') {
        roleSpecificContext = `
Vai trò người hỏi: Ban Quản Lý / Super Admin Tòa Nhà K-Home.
Thông tin vận hành tòa nhà:
- Căn hộ: ${context.managementStats?.occupiedApartments || 0}/${context.managementStats?.totalApartments || 0} (Lấp đầy ${context.managementStats?.occupancyRate || 0}%)
- Hóa đơn chưa thu: ${context.managementStats?.unpaidInvoicesCount || 0} hóa đơn (${context.managementStats?.unpaidInvoicesAmount || 0} đ)
- Sự cố mở: ${context.managementStats?.openTicketsCount || 0}
- Cảnh báo IoT: ${context.managementStats?.criticalAlertsCount || 0}
Nhiệm vụ: Trả lời ngắn gọn, chuyên nghiệp, hỗ trợ ra quyết định quản trị và chỉ dẫn điều hướng trong phần mềm.`;
      } else if (role === 'STAFF_TECHNICIAN') {
        roleSpecificContext = `
Vai trò người hỏi: Kỹ thuật viên Tòa Nhà K-Home.
- Sự cố mở: ${context.technicianStats?.openTicketsCount || 0}
- Lịch bảo trì pending: ${context.technicianStats?.pendingMaintenanceCount || 0}
- Cảm biến bất thường: ${context.technicianStats?.abnormalSensorsCount || 0}
Nhiệm vụ: Hỗ trợ quy trình kỹ thuật chuẩn, an toàn lao động, hướng dẫn xử lý sự cố.`;
      } else if (role === 'STAFF_SECURITY') {
        roleSpecificContext = `
Vai trò người hỏi: Nhân viên An Ninh & Bảo Vệ Tòa Nhà K-Home.
- Khách hẹn hôm nay: ${context.securityStats?.todayVisitorsCount || 0}
- Thẻ xe kích hoạt: ${context.securityStats?.activeParkingCardsCount || 0}
- Cảnh báo an ninh: ${context.securityStats?.activeAlertsCount || 0}
Nhiệm vụ: Hỗ trợ quy trình kiểm soát ra vào, quy định bãi xe, xử lý mất thẻ xe, phương án an ninh.`;
      } else if (role === 'STAFF_RECEPTIONIST') {
        roleSpecificContext = `
Vai trò người hỏi: Nhân viên Lễ Tân Tòa Nhà K-Home.
- Bưu kiện chờ nhận: ${context.receptionistStats?.waitingParcelsCount || 0}
- Khách hẹn hôm nay: ${context.receptionistStats?.todayVisitorsCount || 0}
Nhiệm vụ: Hỗ trợ quy trình tiếp nhận bưu kiện, đón tiếp khách và xử lý yêu cầu sảnh.`;
      } else {
        roleSpecificContext = `
Vai trò người hỏi: Cư dân Tòa Nhà K-Home.
- Căn hộ: ${context.apartmentCode || 'Chưa liên kết'} (Tầng ${context.apartmentFloor || 'N/A'}, Tòa ${context.apartmentBuilding || 'N/A'})
- Hóa đơn chưa thanh toán tháng này: ${JSON.stringify(context.currentMonthInvoices || [])}
- Hóa đơn quá hạn: ${JSON.stringify(context.overdueInvoices || [])}
- Tiện ích tòa nhà: ${JSON.stringify(context.facilities || [])}`;
      }

      const systemInstruction = `Bạn là Trợ Lý K-Home AI của Hệ thống Quản lý Vận hành Chung cư Thông minh K-Home (Smart Living, Better Together).
${roleSpecificContext}

Hãy trả lời lịch sự, thân thiện bằng tiếng Việt. Chỉ sử dụng thông tin trong Safe Context trên để trả lời các câu hỏi. TUYỆT ĐỐI không bịa đặt số liệu hay thông tin ngoài ngữ cảnh an toàn đã cung cấp.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nCư dân hỏi: ${prompt}` }],
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
      return text || this.fallback.generateChatResponse(prompt, context);
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
                    text: `Phân loại sự cố kỹ thuật chung cư sau đây và trả về định dạng JSON thuần túy (không bọc trong markdown block):
Tiêu đề: ${title}
Nội dung: ${content}

Yêu cầu format JSON:
{
  "category": "ELECTRIC" | "WATER" | "ELEVATOR" | "SECURITY" | "CLEANLINESS" | "OTHER",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL",
  "department": "Tên đội phụ trách xử lý",
  "reason": "Lý do ngắn gọn phân loại"
}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        return this.fallback.classifyIncident(title, content);
      }

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
