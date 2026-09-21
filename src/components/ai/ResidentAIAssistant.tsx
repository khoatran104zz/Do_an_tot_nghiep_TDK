'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Bot,
  X,
  Send,
  Sparkles,
  CreditCard,
  AlertTriangle,
  Clock,
  Wrench,
  User,
  Loader2,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Car,
  Package,
  PhoneCall,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Compass,
  QrCode,
  Home,
  Bell,
} from 'lucide-react';
import { useAIChat } from '@/hooks/use-ai';
import { cn } from '@/lib/utils';

export interface ChatAction {
  label: string;
  href?: string;
  actionType?: 'NAVIGATE' | 'PRESET_QUERY';
  variant?: 'default' | 'outline' | 'secondary';
  query?: string;
}

export interface ChatItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  actions?: ChatAction[];
  isError?: boolean;
}

interface RoleAIConfig {
  title: string;
  subtitle: string;
  badge: string;
  welcomeMessage: string;
  quickPrompts: Array<{
    label: string;
    query: string;
    icon: React.ElementType;
  }>;
}

const ROLE_AI_CONFIGS: Record<string, RoleAIConfig> = {
  ADMIN: {
    title: 'K-Home AI Assistant',
    subtitle: 'Điều hành & Vận hành 24/7',
    badge: 'Super Admin',
    welcomeMessage:
      'Xin chào Quản trị viên! Tôi là K-Home AI Assistant. Tôi có thể cung cấp nhanh báo cáo vận hành bãi đỗ xe, tổng công nợ chưa thu, các sự cố kỹ thuật và cảnh báo IoT. Bạn cần hỗ trợ thông tin nào?',
    quickPrompts: [
      { label: '🅿️ Tình hình bãi đỗ xe', query: 'Báo cáo tình hình bãi xe tòa nhà hôm nay', icon: Car },
      { label: '📊 Tổng quan hôm nay', query: 'Báo cáo tổng quan tình hình vận hành hôm nay', icon: BarChart3 },
      { label: '💰 Công nợ chưa thu', query: 'Tình hình công nợ và hóa đơn chưa thu thế nào?', icon: CreditCard },
      { label: '🛠️ Sự cố chờ xử lý', query: 'Có bao nhiêu sự cố kỹ thuật đang chờ xử lý?', icon: Wrench },
    ],
  },
  MANAGER: {
    title: 'K-Home AI Assistant',
    subtitle: 'Ban Quản Lý Tòa Nhà 24/7',
    badge: 'Ban Quản Lý',
    welcomeMessage:
      'Xin chào Ban Quản Lý! Tôi là K-Home AI Assistant. Tôi có thể hỗ trợ bạn theo dõi nhanh bãi đỗ xe, duyệt đơn đăng ký, số liệu công nợ và tiến độ xử lý sự cố cư dân.',
    quickPrompts: [
      { label: '🅿️ Chỗ đỗ xe tòa nhà', query: 'Tình hình bãi đỗ xe hôm nay còn bao nhiêu chỗ?', icon: Car },
      { label: '📊 Tổng quan vận hành', query: 'Báo cáo tổng quan tình hình vận hành hôm nay', icon: BarChart3 },
      { label: '💰 Công nợ tòa nhà', query: 'Tình hình công nợ và hóa đơn chưa thu thế nào?', icon: CreditCard },
      { label: '🛠️ Phiếu sự cố mở', query: 'Có bao nhiêu sự cố kỹ thuật đang chờ xử lý?', icon: Wrench },
    ],
  },
  STAFF_TECHNICIAN: {
    title: 'K-Home AI Assistant',
    subtitle: 'Kỹ thuật & IoT 24/7',
    badge: 'Kỹ thuật viên',
    welcomeMessage:
      'Chào anh/chị kỹ thuật viên! Tôi là K-Home AI Assistant. Tôi sẵn sàng hỗ trợ bạn theo dõi phiếu sự cố đang mở, lịch bảo trì định kỳ thiết bị và kiểm tra cảm biến IoT.',
    quickPrompts: [
      { label: '🛠️ Sự cố đang mở', query: 'Hôm nay có những sự cố kỹ thuật nào đang mở?', icon: Wrench },
      { label: '📋 Lịch bảo trì', query: 'Kiểm tra lịch bảo trì định kỳ thiết bị', icon: Clock },
      { label: '📡 Cảm biến bất thường', query: 'Có cảm biến IoT nào đang bất thường không?', icon: AlertTriangle },
    ],
  },
  STAFF_SECURITY: {
    title: 'K-Home AI Assistant',
    subtitle: 'Kiểm soát & An ninh 24/7',
    badge: 'An ninh bảo vệ',
    welcomeMessage:
      'Chào đồng chí an ninh! Tôi là K-Home AI Assistant. Tôi có thể hỗ trợ kiểm tra lượt khách ghé thăm, thẻ xe kích hoạt và quy trình xử lý sự cố an ninh.',
    quickPrompts: [
      { label: '🅿️ Bãi xe & Thẻ từ', query: 'Tình hình bãi xe và thẻ từ ra sao?', icon: Car },
      { label: '👥 Khách hẹn hôm nay', query: 'Hôm nay có bao nhiêu lượt khách đăng ký đến?', icon: UserCheck },
      { label: '🚨 Quy trình mất thẻ', query: 'Quy trình xử lý khi cư dân báo mất thẻ xe?', icon: AlertTriangle },
    ],
  },
  STAFF_RECEPTIONIST: {
    title: 'K-Home AI Assistant',
    subtitle: 'Sảnh & Lễ tân 24/7',
    badge: 'Lễ tân sảnh',
    welcomeMessage:
      'Chào bạn! Tôi là K-Home AI Assistant. Tôi có thể hỗ trợ bạn kiểm tra bưu kiện đang chờ nhận tại sảnh, danh sách khách hẹn và thông tin kết nối Ban Quản Lý.',
    quickPrompts: [
      { label: '📦 Bưu kiện chờ nhận', query: 'Hiện có bao nhiêu bưu kiện đang chờ cư dân nhận?', icon: Package },
      { label: '👥 Khách hẹn sảnh', query: 'Hôm nay có khách nào đăng ký ghé thăm không?', icon: UserCheck },
      { label: '📞 Hotline BQL', query: 'Số hotline và kênh hỗ trợ của Ban Quản Lý?', icon: PhoneCall },
    ],
  },
  RESIDENT: {
    title: 'K-Home AI Assistant',
    subtitle: 'Smart Living, Better Together',
    badge: 'Cư dân',
    welcomeMessage:
      'Xin chào bạn! Tôi là K-Home AI Assistant. Tôi có thể giúp bạn kiểm tra chỗ trống bãi đỗ xe, vị trí đỗ của bạn, tra cứu hóa đơn tháng này, hoặc theo dõi tiến độ sửa chữa sự cố. Bạn cần hỗ trợ gì hôm nay?',
    quickPrompts: [
      { label: '🅿️ Bãi xe còn chỗ không?', query: 'Bãi xe còn chỗ không?', icon: Car },
      { label: '🚗 Tôi đang đỗ xe ở đâu?', query: 'Tôi đang đỗ xe ở đâu?', icon: Compass },
      { label: '📝 Đăng ký chỗ đỗ', query: 'Đăng ký chỗ đỗ như thế nào?', icon: QrCode },
      { label: '🧾 Hóa đơn tháng này', query: 'Tháng này tôi phải đóng bao nhiêu tiền?', icon: CreditCard },
      { label: '🛠️ Phiếu bảo trì của tôi', query: 'Tôi có ticket bảo trì nào đang xử lý không?', icon: Wrench },
      { label: '🏊 Giờ mở cửa hồ bơi & gym', query: 'Phòng gym và hồ bơi mở cửa đến mấy giờ?', icon: Clock },
    ],
  },
};

