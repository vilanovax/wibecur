/** @type {import('next').NextConfig} */
const path = require('path');

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

module.exports = withPWA(nextConfig);

