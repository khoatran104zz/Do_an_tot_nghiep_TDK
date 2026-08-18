'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Building2, UserCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [activeTab, setActiveTab] = useState<'MANAGER' | 'RESIDENT'>('MANAGER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fillDemoAccount = (role: 'MANAGER' | 'RESIDENT') => {
    setActiveTab(role);
    if (role === 'MANAGER') {
      setEmail('admin@building.com');
      setPassword('admin123');
    } else {
      setEmail('resident@building.com');
      setPassword('resident123');
    }
    toast.info(`Đã điền tài khoản mẫu ${role === 'MANAGER' ? 'Ban Quản Lý' : 'Cư Dân'}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || 'Đăng nhập thất bại. Kiểm tra lại thông tin!');
      } else {
        toast.success('Đăng nhập thành công!');
        if (activeTab === 'RESIDENT') {
          router.push('/home');
        } else {
          router.push(callbackUrl.includes('/home') ? '/dashboard' : callbackUrl);
        }
        router.refresh();
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-200/80 shadow-xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        {/* Role Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 mb-2">
          <button
            type="button"
            onClick={() => setActiveTab('MANAGER')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'MANAGER'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Ban Quản Lý
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RESIDENT')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'RESIDENT'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            Cư Dân
          </button>
        </div>

        <CardTitle className="text-lg text-center font-bold text-slate-800">
          {activeTab === 'MANAGER' ? 'Đăng nhập Ban Quản Lý' : 'Đăng nhập Cư Dân'}
        </CardTitle>
        <CardDescription className="text-center text-xs">
          Vui lòng nhập email và mật khẩu của bạn để tiếp tục
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Mật khẩu</label>
              <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                Quên mật khẩu?
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-10 font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
            Tài khoản dùng thử nhanh (Demo)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs border-dashed border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100"
              onClick={() => fillDemoAccount('MANAGER')}
            >
              BQL (Admin)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs border-dashed border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
              onClick={() => fillDemoAccount('RESIDENT')}
            >
              Cư Dân
            </Button>
          </div>
        </div>

        {/* Register Footer */}
        {activeTab === 'RESIDENT' && (
          <p className="text-center text-xs text-slate-500 pt-2">
            Bạn chưa có tài khoản?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Đăng ký tài khoản cư dân
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-600/30 mb-3">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SMART APARTMENT</h1>
          <p className="text-sm text-slate-500 mt-1">Hệ thống Quản lý Chung cư Thông minh</p>
        </div>

        <Suspense fallback={<div className="p-8 text-center bg-white rounded-xl shadow-md text-sm text-slate-500">Đang tải...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
