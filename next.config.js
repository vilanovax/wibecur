/** @type {import('next').NextConfig} */
const path = require('path');
const { withSentryConfig } = require('@sentry/nextjs');

// next-pwa با Turbopack (پیش‌فرض Next.js 16) سازگار نیست؛ در صورت نیاز به PWA از راهنمای Next.js استفاده کنید.
let withPWA = (config) => config;

try {
  const pwaConfig = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  });
  withPWA = pwaConfig;
} catch {
  // PWA اختیاری؛ manifest و آیکون‌ها از public/ سرو می‌شوند
}

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
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

