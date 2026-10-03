'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Home,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegisterUser } from '@/hooks/use-auth';
import { KHomeLogo } from '@/components/shared/KHomeLogo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface RegisterFormProps {
  className?: string;
}

/**
 * RegisterForm Component
 * Visually unified with LoginForm, using standard shadcn/ui components:
 * - Clear field validation and password confirmation match check
 * - Password visibility toggles
 * - Terms of service & privacy compliance agreement
 * - Seamless integration with useRegisterUser mutation
 */
export function RegisterForm({ className }: RegisterFormProps) {
  const router = useRouter();
  const registerMutation = useRegisterUser();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    identityCard: '',
    apartmentCode: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const isPasswordMatch =
    formData.password && formData.confirmPassword
      ? formData.password === formData.confirmPassword
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.identityCard.trim() || !formData.password) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    if (!formData.agreeTerms) {
      toast.error('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }

    registerMutation.mutate(
      {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        identityCard: formData.identityCard.trim(),
        password: formData.password,
        apartmentCode: formData.apartmentCode.trim() || undefined,
      },
      {
        onSuccess: () => {
          router.push('/login');
        },
      }
    );
  };

  return (
    <div className={cn('w-full max-w-lg mx-auto space-y-6', className)}>
      {/* ── Mobile Brand Bar ── */}
      <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <KHomeLogo variant="horizontal" size="sm" showSlogan={false} href="/" />
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5ED] text-[#0F6B4F] dark:bg-emerald-950/60 dark:text-emerald-300">
          Đăng ký mới
        </span>
      </div>

      {/* ── Form Header ── */}
      <div className="space-y-1.5 text-left">
        <div className="hidden lg:flex items-center gap-2 mb-2">
          <KHomeLogo variant="horizontal" size="sm" showSlogan={false} href="/" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Tạo tài khoản cư dân
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Gia nhập cộng đồng cư dân thông minh Smart Apartment
        </p>
      </div>

      {/* ── Registration Form ── */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        {/* Full Name */}
        <div className="space-y-1">
          <label
            htmlFor="reg-fullName"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Họ và tên cư dân (*)
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="reg-fullName"
              name="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={handleChange}
              className={cn(
                'pl-10 h-10 rounded-xl text-sm transition-all',
                'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                'focus:border-[#0F6B4F] focus:ring-2 focus:ring-[#0F6B4F]/20'
              )}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="reg-email"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Địa chỉ Email (*)
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="reg-email"
              name="email"
              type="email"
              placeholder="cudan@building.com"
              value={formData.email}
              onChange={handleChange}
              className={cn(
                'pl-10 h-10 rounded-xl text-sm transition-all',
                'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                'focus:border-[#0F6B4F] focus:ring-2 focus:ring-[#0F6B4F]/20'
              )}
              required
            />
          </div>
        </div>

        {/* Phone & Identity Card (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label
              htmlFor="reg-phone"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Số điện thoại (*)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="reg-phone"
                name="phone"
                type="tel"
                placeholder="0987 654 321"
                value={formData.phone}
                onChange={handleChange}
                className={cn(
                  'pl-10 h-10 rounded-xl text-sm transition-all',
                  'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                  'focus:border-[#0F6B4F] focus:ring-2 focus:ring-[#0F6B4F]/20'
                )}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="reg-identityCard"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Số CCCD/CMND (*)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="reg-identityCard"
                name="identityCard"
                type="text"
                placeholder="012345678901"
                value={formData.identityCard}
                onChange={handleChange}
                className={cn(
                  'pl-10 h-10 rounded-xl text-sm transition-all',
                  'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                  'focus:border-[#0F6B4F] focus:ring-2 focus:ring-[#0F6B4F]/20'
                )}
                required
              />
            </div>
          </div>
        </div>

        {/* Apartment Code (Optional) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="reg-apartmentCode"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Mã căn hộ (Nếu đã có bàn giao)
            </label>
            <span className="text-[11px] text-slate-400">Không bắt buộc</span>
          </div>
          <div className="relative">
            <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="reg-apartmentCode"
              name="apartmentCode"
              type="text"
              placeholder="Ví dụ: A-1204"
              value={formData.apartmentCode}
              onChange={handleChange}
              className={cn(
                'pl-10 h-10 rounded-xl text-sm transition-all',
                'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                'focus:border-[#0F6B4F] focus:ring-2 focus:ring-[#0F6B4F]/20'
              )}
            />
          </div>
        </div>

        {/* Password & Confirm Password (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label
              htmlFor="reg-password"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Mật khẩu (*)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                onChange={handleChange}
                className={cn(
                  'pl-10 pr-9 h-10 rounded-xl text-sm transition-all',
                  'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                  'focus:border-[#0F6B4F] focus:ring-2 focus:ring-[#0F6B4F]/20'
                )}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reg-confirmPassword"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Xác nhận mật khẩu (*)
              </label>
              {isPasswordMatch !== null && (
                <span
                  className={cn(
                    'text-[10px] font-bold flex items-center gap-0.5',
                    isPasswordMatch ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  )}
                >
                  {isPasswordMatch ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Khớp</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      <span>Không khớp</span>
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="reg-confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={cn(
                  'pl-10 pr-9 h-10 rounded-xl text-sm transition-all',
                  'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                  isPasswordMatch === false
                    ? 'border-[#EF4444] focus:ring-[#EF4444]/20'
                    : isPasswordMatch === true
                    ? 'border-[#22C55E] focus:ring-[#22C55E]/20'
                    : 'focus:border-[#0F6B4F] focus:ring-[#0F6B4F]/20'
                )}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Terms and Privacy Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 leading-normal">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-[#0F6B4F] focus:ring-[#0F6B4F] h-4 w-4 cursor-pointer"
            />
            <span>
              Tôi đồng ý với{' '}
              <span className="text-[#0F6B4F] dark:text-emerald-400 font-semibold hover:underline">
                Điều khoản dịch vụ
              </span>{' '}
              và{' '}
              <span className="text-[#0F6B4F] dark:text-emerald-400 font-semibold hover:underline">
                Chính sách bảo mật cư dân
              </span>{' '}
              của tòa nhà.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={registerMutation.isPending}
          className={cn(
            'w-full h-11 rounded-xl font-bold text-sm text-white transition-all cursor-pointer shadow-md mt-2',
            'bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] shadow-[#0F6B4F]/20'
          )}
        >
          {registerMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang thiết lập hồ sơ cư dân...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Đăng ký tài khoản</span>
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {/* ── Bottom Link ── */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Đã có tài khoản cư dân?{' '}
          <Link
            href="/login"
            className="font-bold text-[#0F6B4F] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Đăng nhập ngay</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterForm;
