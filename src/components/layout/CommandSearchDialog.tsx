'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useShell } from './ShellContext';

interface NavigationItem {
  name: string;
  category: string;
  href: string;
  icon: React.ElementType;
  keywords: string;
}

const navigationItems: NavigationItem[] = [
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

interface EntityResults {
  apartments: Array<{ id: string; code: string; building: string; floor: number; status: string }>;
  residents: Array<{ id: string; fullName: string; phone: string; apartment?: { code: string } | null }>;
  invoices: Array<{ id: string; code: string; billingMonth: string; totalAmount: number; status: string; apartment?: { code: string } | null }>;
  tickets: Array<{ id: string; code: string; title: string; status: string; priority: string; apartment?: { code: string } | null }>;
}

export function CommandSearchDialog() {
  const router = useRouter();
  const { isCommandOpen, setIsCommandOpen } = useShell();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [entityResults, setEntityResults] = useState<EntityResults>({
    apartments: [],
    residents: [],
    invoices: [],
    tickets: [],
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter local navigation items
  const matchedNavigation = query.trim()
    ? navigationItems.filter((item) =>
        (item.name + ' ' + item.category + ' ' + item.keywords)
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : navigationItems;

  // Live entity search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setEntityResults({ apartments: [], residents: [], invoices: [], tickets: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setEntityResults(json.data);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  const handleSelect = (href: string) => {
    setIsCommandOpen(false);
    setQuery('');
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsCommandOpen(false);
    }
  };

  if (!isCommandOpen) return null;

  const totalEntityMatches =
    entityResults.apartments.length +
    entityResults.residents.length +
    entityResults.invoices.length +
    entityResults.tickets.length;

  const hasAnyResults = matchedNavigation.length > 0 || totalEntityMatches > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCommandOpen(false)}
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
        {/* Search Input Header */}
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 py-3.5 gap-3">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
          ) : (
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
          )}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm căn hộ, cư dân, hóa đơn, sự cố, chức năng... (Ctrl+K)"
            className="w-full text-sm outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Grouped Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {!hasAnyResults && !isSearching && (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 stroke-1" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">Không tìm thấy kết quả phù hợp</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Thử tìm theo mã căn (A-1001), tên cư dân, mã hóa đơn hoặc số điện thoại
              </p>
            </div>
          )}

          {/* 1. Group: Căn hộ */}
          {entityResults.apartments.length > 0 && (
            <div className="py-2">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-500" /> Căn hộ ({entityResults.apartments.length})
              </p>
              <div className="space-y-0.5">
                {entityResults.apartments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => handleSelect(`/apartments?search=${encodeURIComponent(apt.code)}`)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-xs">
                        {apt.code}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{apt.code}</p>
                        <p className="text-[10px] text-slate-400">{apt.building} • Tầng {apt.floor}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Group: Cư dân */}
          {entityResults.residents.length > 0 && (
            <div className="py-2">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-500" /> Cư dân ({entityResults.residents.length})
              </p>
              <div className="space-y-0.5">
                {entityResults.residents.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => handleSelect(`/residents?search=${encodeURIComponent(res.fullName)}`)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {res.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{res.fullName}</p>
                        <p className="text-[10px] text-slate-400">SĐT: {res.phone} {res.apartment?.code && `• Căn ${res.apartment.code}`}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Group: Hóa đơn */}
          {entityResults.invoices.length > 0 && (
            <div className="py-2">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-amber-500" /> Hóa đơn dịch vụ ({entityResults.invoices.length})
              </p>
              <div className="space-y-0.5">
                {entityResults.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => handleSelect(`/invoices?search=${encodeURIComponent(inv.code)}`)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{inv.code}</p>
                      <p className="text-[10px] text-slate-400">Kỳ {inv.billingMonth} {inv.apartment?.code && `• Căn ${inv.apartment.code}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600 dark:text-blue-400">{inv.totalAmount.toLocaleString('vi-VN')} đ</p>
                      <span className="text-[9px] font-semibold text-slate-400">{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Group: Sự cố & Ticket */}
          {entityResults.tickets.length > 0 && (
            <div className="py-2">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <MessageSquareWarning className="h-3.5 w-3.5 text-red-500" /> Sự cố & Phản ánh ({entityResults.tickets.length})
              </p>
              <div className="space-y-0.5">
                {entityResults.tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelect(`/feedbacks/${t.id}`)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">{t.title}</p>
                      <p className="text-[10px] text-slate-400">{t.code} {t.apartment?.code && `• Căn ${t.apartment.code}`}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Group: Điều hướng nhanh */}
          {matchedNavigation.length > 0 && (
            <div className="py-2">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Chức năng & Điều hướng ({matchedNavigation.length})
              </p>
              <div className="space-y-0.5">
                {matchedNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.category}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>Tìm nhanh theo mã căn, tên cư dân, số điện thoại, sự cố</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              ESC
            </kbd>
            <span>để đóng</span>
          </div>
        </div>
      </div>
    </div>
  );
}
