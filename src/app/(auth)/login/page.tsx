'use client';

import React, { useState, Suspense } from 'react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
import { Skeleton } from '@/components/ui/skeleton';

function LoginPageContent() {
  const [activeRoleBadge, setActiveRoleBadge] = useState('Căn hộ A-1204');

  return (
    <AuthLayout
      brandingProps={{
        quote: 'Smart Living, Better Together',
        supportingText:
          'Nền tảng quản lý vận hành chung cư thông minh toàn diện — Sống Thông Minh · Gắn Kết Cộng Đồng.',
        activeRoleBadge,
      }}
    >
      <LoginForm onRoleChange={setActiveRoleBadge} />
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-10 w-48 mx-auto rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
