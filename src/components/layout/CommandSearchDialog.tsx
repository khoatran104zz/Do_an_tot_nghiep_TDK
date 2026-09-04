'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CreditCard,
  Receipt,
  MessageSquareWarning,
  Bell,
  Home,
  X,
  ArrowRight,
} from 'lucide-react';
import { useShell } from './ShellContext';

interface SearchItem {
  name: string;
  category: string;
  href: string;
  icon: React.ElementType;
  keywords: string;
}

const searchItems: SearchItem[] = [
  { name: 'Bảng điều khiển', category: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard, keywords: 'dashboard kpi thong ke tong quan' },
  { name: 'Quản lý Căn hộ', category: 'Căn hộ & Cư dân', href: '/apartments', icon: Building2, keywords: 'can ho phong tang toa nha toa a toa b dien tich' },
  { name: 'Quản lý Cư dân', category: 'Căn hộ & Cư dân', href: '/residents', icon: Users, keywords: 'cu dan chu ho thue cccd sdt nguoi o' },
  { name: 'Quản lý Hợp đồng', category: 'Căn hộ & Cư dân', href: '/contracts', icon: FileText, keywords: 'hop dong thue mua ban het han tien coc' },
  { name: 'Quản lý Hóa đơn', category: 'Tài chính', href: '/invoices', icon: Receipt, keywords: 'hoa don tien dien nuoc phi quan ly thanh toan' },
  { name: 'Danh mục Phí dịch vụ', category: 'Tài chính', href: '/fees', icon: CreditCard, keywords: 'danh muc phi don gia xe may oto kwh' },
  { name: 'Phản ánh & Sự cố', category: 'Vận hành', href: '/feedbacks', icon: MessageSquareWarning, keywords: 'su co hong hoc bao tri sua chua dien nuoc thang may' },
  { name: 'Thông báo Tòa nhà', category: 'Vận hành', href: '/notifications', icon: Bell, keywords: 'thong bao tin tuc bao tri pccc cat dien' },
  { name: 'Trang chủ Cư dân', category: 'Cư dân', href: '/home', icon: Home, keywords: 'home cu dan portal' },
  { name: 'Hóa đơn của tôi', category: 'Cư dân', href: '/resident/invoices', icon: Receipt, keywords: 'hoa don cu dan qr vnpay momo pdf' },
  { name: 'Gửi Phản ánh sự cố', category: 'Cư dân', href: '/resident/feedback', icon: MessageSquareWarning, keywords: 'gui phan anh bao hong danh gia 5 sao' },
  { name: 'Thông báo Cư dân', category: 'Cư dân', href: '/resident/notifications', icon: Bell, keywords: 'tin tuc thong bao bql' },
];

export function CommandSearchDialog() {
  const router = useRouter();
  const { isCommandOpen, setIsCommandOpen } = useShell();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = query.trim()
    ? searchItems.filter((item) =>
        (item.name + ' ' + item.category + ' ' + item.keywords)
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : searchItems;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (href: string) => {
    setIsCommandOpen(false);
    setQuery('');
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].href);
    } else if (e.key === 'Escape') {
      setIsCommandOpen(false);
    }
  };

  if (!isCommandOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCommandOpen(false)}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
        {/* Search Input */}
        <div className="flex items-center border-b border-slate-100 px-4 py-3 gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm nhanh chức năng, màn hình... (VD: Căn hộ, Hóa đơn)"
            className="w-full text-sm outline-none text-slate-800 placeholder:text-slate-400 bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Search className="h-8 w-8 text-slate-300 mx-auto mb-2 stroke-1" />
              <p className="font-semibold text-slate-700">Không tìm thấy kết quả phù hợp</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Thử gõ từ khóa khác như "căn hộ", "hóa đơn", "hợp đồng"</p>
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.category}</p>
                    </div>
                  </div>
                  <ArrowRight
                    className={`h-4 w-4 ${
                      isSelected ? 'text-blue-600 opacity-100' : 'text-slate-300 opacity-0'
                    } transition-all`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between p-2.5 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Dùng phím</span>
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600">↑</kbd>
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600">↓</kbd>
            <span>để di chuyển</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600">ENTER</kbd>
            <span>để mở</span>
          </div>
        </div>
      </div>
    </div>
  );
}
