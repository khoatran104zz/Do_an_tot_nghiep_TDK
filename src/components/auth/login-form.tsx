'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Sparkles,
  PhoneCall,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { KHomeLogo } from '@/components/shared/KHomeLogo';
import { cn } from '@/lib/utils';

export type UserRole =
  | 'RESIDENT'
  | 'MANAGER'
  | 'ADMIN'
  | 'STAFF_TECHNICIAN'
  | 'STAFF_SECURITY'
  | 'STAFF_RECEPTIONIST';

interface RoleOption {
  role: UserRole;
  label: string;
  badge: string;
  email: string;
  passwordDefault: string;
  name: string;
  destination: string;
}

const DEMO_ROLES: RoleOption[] = [
  {
    role: 'RESIDENT',
    label: 'Cư dân',
    badge: 'Căn hộ A-1204',
    email: 'resident@building.com',
    passwordDefault: 'resident123',
    name: 'Nguyễn Văn An (Cư dân A-1204)',
    destination: '/home',
  },
  {
    role: 'MANAGER',
    label: 'Ban Quản Lý',
    badge: 'Trưởng BQL',
    email: 'manager@building.com',
    passwordDefault: 'manager123',
    name: 'Trần Minh Đức (Trưởng BQL)',
    destination: '/dashboard',
  },
  {
    role: 'STAFF_TECHNICIAN',
    label: 'Kỹ thuật',
    badge: 'SLA & Thiết bị',
    email: 'technician@building.com',
    passwordDefault: 'tech123',
    name: 'Lê Hoàng Nam (Kỹ thuật Trưởng)',
    destination: '/feedbacks',
  },
  {
    role: 'STAFF_SECURITY',
    label: 'An ninh',
    badge: 'Quét thẻ & QR',
    email: 'security@building.com',
    passwordDefault: 'security123',
    name: 'Hoàng Văn Hùng (Đội trưởng An ninh)',
    destination: '/visitors',
  },
  {
    role: 'STAFF_RECEPTIONIST',
    label: 'Lễ tân',
    badge: 'Bưu phẩm & Khách',
    email: 'receptionist@building.com',
    passwordDefault: 'reception123',
    name: 'Phạm Thu Trang (Lễ tân sảnh)',
    destination: '/parcels',
  },
  {
    role: 'ADMIN',
    label: 'Quản trị',
    badge: 'Super Admin',
    email: 'admin@building.com',
    passwordDefault: 'admin123',
    name: 'Quản trị viên Hệ thống',
    destination: '/dashboard',
  },
];

export interface LoginFormProps {
  onRoleChange?: (roleBadge: string) => void;
  className?: string;
}

/**
 * LoginForm Component
 * Clean, accessible authentication form designed according to modern two-column standards:
 * - Redesigned brand logo
 * - Clear typography hierarchy ("Welcome back" / "Đăng nhập")
 * - Password visibility toggle
 * - Fast one-click demo role switcher for evaluators and staff
 * - Full NextAuth integration with intelligent destination routing
 */