export function ResidentAIAssistant({ role: propRole }: { role?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const activeRole = propRole || (session?.user?.role as string) || 'RESIDENT';
  const config = ROLE_AI_CONFIGS[activeRole] || ROLE_AI_CONFIGS.RESIDENT;

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: config.welcomeMessage,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      actions: activeRole === 'RESIDENT'
        ? [
            { label: '🅿️ Bãi đỗ xe', href: '/resident/parking', actionType: 'NAVIGATE' },
            { label: '🧾 Hóa đơn', href: '/resident/invoices', actionType: 'NAVIGATE' },
            { label: '🔧 Báo sự cố', href: '/resident/feedback', actionType: 'NAVIGATE' },
          ]
        : undefined,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatMutation = useAIChat();

  // Reset welcome message if role changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: config.welcomeMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actions: activeRole === 'RESIDENT'
          ? [
              { label: '🅿️ Bãi đỗ xe', href: '/resident/parking', actionType: 'NAVIGATE' },
              { label: '🧾 Hóa đơn', href: '/resident/invoices', actionType: 'NAVIGATE' },
              { label: '🔧 Báo sự cố', href: '/resident/feedback', actionType: 'NAVIGATE' },
            ]
          : undefined,
      },
    ]);
  }, [activeRole, config.welcomeMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageToSend?: string) => {
    const text = messageToSend || inputMessage;
    if (!text.trim() || chatMutation.isPending) return;

    const userMsg: ChatItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageToSend) setInputMessage('');

    try {
      const res = await chatMutation.mutateAsync(text.trim());
      const aiReply: ChatItem = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res?.response || 'K-Home AI Assistant đã tiếp nhận thông tin.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actions: (res as any)?.actions || [],
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      const errorReply: ChatItem = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Kết nối với K-Home AI Assistant đang gặp sự cố. Bạn có thể thử lại sau hoặc sử dụng thanh menu để thao tác trực tiếp.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorReply]);
    }
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.actionType === 'NAVIGATE' && action.href) {
      router.push(action.href);
      // Close on mobile to show navigated page
      if (window.innerWidth < 640) {
        setIsOpen(false);
      }
    } else if (action.query) {
      handleSend(action.query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button (Repositioned to bottom-20 on mobile to avoid colliding with MobileBottomNav) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-13 w-13 rounded-full bg-[#0F6B4F] hover:bg-[#0c5942] text-white shadow-xl shadow-[#0F6B4F]/30 flex items-center justify-center relative cursor-pointer group transition-all duration-200 hover:scale-105"
            aria-label="Mở Trợ lý ảo K-Home AI"
          >
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </span>
          </Button>
        )}
      </div>

      {/* Responsive Chat Window: Mobile Bottom Sheet vs Desktop Floating Dialog */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex flex-col justify-end sm:justify-start">
          {/* Mobile backdrop */}
          <div
            className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative w-full sm:w-[440px] h-[88vh] sm:h-[620px] max-h-[90vh] rounded-t-3xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            
            {/* Header with K-Home branding */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-[#0F6B4F] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold truncate max-w-[200px]">
                      {config.title}
                    </h4>
                    <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-white/20 text-emerald-100">
                      {config.badge}
                    </span>
                    <span className="text-[11px] text-emerald-100/90 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {config.subtitle}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Conversation Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/50 text-xs">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2.5 max-w-[90%]',
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                  >
                    <div
                      className={cn(
                        'h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs mt-1',
                        isUser
                          ? 'bg-[#0F6B4F] text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-[#0F6B4F]" />}
                    </div>

                    <div className="space-y-1.5">
                      {/* Message Bubble */}
                      <div
                        className={cn(
                          'p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-xs',
                          isUser
                            ? 'bg-[#0F6B4F] text-white rounded-tr-none'
                            : msg.isError
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-tl-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/70 dark:border-slate-700/60'
                        )}
                      >
                        {msg.text}
                      </div>

                      {/* Actionable Deep Linking Buttons (Section 25, 26, 40) */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {msg.actions.map((act, actIdx) => (
                            <button
                              key={actIdx}
                              onClick={() => handleActionClick(act)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F6B4F]/10 hover:bg-[#0F6B4F] text-[#0F6B4F] hover:text-white dark:bg-[#0F6B4F]/25 dark:text-emerald-300 dark:hover:bg-[#0F6B4F] dark:hover:text-white border border-[#0F6B4F]/30 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="text-[10px] text-slate-400 block px-1">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {chatMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-1 pl-9">
                  <div className="flex items-center gap-1 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F6B4F] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F6B4F] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F6B4F] animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[11px] font-medium text-slate-500 ml-1.5">K-Home AI đang xử lý...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Chips */}
            <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex overflow-x-auto gap-1.5 no-scrollbar shrink-0">
              {config.quickPrompts.map((qp, i) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(qp.query)}
                    disabled={chatMutation.isPending}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#E8F5ED] hover:text-[#0F6B4F] dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Icon className="h-3 w-3 text-[#0F6B4F]" />
                    {qp.label}
                  </button>
                );
              })}
            </div>

            {/* Input Box: Multiline Textarea supporting Enter to send and Shift+Enter for new line */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-end gap-2 shrink-0"
            >
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Hỏi K-Home về bãi xe, hóa đơn, bảo trì..."
                className="flex-1 text-xs p-2 max-h-24 min-h-[36px] resize-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F6B4F] text-foreground leading-normal"
                disabled={chatMutation.isPending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={chatMutation.isPending || !inputMessage.trim()}
                className="h-9 w-9 shrink-0 rounded-xl bg-[#0F6B4F] hover:bg-[#0c5942] text-white cursor-pointer shadow-xs"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export const KHomeAIAssistant = ResidentAIAssistant;
export default ResidentAIAssistant;
