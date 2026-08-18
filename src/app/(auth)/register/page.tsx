'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, User, Mail, Phone, CreditCard, Home, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRegisterUser } from '@/hooks/use-auth';

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterUser();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    identityCard: '',
    password: '',
    apartmentCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData, {
      onSuccess: () => {
        router.push('/login');
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10 my-8">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30 mb-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">ĐĂNG KÝ TÀI KHOẢN CƯ DÂN</h1>
          <p className="text-xs text-slate-500 mt-1">Điền thông tin cá nhân để kết nối với căn hộ của bạn</p>
        </div>

        <Card className="border-slate-200/80 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base text-center font-bold text-slate-800">
              Thông tin hồ sơ cư dân
            </CardTitle>
            <CardDescription className="text-center text-xs">
              Thông tin này sẽ được Ban Quản Lý dùng để xác minh căn hộ
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Họ và Tên (*)</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    name="fullName"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Địa chỉ Email (*)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Số Điện thoại (*)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      name="phone"
                      placeholder="0987654321"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Số CCCD/CMND (*)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      name="identityCard"
                      placeholder="012345678901"
                      value={formData.identityCard}
                      onChange={handleChange}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Mã Căn hộ (Nếu có)</label>
                <div className="relative">
                  <Home className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    name="apartmentCode"
                    placeholder="Ví dụ: A-1001"
                    value={formData.apartmentCode}
                    onChange={handleChange}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Mật khẩu (*)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 mt-2"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 pt-4">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
