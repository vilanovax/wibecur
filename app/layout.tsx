import type { Metadata, Viewport } from 'next';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'WibeCur - لیست‌های کیوریتد لایف‌استایل',
  description: 'کشف و اشتراک‌گذاری لیست‌های کیوریتد در حوزه لایف‌استایل',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366F1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased font-sans bg-gray-200">
        <div className="min-h-screen w-full max-w-[428px] mx-auto md:bg-white md:shadow-2xl">
          <QueryProvider>
          <SessionProvider>{children}</SessionProvider>
        </QueryProvider>
        </div>
      </body>
    </html>
  );
}

