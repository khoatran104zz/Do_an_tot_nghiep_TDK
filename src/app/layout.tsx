import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/lib/providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

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
    <html lang="vi" suppressHydrationWarning className={plusJakartaSans.variable}>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

