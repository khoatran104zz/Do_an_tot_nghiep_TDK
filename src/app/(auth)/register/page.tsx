'use client';

import React, { Suspense } from 'react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { RegisterForm } from '@/components/auth/register-form';
import { Skeleton } from '@/components/ui/skeleton';

function RegisterPageContent() {
  return (
    <AuthLayout
      brandingProps={{
        quote: 'Smart Living, Better Together',
        supportingText:
          'Gia nhập cộng đồng cư dân thông minh — Kết nối ban quản lý, tiện ích số hóa và trải nghiệm sống tiện nghi hiện đại.',
        activeRoleBadge: 'Đăng Ký Cư Dân',
      }}
    >
      <RegisterForm />
    </AuthLayout>
  );
}

export default function RegisterPage() {
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
      <RegisterPageContent />
    </Suspense>
  );
}
