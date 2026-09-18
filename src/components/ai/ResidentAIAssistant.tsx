'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { useAIChat } from '@/hooks/use-ai';
import { cn } from '@/lib/utils';

interface ChatItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
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
    title: 'Trợ Lý Quản Trị K-Home AI',
    subtitle: 'Hỗ trợ Điều hành 24/7',
    badge: 'Super Admin',
    welcomeMessage:
      'Xin chào Quản trị viên! Tôi là Trợ Lý Quản Trị K-Home AI. Tôi có thể cung cấp nhanh báo cáo tổng quan vận hành tòa nhà, số liệu công nợ chưa thu, số lượng sự cố mở và các cảnh báo cảm biến IoT. Bạn cần tra cứu số liệu nào?',
    quickPrompts: [
      { label: 'Báo cáo tổng quan hôm nay', query: 'Báo cáo tổng quan tình hình vận hành hôm nay', icon: BarChart3 },
      { label: 'Tình hình công nợ chưa thu', query: 'Tình hình công nợ và hóa đơn chưa thu thế nào?', icon: CreditCard },
      { label: 'Sự cố đang chờ xử lý', query: 'Có bao nhiêu sự cố kỹ thuật đang chờ xử lý?', icon: Wrench },
      { label: 'Cảnh báo cảm biến IoT', query: 'Tình hình các cảm biến IoT và cảnh báo ra sao?', icon: AlertTriangle },
    ],
  },
  MANAGER: {
    title: 'Trợ Lý Quản Trị K-Home AI',
    subtitle: 'Hỗ trợ Điều hành 24/7',
    badge: 'Ban Quản Lý',
    welcomeMessage:
      'Xin chào Quản lý! Tôi là Trợ Lý Quản Trị K-Home AI. Tôi có thể hỗ trợ bạn tra cứu nhanh tổng quan vận hành tòa nhà, số liệu công nợ chưa thu, các sự cố kỹ thuật đang chờ phân công và cảnh báo cảm biến IoT.',
    quickPrompts: [
      { label: 'Báo cáo tổng quan hôm nay', query: 'Báo cáo tổng quan tình hình vận hành hôm nay', icon: BarChart3 },
      { label: 'Tình hình công nợ chưa thu', query: 'Tình hình công nợ và hóa đơn chưa thu thế nào?', icon: CreditCard },
      { label: 'Sự cố đang chờ xử lý', query: 'Có bao nhiêu sự cố kỹ thuật đang chờ xử lý?', icon: Wrench },
      { label: 'Cảnh báo cảm biến IoT', query: 'Tình hình các cảm biến IoT và cảnh báo ra sao?', icon: AlertTriangle },
    ],
  },
  STAFF_TECHNICIAN: {
    title: 'Trợ Lý Kỹ Thuật K-Home AI',
    subtitle: 'Kỹ thuật & IoT 24/7',
    badge: 'Kỹ thuật viên',
    welcomeMessage:
      'Chào anh/chị kỹ thuật viên! Tôi là Trợ Lý Kỹ Thuật K-Home AI. Tôi sẵn sàng hỗ trợ bạn theo dõi các phiếu sự cố đang mở, lịch bảo trì định kỳ thiết bị, kiểm tra cảm biến IoT hoặc hướng dẫn quy trình sửa chữa chuẩn.',
    quickPrompts: [
      { label: 'Sự cố đang mở hôm nay', query: 'Hôm nay có những sự cố kỹ thuật nào đang mở?', icon: Wrench },
      { label: 'Lịch bảo trì định kỳ', query: 'Kiểm tra lịch bảo trì định kỳ thiết bị', icon: Clock },
      { label: 'Cảm biến bất thường', query: 'Có cảm biến IoT nào đang bất thường không?', icon: AlertTriangle },
      { label: 'Quy trình xử lý rò nước', query: 'Quy trình chuẩn xử lý rò rỉ nước thế nào?', icon: ShieldCheck },
    ],
  },
  STAFF_SECURITY: {
    title: 'Trợ Lý An Ninh K-Home AI',
    subtitle: 'Kiểm soát & An ninh 24/7',
    badge: 'An ninh bảo vệ',
    welcomeMessage:
      'Chào đồng chí an ninh! Tôi là Trợ Lý An Ninh K-Home AI. Tôi có thể hỗ trợ bạn kiểm tra lượt khách ghé thăm hôm nay, quy trình kiểm soát bãi đỗ xe và hướng dẫn xử lý sự cố mất thẻ xe, phương án PCCC khẩn cấp.',
    quickPrompts: [
      { label: 'Khách hẹn hôm nay', query: 'Hôm nay có bao nhiêu lượt khách đăng ký đến?', icon: UserCheck },
      { label: 'Xử lý mất thẻ xe', query: 'Quy trình xử lý khi cư dân báo mất thẻ xe?', icon: Car },
      { label: 'Quy định đỗ xe tòa nhà', query: 'Quy định đỗ xe và gửi xe qua đêm của tòa nhà', icon: AlertTriangle },
      { label: 'Phương án khẩn cấp PCCC', query: 'Quy trình ứng phó khi có báo cháy khẩn cấp', icon: ShieldCheck },
    ],
  },
  STAFF_RECEPTIONIST: {
    title: 'Trợ Lý Lễ Tân K-Home AI',
    subtitle: 'Sảnh & Bưu kiện 24/7',
    badge: 'Lễ tân sảnh',
    welcomeMessage:
      'Chào bạn! Tôi là Trợ Lý Lễ Tân K-Home AI. Tôi có thể hỗ trợ bạn kiểm tra bưu kiện đang chờ nhận tại sảnh, danh sách khách hẹn ghé thăm hôm nay và thông tin kết nối Ban Quản Lý.',
    quickPrompts: [
      { label: 'Bưu kiện tồn tại sảnh', query: 'Hiện có bao nhiêu bưu kiện đang chờ cư dân nhận?', icon: Package },
      { label: 'Khách hẹn hôm nay', query: 'Hôm nay có khách nào đăng ký ghé thăm không?', icon: UserCheck },
      { label: 'Hotline hỗ trợ BQL', query: 'Số hotline và kênh hỗ trợ của Ban Quản Lý?', icon: PhoneCall },
    ],
  },
  RESIDENT: {
    title: 'Trợ Lý Cư Dân K-Home AI',
    subtitle: 'Smart Living 24/7',
    badge: 'Cư dân',
    welcomeMessage:
      'Xin chào! Tôi là Trợ Lý Cư Dân K-Home AI. Tôi có thể hỗ trợ bạn tra cứu hóa đơn tháng này, các khoản nợ quá hạn, lịch mở cửa tiện ích (gym, bể bơi) hoặc hướng dẫn báo sự cố sửa chữa. Bạn cần trợ giúp điều gì hôm nay?',
    quickPrompts: [
      { label: 'Tháng này phải đóng bao nhiêu?', query: 'Tháng này tôi phải đóng bao nhiêu tiền?', icon: CreditCard },
      { label: 'Hóa đơn nào đang quá hạn?', query: 'Hóa đơn nào của tôi đang quá hạn?', icon: AlertTriangle },
      { label: 'Giờ mở cửa phòng gym & hồ bơi', query: 'Phòng gym và hồ bơi mở cửa đến mấy giờ?', icon: Clock },
      { label: 'Báo rò rỉ nước / chập điện', query: 'Tôi muốn báo sự cố rò rỉ nước trong căn hộ', icon: Wrench },
    ],
  },
};

