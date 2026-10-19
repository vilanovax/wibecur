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
  // ریشهٔ tracing را همین پوشه نگه دار تا فایل‌های جانبی (مثل wibe/ قدیمی) به
  // .next/standalone کشیده نشوند.
  outputFileTracingRoot: path.resolve(__dirname),
  // native module — must not be bundled; lazy-loaded via lib/get-sharp.ts
  serverExternalPackages: ['sharp'],
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
      // HSTS را روی localhost برای LHCI/dev ارسال نکن — Chrome interstitial می‌سازد.
      // در پروداکشن: DISABLE_HSTS را ست نکن (پیش‌فرض فعال).
      ...(process.env.DISABLE_HSTS === 'true'
        ? []
        : [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload',
            },
          ]),
      // CSP پایه و غیرمخرب: این دستورها اسکریپت/استایل را بلاک نمی‌کنند پس اپ نمی‌شکند،
      // ولی clickjacking، تزریق <base>، و embed افزونه (object/embed) را می‌بندند.
      // فاز بعد: افزودن script-src مبتنی بر nonce برای دفاع کامل در برابر XSS.
      {
        key: 'Content-Security-Policy',
        value:
          "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'",
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
    // امنیت: allowlist صریح هاست‌ها به‌جای `hostname: '**'` که پراکسی باز و بردار
    // SSRF/هزینه از طریق /_next/image می‌ساخت. تصاویر ParsPack/Liara از طریق پراکسی
    // same-origin (lib/next-image-src.ts) سرو می‌شوند؛ هاست‌های زیر آن‌هایی هستند که
    // مستقیماً به بهینه‌ساز next/image می‌رسند (پوسترهای TMDB، ویکی‌پدیا و حالت direct ذخیره‌ساز).
    // توجه: قبل از deploy مطمئن شو همهٔ هاست‌های تصویرِ ذخیره‌شده در DB در این فهرست هستند.
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'ia.media-imdb.com' },
      { protocol: 'https', hostname: '**.parspack.net' },
      { protocol: 'https', hostname: 'storage.parspack.com' },
      { protocol: 'https', hostname: '**.liara.space' },
      { protocol: 'https', hostname: 'app.wibe.ir' },
      // توسعهٔ محلی فقط — در production حذف می‌شوند.
      ...(process.env.NODE_ENV === 'development'
        ? [
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'http', hostname: '127.0.0.1' },
          ]
        : []),
    ],
  },
  // Turbopack: ریشه پروژه = همین پوشه (برای بارگذاری صحیح .env و جلوگیری از استفاده env والد)
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Increase header size limit to handle large cookies
  experimental: {
    // Tree-shake barrel packages so mobile shell doesn't pull full icon/motion graphs.
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
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
  // Trim optional Replay capture paths when the integration eventually loads.
  webpack: {
    treeshake: {
      excludeReplayIframe: true,
      excludeReplayShadowDOM: true,
    },
  },
};
if (process.env.SENTRY_AUTH_TOKEN) {
  sentryConfig.authToken = process.env.SENTRY_AUTH_TOKEN;
}

module.exports = withSentryConfig(withPWA(nextConfig), sentryConfig);

