import type { Metadata, Viewport } from 'next';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import './globals.css';
import VercelAnalytics from '@/components/analytics/VercelAnalytics';
import UmamiAnalytics from '@/components/analytics/UmamiAnalytics';
import SessionProvider from '@/components/providers/SessionProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import PWAProvider from '@/components/providers/PWAProvider';
import CapacitorProvider from '@/components/providers/CapacitorProvider';
import MainContainer from '@/components/providers/MainContainer';
import MaintenanceGate from '@/components/site/MaintenanceGate';
import { SiteBrandingProvider } from '@/contexts/SiteBrandingContext';
import { getSiteBrandingForLayout, getSiteLogoUrl } from '@/lib/site-branding';
import { SearchProvider } from '@/contexts/SearchContext';
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ logoUrl, logoDisplayUrl }, siteLogoForMeta] = await Promise.all([
    getSiteBrandingForLayout(),
    getSiteLogoUrl(),
  ]);

  const orgLogoUrl = siteLogoForMeta ?? `${baseUrl}/icon-512.png`;

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
          target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: SITE_NAME,
        url: baseUrl,
        logo: { '@type': 'ImageObject', url: orgLogoUrl },
      },
    ],
  };

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased font-sans bg-gray-200" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#main" className="skip-link">
          رفتن به محتوای اصلی
        </a>
        <SessionProvider>
          <QueryProvider>
            <SiteBrandingProvider logoUrl={logoUrl} logoDisplayUrl={logoDisplayUrl}>
              <SearchProvider>
                <PWAProvider>
                  <CapacitorProvider>
                    <MaintenanceGate>
                      <MainContainer>{children}</MainContainer>
                    </MaintenanceGate>
                  </CapacitorProvider>
                </PWAProvider>
              </SearchProvider>
            </SiteBrandingProvider>
          </QueryProvider>
        </SessionProvider>
        <VercelAnalytics />
        <UmamiAnalytics />
      </body>
    </html>
  );
}