export function ResidentAIAssistant({ role: propRole }: { role?: string }) {
  const { data: session } = useSession();
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
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = useAIChat();

  // Reset welcome message if role changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: config.welcomeMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
        text: res?.response || 'Rất tiếc, tôi chưa có phản hồi cho câu hỏi này.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      const errorReply: ChatItem = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'K-Home AI Assistant hiện không khả dụng. Bạn vẫn có thể sử dụng các chức năng thông thường trên ứng dụng.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
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

      {/* Chat Drawer / Popup */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-[#0F6B4F] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Bot className="h-5 w-5" />
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
              size="icon-sm"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/50 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2.5 max-w-[85%]',
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

                  <div className="space-y-1">
                    <div
                      className={cn(
                        'p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-xs',
                        isUser
                          ? 'bg-[#0F6B4F] text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/70 dark:border-slate-700/60'
                      )}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 block px-1">
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {chatMutation.isPending && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0F6B4F]" />
                <span>Trợ lý K-Home AI đang xử lý...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Role-Specific Quick Prompts */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex overflow-x-auto gap-1.5 no-scrollbar">
            {config.quickPrompts.map((qp, i) => {
              const Icon = qp.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(qp.query)}
                  disabled={chatMutation.isPending}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#E8F5ED] hover:text-[#0F6B4F] dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Icon className="h-3 w-3" />
                  {qp.label}
                </button>
              );
            })}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập câu hỏi để K-Home AI hỗ trợ..."
              className="text-xs h-9 rounded-xl focus-visible:ring-[#0F6B4F]"
              disabled={chatMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={chatMutation.isPending || !inputMessage.trim()}
              className="h-9 w-9 shrink-0 rounded-xl bg-[#0F6B4F] hover:bg-[#0c5942] text-white cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

// Re-export alias for clean semantic usage across codebase
export const KHomeAIAssistant = ResidentAIAssistant;
export default ResidentAIAssistant;
