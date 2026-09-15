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
        '⚠️ **Lưu ý khẩn cấp**: Nếu nước đang chảy tràn hoặc có nguy cơ chập điện, vui lòng liên hệ ngay **Hotline Ban Quản Lý: 1900 8899** (Trực 24/7) để được hỗ trợ tức thì!'
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

    // Default polite response
    return (
      `Chào bạn, tôi là **Trợ lý Ảo Cư Dân AI** của tòa nhà! 🤖\n\n` +
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
      text.includes('aptomat') ||
      text.includes('mất điện') ||
      text.includes('ổ cắm') ||
      text.includes('bóng đèn') ||
      text.includes('đèn') ||
      text.includes('nhấp nháy') ||
      text.includes('chập chờn')
    ) {
      const isUrgent = text.includes('cháy') || text.includes('mùi khét') || text.includes('tóe lửa');
      return {
        category: 'ELECTRIC',
        priority: isUrgent ? 'CRITICAL' : text.includes('nhấp nháy') || text.includes('chập chờn') ? 'LOW' : 'HIGH',
        department: 'Đội kỹ thuật Cơ - Điện',
        reason: 'Sự cố liên quan đến hệ thống điện dân dụng, tiềm ẩn nguy cơ mất an toàn cần ưu tiên kiểm tra.',
      };
    }

    if (text.includes('thang máy') || text.includes('kẹt') || text.includes('rung lắc') || text.includes('bấm tầng')) {
      return {
        category: 'ELEVATOR',
        priority: text.includes('kẹt người') ? 'CRITICAL' : 'HIGH',
        department: 'Đội kỹ thuật Vận hành Thang máy',
        reason: 'Sự cố thiết bị di chuyển thẳng đứng, cần kiểm tra bo mạch và cáp kéo của cabin.',
      };
    }

    if (text.includes('rác') || text.includes('mùi hôi') || text.includes('bẩn') || text.includes('vệ sinh')) {
      return {
        category: 'CLEANLINESS',
        priority: 'MEDIUM',
        department: 'Đội dịch vụ Vệ sinh Môi trường',
        reason: 'Vấn đề môi trường và vệ sinh hành lang / khu vực công cộng.',
      };
    }

    if (text.includes('an ninh') || text.includes('ồn ào') || text.includes('trộm') || text.includes('khóa') || text.includes('cãi nhau')) {
      return {
        category: 'SECURITY',
        priority: 'HIGH',
        department: 'Đội An ninh & Bảo vệ Tòa nhà',
        reason: 'Vấn đề trật tự trị an và an toàn cư dân trong khuôn viên.',
      };
    }

    return {
      category: 'OTHER',
      priority: 'MEDIUM',
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
      const systemInstruction = `Bạn là Trợ lý Ảo Cư Dân của Tòa nhà Chung cư Thông minh (Smart Building).
Dưới đây là thông tin an toàn (Safe Context) của cư dân đang trò chuyện:
- Căn hộ: ${context.apartmentCode || 'Chưa liên kết'} (Tầng ${context.apartmentFloor || 'N/A'}, Tòa ${context.apartmentBuilding || 'N/A'})
- Hóa đơn chưa thanh toán tháng này: ${JSON.stringify(context.currentMonthInvoices || [])}
- Hóa đơn quá hạn: ${JSON.stringify(context.overdueInvoices || [])}
- Tiện ích tòa nhà: ${JSON.stringify(context.facilities || [])}

Hãy trả lời lịch sự, thân thiện bằng tiếng Việt. Chỉ sử dụng thông tin trong Safe Context trên để trả lời các câu hỏi về hóa đơn, nợ phí, tiện ích. TUYỆT ĐỐI không bịa đặt số tiền hay thông tin ngoài ngữ cảnh an toàn đã cung cấp.`;

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
