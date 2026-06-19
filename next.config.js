/** @type {import('next').NextConfig} */
const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

/** هر build یک شناسهٔ تازه — برای bust کردن cache مرورگر بعد از deploy/rebuild */
const BUILD_ID = process.env.BUILD_ID || `build-${Date.now()}`;

// next-pwa با Turbopack (پیش‌فرض Next.js 16) سازگار نیست؛ در صورت نیاز به PWA از راهنمای Next.js استفاده کنید.
let withPWA = (config) => config;

try {
  const pwaConfig = require('next-pwa')({
    dest: 'public',
    register: false, // ثبت SW فقط در PWAProvider و فقط اگر sw.js موجود باشد
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
  });
  withPWA = pwaConfig;
} catch {
  // PWA اختیاری؛ manifest و آیکون‌ها از public/ سرو می‌شوند
}

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  generateBuildId: async () => BUILD_ID,
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  async headers() {
    // هدرهای امنیتی سراسری. CSP عمداً اینجا نیست چون نیاز به تست دقیق با
    // Sentry/اسکریپت‌های inline دارد (فاز بعد).
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ];
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  images: {
    // فرمت‌های مدرن برای کاهش حجم (وقتی تصاویر از next/image عبور کنند).
    formats: ['image/avif', 'image/webp'],
    // SVG ریموت غیرفعال — جلوگیری از XSS از طریق SVG اسکریپت‌دار.
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    // یادداشت امنیتی: `hostname: '**'` هر هاست HTTPS را برای بهینه‌ساز مجاز می‌کند
    // (بردار SSRF/هزینه از طریق /_next/image). محدودسازی به allowlist باید همراه با
    // مهاجرت ImageWithFallback به next/image و ممیزی هاست‌های ذخیره‌شده در DB انجام شود (فاز ۲).
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  // Turbopack: ریشه پروژه = همین پوشه (برای بارگذاری صحیح .env و جلوگیری از استفاده env والد)
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Increase header size limit to handle large cookies
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

const sentryConfig = {
  org: process.env.SENTRY_ORG || 'wibecur',
  project: process.env.SENTRY_PROJECT || 'wibecur',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
};
if (process.env.SENTRY_AUTH_TOKEN) {
  sentryConfig.authToken = process.env.SENTRY_AUTH_TOKEN;
}

module.exports = withSentryConfig(withPWA(nextConfig), sentryConfig);

