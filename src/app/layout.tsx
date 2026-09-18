import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/lib/providers';

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'K-Home - Quản lý Chung cư Thông minh | Smart Living, Better Together',
    template: '%s | K-Home',
  },
  description:
    'K-Home: Nền tảng quản lý vận hành chung cư thông minh toàn diện. Quản lý căn hộ, cư dân, hợp đồng, hóa đơn và an ninh tự động hóa - Smart Living, Better Together.',
  applicationName: 'K-Home',
  authors: [{ name: 'K-Home Team' }],
  keywords: [
    'K-Home',
    'Smart Living',
    'Quản lý chung cư',
    'Smart Apartment',
    'Chung cư thông minh',
    'Cổng dịch vụ cư dân',
  ],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/brand/k-home-icon.svg',
  },
  openGraph: {
    title: 'K-Home - Smart Living, Better Together',
    description: 'Hệ thống Quản lý Vận hành Chung cư Thông minh Chuẩn Quốc tế',
    siteName: 'K-Home',
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={poppins.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && supportDarkMode)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}


