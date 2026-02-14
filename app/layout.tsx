import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import SessionProvider from '@/components/providers/SessionProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import PWAProvider from '@/components/providers/PWAProvider';
import { getBaseUrl, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME } from '@/lib/seo';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${SITE_NAME} - لیست‌های کیوریتد لایف‌استایل`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  manifest: '/manifest.json',
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: baseUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - لیست‌های کیوریتد لایف‌استایل`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - لیست‌های کیوریتد لایف‌استایل`,
    description: SITE_DESCRIPTION,
    images: ['/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'fa-IR',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/lists?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: SITE_NAME,
        url: baseUrl,
        logo: { '@type': 'ImageObject', url: `${baseUrl}/icon-512.png` },
      },
    ],
  };

  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased font-sans bg-gray-200">
        <a
          href="#main"
          className="skip-link"
        >
          رفتن به محتوای اصلی
        </a>
        <div className="min-h-screen w-full max-w-[428px] mx-auto md:bg-white md:shadow-2xl" id="main" role="main">
          <PWAProvider>
            <QueryProvider>
              <SessionProvider>{children}</SessionProvider>
            </QueryProvider>
          </PWAProvider>
        <Analytics />
        </div>
      </body>
    </html>
  );
}

