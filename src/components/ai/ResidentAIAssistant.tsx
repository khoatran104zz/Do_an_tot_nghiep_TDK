'use client';

import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useAIChat } from '@/hooks/use-ai';
import { cn } from '@/lib/utils';

interface ChatItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export function ResidentAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ Lý Cư Dân AI. Tôi có thể hỗ trợ bạn tra cứu hóa đơn tháng này, các khoản nợ quá hạn, lịch mở cửa tiện ích (gym, bể bơi) hoặc hướng dẫn báo sự cố sửa chữa. Bạn cần trợ giúp điều gì hôm nay?',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = useAIChat();

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
        text: 'AI Assistant hiện không khả dụng. Bạn vẫn có thể sử dụng các chức năng thông thường trên ứng dụng.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    }
  };

  const quickPrompts = [
    { label: 'Tháng này phải đóng bao nhiêu?', query: 'Tháng này tôi phải đóng bao nhiêu tiền?', icon: CreditCard },
    { label: 'Hóa đơn nào đang quá hạn?', query: 'Hóa đơn nào của tôi đang quá hạn?', icon: AlertTriangle },
    { label: 'Phòng gym mở đến mấy giờ?', query: 'Phòng gym mở đến mấy giờ?', icon: Clock },
    { label: 'Báo rò rỉ nước', query: 'Tôi muốn báo rò rỉ nước', icon: Wrench },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-13 w-13 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center relative cursor-pointer group transition-all duration-200 hover:scale-105"
            aria-label="Mở Trợ lý ảo AI"
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
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] h-[560px] max-h-[85vh] rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  Trợ Lý Ảo Cư Dân AI
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                </h4>
                <span className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Sẵn sàng hỗ trợ 24/7
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-xl cursor-pointer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/30">
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-blue-600" />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={cn(
                        'p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-xs',
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
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
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                <span>Trợ lý AI đang suy nghĩ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex overflow-x-auto gap-1.5 no-scrollbar">
            {quickPrompts.map((qp, i) => {
              const Icon = qp.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(qp.query)}
                  disabled={chatMutation.isPending}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
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
              placeholder="Hỏi về tiền phí, tiện ích, sự cố..."
              className="text-xs h-9 rounded-xl focus-visible:ring-blue-600"
              disabled={chatMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={chatMutation.isPending || !inputMessage.trim()}
              className="h-9 w-9 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
