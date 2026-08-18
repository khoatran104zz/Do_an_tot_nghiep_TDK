import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'Hệ thống Quản lý Chung cư Thông minh',
  description: 'Nền tảng quản lý tòa nhà chung cư, căn hộ, cư dân, hợp đồng và hóa đơn dịch vụ thông minh.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