export function LoginForm({ onRoleChange, className }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';

  const [selectedRole, setSelectedRole] = useState<UserRole>('RESIDENT');
  const [email, setEmail] = useState('resident@building.com');
  const [password, setPassword] = useState('resident123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const activeRoleOption = DEMO_ROLES.find((r) => r.role === selectedRole) || DEMO_ROLES[0];

  const handleSelectDemoRole = (opt: RoleOption) => {
    setSelectedRole(opt.role);
    setEmail(opt.email);
    setPassword(opt.passwordDefault);
    onRoleChange?.(opt.badge);
    toast.info(`Đã chọn tài khoản mẫu: ${opt.name}`);
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
        toast.success(`Đăng nhập thành công! Chào mừng ${activeRoleOption.name}`);

        if (callbackUrl && !callbackUrl.includes('/login') && !callbackUrl.includes('/register')) {
          router.push(callbackUrl);
        } else {
          router.push(activeRoleOption.destination);
        }
        router.refresh();
      }
    } catch {
      toast.error('Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('w-full max-w-md mx-auto space-y-6', className)}>
      {/* ── Mobile Brand Bar (Visible only on small screens) ── */}
      <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <KHomeLogo variant="horizontal" size="sm" showSlogan={false} href="/" />
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5ED] text-[#0F6B4F] dark:bg-emerald-950/60 dark:text-emerald-300">
          Smart Apartment
        </span>
      </div>

      {/* ── Form Header ── */}
      <div className="space-y-1.5 text-left">
        <div className="hidden lg:flex items-center gap-2 mb-3">
          <KHomeLogo variant="horizontal" size="sm" showSlogan={false} href="/" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Chào mừng trở lại
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Đăng nhập vào hệ thống quản lý Smart Apartment của bạn
        </p>
      </div>

      {/* ── Demo Accounts Quick Switcher ── */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Tài khoản trải nghiệm mẫu:</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">1-Click Login</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {DEMO_ROLES.map((opt) => {
            const isSelected = selectedRole === opt.role;
            return (
              <button
                key={opt.role}
                type="button"
                onClick={() => handleSelectDemoRole(opt)}
                className={cn(
                  'px-2 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center text-center',
                  isSelected
                    ? 'bg-[#0F6B4F] text-white shadow-sm shadow-[#0F6B4F]/30 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#E8F5ED]/60 dark:hover:bg-slate-800 hover:text-[#0F6B4F]'
                )}
              >
                <span>{opt.label}</span>
                <span
                  className={cn(
                    'text-[9px] tracking-tight truncate max-w-full font-normal opacity-80',
                    isSelected ? 'text-emerald-100' : 'text-slate-400'
                  )}
                >
                  {opt.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Login Form ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="email-input"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
          >
            Địa chỉ Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@building.com"
              className={cn(
                'pl-10 h-11 rounded-xl text-sm transition-all',
                'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                'focus:border-[#0F6B4F] focus:ring-2 focus:ring-[#0F6B4F]/20'
              )}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Field with Visibility Toggle */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password-input"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-xs font-medium text-[#0F6B4F] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(
                'pl-10 pr-10 h-11 rounded-xl text-sm transition-all',
                'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                'focus:border-[#0F6B4F] focus:ring-2 focus:ring-[#0F6B4F]/20'
              )}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
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
              className="rounded border-slate-300 dark:border-slate-700 text-[#0F6B4F] focus:ring-[#0F6B4F] h-4 w-4 cursor-pointer"
            />
            <span>Ghi nhớ đăng nhập trên thiết bị này</span>
          </label>
        </div>

        {/* Primary Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full h-11 rounded-xl font-bold text-sm text-white transition-all cursor-pointer shadow-md',
            'bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] shadow-[#0F6B4F]/20'
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xác thực thông tin...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Đăng nhập</span>
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {/* ── Divider & Register Link ── */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chưa có tài khoản cư dân?{' '}
          <Link
            href="/register"
            className="font-bold text-[#0F6B4F] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Đăng ký ngay</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>

      {/* ── Forgot Password Dialog Modal ── */}
      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5ED] dark:bg-emerald-950/60 border border-[#22C55E]/40 flex items-center justify-center text-[#0F6B4F] dark:text-emerald-400 mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Khôi phục quyền truy cập
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Vì lý do an toàn bảo mật căn hộ, vui lòng thực hiện theo một trong các phương thức sau:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
              <PhoneCall className="w-4 h-4 text-[#0F6B4F] dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  Hotline Ban Quản Lý (24/7):
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-sm">
                  1900 888 999 - Ext: 101
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
              <Building2 className="w-4 h-4 text-[#0F6B4F] dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  Quầy Dịch Vụ Khách Hàng (Sảnh A):
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Xuất trình CMND/CCCD hoặc hợp đồng thuê/sở hữu để được cấp lại mật khẩu trong 3 phút.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="bg-[#0F6B4F] text-white hover:bg-[#0c5942] rounded-xl text-xs font-semibold h-9 px-4"
            >
              Đã hiểu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LoginForm;
