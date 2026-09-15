'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  Crown,
  Wrench,
  Shield,
  PhoneCall,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Zap,
  Radio,
  Clock,
  HelpCircle,
  X,
  Phone,
  MessageSquare,
  BadgePercent,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export type UserRole =
  | 'RESIDENT'
  | 'MANAGER'
  | 'ADMIN'
  | 'STAFF_TECHNICIAN'
  | 'STAFF_SECURITY'
  | 'STAFF_RECEPTIONIST';

type RoleCategory = 'RESIDENT' | 'MANAGEMENT' | 'OPERATIONS';

interface RoleConfig {
  role: UserRole;
  category: RoleCategory;
  title: string;
  subtitle: string;
  badge: string;
  colorName: string;
  email: string;
  passwordDefault: string;
  name: string;
  targetPortal: string;
  portalPath: string;
  theme: {
    accent: string;
    border: string;
    bgBadge: string;
    textBadge: string;
    gradientBtn: string;
    ringColor: string;
    glowColor: string;
  };
  features: string[];
}

const ROLES_CONFIG: Record<UserRole, RoleConfig> = {
  RESIDENT: {
    role: 'RESIDENT',
    category: 'RESIDENT',
    title: 'Cổng Cư Dân Căn Hộ',
    subtitle: 'Dành cho Chủ hộ, Người thuê và Thành viên gia đình sinh sống tại tòa nhà',
    badge: 'Cư Dân Tòa Nhà',
    colorName: 'emerald',
    email: 'resident@building.com',
    passwordDefault: 'resident123',
    name: 'Nguyễn Văn An (Căn A-1204)',
    targetPortal: 'Cổng Dịch Vụ Cư Dân',
    portalPath: '/home',
    theme: {
      accent: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/40 dark:border-emerald-500/30',
      bgBadge: 'bg-emerald-50 dark:bg-emerald-950/60',
      textBadge: 'text-emerald-700 dark:text-emerald-300',
      gradientBtn: 'from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/25',
      ringColor: 'focus:ring-emerald-500/20 focus:border-emerald-500',
      glowColor: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    },
    features: [
      'Tra cứu & thanh toán hóa đơn dịch vụ, điện nước trực tuyến',
      'Đăng ký thẻ khách ra vào với mã QR bảo vệ tự động',
      'Gửi phản ánh sự cố kỹ thuật & đánh giá chất lượng xử lý',
      'Đăng ký sử dụng tiện ích nội khu (Hồ bơi, BBQ, Tennis)',
    ],
  },
  MANAGER: {
    role: 'MANAGER',
    category: 'MANAGEMENT',
    title: 'Ban Quản Lý Tòa Nhà',
    subtitle: 'Dành cho Trưởng Ban Quản Lý, Điều phối viên nghiệp vụ vận hành',
    badge: 'Trưởng BQL',
    colorName: 'blue',
    email: 'manager@building.com',
    passwordDefault: 'manager123',
    name: 'Trần Minh Đức (Trưởng BQL)',
    targetPortal: 'Bảng Điều Khiển Vận Hành',
    portalPath: '/dashboard',
    theme: {
      accent: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/40 dark:border-blue-500/30',
      bgBadge: 'bg-blue-50 dark:bg-blue-950/60',
      textBadge: 'text-blue-700 dark:text-blue-300',
      gradientBtn: 'from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-600/25',
      ringColor: 'focus:ring-blue-500/20 focus:border-blue-500',
      glowColor: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    },
    features: [
      'Bảng điều hành tổng quan chỉ số KPI, tỷ lệ lấp đầy, thu phí',
      'Quản lý cấu trúc BĐS: Tòa nhà → Khối tháp → Tầng lầu → Căn hộ',
      'Phát hành hóa đơn định kỳ, theo dõi công nợ & phiếu thu',
      'Quản lý hợp đồng cư dân, phân công nhân sự & theo dõi SLA',
    ],
  },
  ADMIN: {
    role: 'ADMIN',
    category: 'MANAGEMENT',
    title: 'Quản Trị Viên Hệ Thống',
    subtitle: 'Quyền hạn tối cao: Cấu hình hệ thống, bảo mật phân quyền & kiểm toán',
    badge: 'Super Admin',
    colorName: 'purple',
    email: 'admin@building.com',
    passwordDefault: 'admin123',
    name: 'Quản trị viên Hệ thống',
    targetPortal: 'Hệ Thống Trung Tâm',
    portalPath: '/dashboard',
    theme: {
      accent: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/40 dark:border-purple-500/30',
      bgBadge: 'bg-purple-50 dark:bg-purple-950/60',
      textBadge: 'text-purple-700 dark:text-purple-300',
      gradientBtn: 'from-purple-600 via-violet-600 to-indigo-700 hover:from-purple-700 hover:to-violet-800 shadow-purple-600/25',
      ringColor: 'focus:ring-purple-500/20 focus:border-purple-500',
      glowColor: 'from-purple-500/20 via-violet-500/10 to-transparent',
    },
    features: [
      'Toàn quyền quản trị phân quyền vai trò (RBAC) & danh mục hệ thống',
      'Theo dõi nhật ký kiểm toán (Audit Logs) & bảo mật truy cập',
      'Cấu hình biểu phí, quy trình tự động hóa IoT & tích hợp AI',
      'Quản lý danh sách nhân sự, ca trực và tài khoản người dùng',
    ],
  },
  STAFF_TECHNICIAN: {
    role: 'STAFF_TECHNICIAN',
    category: 'OPERATIONS',
    title: 'Kỹ Thuật Viên Vận Hành',
    subtitle: 'Xử lý sự cố kỹ thuật hạ tầng, bảo trì thiết bị và kiểm soát SLA',
    badge: 'Kỹ Thuật Viên',
    colorName: 'amber',
    email: 'technician@building.com',
    passwordDefault: 'tech123',
    name: 'Lê Hoàng Nam (Kỹ thuật Trưởng)',
    targetPortal: 'Phân Hệ Kỹ Thuật & Bảo Trì',
    portalPath: '/feedbacks',
    theme: {
      accent: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/40 dark:border-amber-500/30',
      bgBadge: 'bg-amber-50 dark:bg-amber-950/60',
      textBadge: 'text-amber-700 dark:text-amber-300',
      gradientBtn: 'from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 shadow-amber-600/25',
      ringColor: 'focus:ring-amber-500/20 focus:border-amber-500',
      glowColor: 'from-amber-500/20 via-orange-500/10 to-transparent',
    },
    features: [
      'Tiếp nhận & xử lý phiếu phản ánh sự cố từ cư dân căn hộ',
      'Giám sát kế hoạch bảo dưỡng tài sản (Thang máy, Cụm bơm, Điện)',
      'Theo dõi đồng hồ cảnh báo vi phạm cam kết thời gian SLA',
      'Nhận cảnh báo cảm biến IoT thời gian thực (Rò rỉ nước, Khói, v.v.)',
    ],
  },
  STAFF_SECURITY: {
    role: 'STAFF_SECURITY',
    category: 'OPERATIONS',
    title: 'Đội Ngũ An Ninh & Giữ Xe',
    subtitle: 'Kiểm soát phương tiện ra vào, bãi đỗ xe và quét mã QR khách thăm',
    badge: 'An Ninh / Bảo Vệ',
    colorName: 'indigo',
    email: 'security@building.com',
    passwordDefault: 'security123',
    name: 'Hoàng Văn Hùng (Đội trưởng An ninh)',
    targetPortal: 'Kiểm Soát An Ninh & Khách',
    portalPath: '/visitors',
    theme: {
      accent: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-500/40 dark:border-indigo-500/30',
      bgBadge: 'bg-indigo-50 dark:bg-indigo-950/60',
      textBadge: 'text-indigo-700 dark:text-indigo-300',
      gradientBtn: 'from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 shadow-indigo-600/25',
      ringColor: 'focus:ring-indigo-500/20 focus:border-indigo-500',
      glowColor: 'from-indigo-500/20 via-blue-500/10 to-transparent',
    },
    features: [
      'Quét mã QR Thẻ Khách Ra Vào (Check-in / Check-out tức thì)',
      'Quản lý phương tiện đăng ký của cư dân & phát hành thẻ giữ xe',
      'Ghi nhận nhật ký phương tiện ra vào cổng kiểm soát',
      'Khóa / Mở khóa thẻ xe tức thì khi phát hiện sự cố an ninh',
    ],
  },
  STAFF_RECEPTIONIST: {
    role: 'STAFF_RECEPTIONIST',
    category: 'OPERATIONS',
    title: 'Lễ Tân Sảnh Tòa Nhà',
    subtitle: 'Tiếp đón khách đến tòa nhà, quản lý bưu kiện và hỗ trợ cư dân',
    badge: 'Lễ Tân Sảnh',
    colorName: 'rose',
    email: 'receptionist@building.com',
    passwordDefault: 'recept123',
    name: 'Đỗ Thị Mai (Lễ tân Sảnh chính)',
    targetPortal: 'Quầy Lễ Tân & Bưu Kiện',
    portalPath: '/parcels',
    theme: {
      accent: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/40 dark:border-rose-500/30',
      bgBadge: 'bg-rose-50 dark:bg-rose-950/60',
      textBadge: 'text-rose-700 dark:text-rose-300',
      gradientBtn: 'from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/25',
      ringColor: 'focus:ring-rose-500/20 focus:border-rose-500',
      glowColor: 'from-rose-500/20 via-pink-500/10 to-transparent',
    },
    features: [
      'Tiếp nhận bưu kiện cư dân & gửi thông báo nhận hàng tức thì',
      'Đăng ký thẻ khách ra vào thay cho cư dân khi được ủy quyền',
      'Tra cứu thông tin liên hệ cư dân và hỗ trợ hướng dẫn cư dân',
      'Gửi thông báo bưu phẩm quá hạn lưu kho tại quầy lễ tân',
    ],
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';

  // State
  const [selectedRole, setSelectedRole] = useState<UserRole>('RESIDENT');
  const [email, setEmail] = useState('resident@building.com');
  const [password, setPassword] = useState('resident123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const activeConfig = ROLES_CONFIG[selectedRole];
  const activeCategory = activeConfig.category;

  // Change category or role
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const config = ROLES_CONFIG[role];
    setEmail(config.email);
    setPassword(config.passwordDefault);
  };

  const handleSelectCategory = (cat: RoleCategory) => {
    if (cat === 'RESIDENT') {
      handleSelectRole('RESIDENT');
    } else if (cat === 'MANAGEMENT') {
      handleSelectRole('MANAGER');
    } else {
      handleSelectRole('STAFF_TECHNICIAN');
    }
  };

  const fillCurrentDemoAccount = () => {
    setEmail(activeConfig.email);
    setPassword(activeConfig.passwordDefault);
    toast.success(`Đã điền tài khoản mẫu: ${activeConfig.name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
      } else {
        toast.success(`Đăng nhập thành công! Chào mừng ${activeConfig.name}`);

        // Intelligent destination routing
        if (callbackUrl && !callbackUrl.includes('/login') && !callbackUrl.includes('/register')) {
          router.push(callbackUrl);
        } else if (selectedRole === 'RESIDENT') {
          router.push('/home');
        } else if (selectedRole === 'STAFF_TECHNICIAN') {
          router.push('/feedbacks');
        } else if (selectedRole === 'STAFF_SECURITY') {
          router.push('/visitors');
        } else if (selectedRole === 'STAFF_RECEPTIONIST') {
          router.push('/parcels');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch {
      toast.error('Có lỗi xảy ra trong quá trình đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        {/* =========================================================================
            LEFT COLUMN: Brand Showcase & Dynamic Role Capability Display
            ========================================================================= */}
        <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-8 bg-slate-950 text-white overflow-hidden border-r border-slate-800">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-widest text-blue-400 uppercase">
                  Enterprise Solution
                </span>
                <h2 className="text-lg font-extrabold tracking-tight text-white leading-tight">
                  SMART APARTMENT
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống Quản lý Vận hành Chung cư Thông minh Chuẩn Quốc tế
            </p>
          </div>

          {/* Middle: Dynamic Role Capability Card */}
          <div className="relative z-10 my-6">
            <div className="rounded-2xl p-5 border border-slate-800/90 bg-slate-900/80 backdrop-blur-md shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>{activeConfig.badge}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {activeConfig.portalPath}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">
                {activeConfig.title}
              </h3>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                {activeConfig.subtitle}
              </p>

              <div className="space-y-2.5 pt-3 border-t border-slate-800">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Đặc quyền vai trò:
                </p>
                {activeConfig.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-400 shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Sample User Hint */}
              <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Tài khoản trải nghiệm mẫu:</span>
                  <span className="font-semibold text-slate-200">{activeConfig.name}</span>
                </div>
                <button
                  type="button"
                  onClick={fillCurrentDemoAccount}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 transition-all cursor-pointer"
                >
                  Tự điền
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Live System Metrics */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Building2 className="h-3.5 w-3.5 text-blue-400" />
                <span>202 Căn hộ</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
                <span>IoT Sensor 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                <span>Bảo mật JWT 2 lớp</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Interactive Multi-Role Login Form
            ========================================================================= */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Mobile Brand Bar (Visible only on small screens) */}
            <div className="lg:hidden flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  SMART APARTMENT
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hệ thống Quản lý Chung cư Thông minh
                </p>
              </div>
            </div>

            {/* Level 1: Category Segmented Switcher */}
            <div className="mb-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                1. Chọn phân hệ đăng nhập:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                {/* 1. Cư Dân */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('RESIDENT')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === 'RESIDENT'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Cư Dân</span>
                </button>

                {/* 2. Ban Quản Lý */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('MANAGEMENT')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === 'MANAGEMENT'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Ban Quản Lý</span>
                </button>

                {/* 3. Vận Hành */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('OPERATIONS')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === 'OPERATIONS'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                  <span>Đội Vận Hành</span>
                </button>
              </div>
            </div>

            {/* Level 2: Sub-role selector (for Management and Operations) */}
            {activeCategory === 'MANAGEMENT' && (
              <div className="mb-5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                  Vai trò quản lý:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('MANAGER')}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'MANAGER'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Trưởng BQL</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">manager@building.com</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('ADMIN')}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'ADMIN'
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold ring-1 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Quản Trị Viên</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">admin@building.com</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeCategory === 'OPERATIONS' && (
              <div className="mb-5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                  Bộ phận chuyên môn:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('STAFF_TECHNICIAN')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedRole === 'STAFF_TECHNICIAN'
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold ring-1 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400 mb-1" />
                    <span className="text-xs font-bold">Kỹ Thuật</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">tech123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('STAFF_SECURITY')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedRole === 'STAFF_SECURITY'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                    <span className="text-xs font-bold">An Ninh</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">security123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('STAFF_RECEPTIONIST')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedRole === 'STAFF_RECEPTIONIST'
                        ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <PhoneCall className="h-4 w-4 text-rose-600 dark:text-rose-400 mb-1" />
                    <span className="text-xs font-bold">Lễ Tân</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">recept123</span>
                  </button>
                </div>
              </div>
            )}

            {/* Role Header Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 mb-5">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className={activeConfig.theme.accent}>{activeConfig.title}</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Tài khoản: {activeConfig.name}
                </span>
              </div>
              <button
                type="button"
                onClick={fillCurrentDemoAccount}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
                title="Bấm để tự động điền thông tin đăng nhập mẫu"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>1-Click Điền Mẫu</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                  <span>Địa chỉ Email</span>
                  <span className="text-[10px] font-normal text-slate-400">Email đăng ký tòa nhà</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="email@building.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10.5 rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu đăng nhập
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-10.5 rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Ghi nhớ phiên đăng nhập (30 ngày)</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 text-sm font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer bg-linear-to-r ${activeConfig.theme.gradientBtn} flex items-center justify-center gap-2 mt-2`}
              >
                {isLoading ? (
                  <span>Đang xác thực bảo mật...</span>
                ) : (
                  <>
                    <span>Đăng nhập {activeConfig.targetPortal}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Chưa có tài khoản cư dân?</span>
              <Link
                href="/register"
                className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                Đăng ký tài khoản căn hộ →
              </Link>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud System
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Help Dialog */}
      <Dialog
        open={isForgotModalOpen}
        onOpenChange={setIsForgotModalOpen}
        className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      >
        <div className="p-2 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Hỗ Trợ Khôi Phục Mật Khẩu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quy trình xác thực an toàn thông qua Ban Quản Lý
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p>
              Nhằm đảm bảo an ninh và an toàn cho hệ thống căn hộ, việc cấp lại mật khẩu được quản lý nghiêm ngặt:
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                <Phone className="h-4 w-4 text-emerald-500" />
                <span>Hotline Ban Quản Lý: 1900 8899 (Phím 1)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                <Mail className="h-4 w-4 text-blue-500" />
                <span>Email hỗ trợ: hotro@smartapt.vn</span>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              * Nếu đang trong môi trường thử nghiệm / Demo, bạn chỉ cần bấm nút <b>&ldquo;1-Click Điền Mẫu&rdquo;</b> ở đầu form để lấy lại mật khẩu mẫu tức thì!
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs h-9 px-4"
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-100 via-slate-200/50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      <Suspense
        fallback={
          <div className="w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6">
            <Skeleton className="h-12 w-1/3 rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
