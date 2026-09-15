import { AIFactory } from './ai-provider.interface';
import { aiSafeContextService } from './ai-safe-context.service';
import { auditLogService } from '../audit/audit-log.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class AIAssistantService {
  // Simple in-memory rate limiter: 15 requests per minute per user
  private rateLimits = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX_REQUESTS_PER_MINUTE = 15;

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const record = this.rateLimits.get(userId);

    if (!record || now > record.resetAt) {
      this.rateLimits.set(userId, { count: 1, resetAt: now + 60 * 1000 });
      return true;
    }

    if (record.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    record.count += 1;
    return true;
  }

  /**
   * Resident AI Chat
   */
  async chat(
    message: string,
    userId: string,
    actor?: { email?: string; role?: string }
  ): Promise<{ response: string; rateLimitRemaining?: number }> {
    if (!message || message.trim().length === 0) {
      return { response: 'Vui lòng nhập câu hỏi của bạn để tôi có thể hỗ trợ.' };
    }

    // Check rate limit
    if (!this.checkRateLimit(userId)) {
      return {
        response: 'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi 1 phút trước khi hỏi tiếp nhé!',
      };
    }

    try {
      // 1. Get safe isolated context for this resident
      const context = await aiSafeContextService.getSafeContextForUser(userId);

      // 2. Obtain AI Provider
      const provider = AIFactory.getProvider();

      // 3. Generate Answer
      const answer = await provider.generateChatResponse(message, context);

      return { response: answer };
    } catch (error) {
      console.error('[AIAssistantService] Error in chat:', error);
      return {
        response: 'AI Assistant hiện không khả dụng. Bạn vẫn có thể sử dụng các chức năng thông thường của ứng dụng.',
      };
    }
  }

  /**
   * Incident Classification Recommendation
   */
  async classifyIncident(
    title: string,
    content: string,
    actor?: { id?: string; email?: string; role?: string }
  ) {
    try {
      const provider = AIFactory.getProvider();
      const result = await provider.classifyIncident(title, content);

      // Audit Log for AI Recommendation
      await auditLogService.record({
        actorId: actor?.id,
        actorEmail: actor?.email,
        actorRole: actor?.role,
        action: 'AI_CLASSIFICATION_REQUESTED',
        entity: 'TICKET',
        metadata: {
          title,
          suggestedCategory: result.category,
          suggestedPriority: result.priority,
          suggestedDepartment: result.department,
        },
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('[AIAssistantService] Classification error:', error);
      return {
        success: false,
        error: 'Không thể phân loại tự động',
        data: {
          category: 'OTHER' as const,
          priority: 'MEDIUM' as const,
          department: 'Ban Quản Lý Tòa Nhà',
          reason: 'Chưa đủ dữ liệu để phân loại tự động.',
        },
      };
    }
  }
}

export const aiAssistantService = new AIAssistantService();
