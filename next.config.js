/** @type {import('next').NextConfig} */
let withPWA = (config) => config;

try {
  const pwaConfig = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  });
  withPWA = pwaConfig;
} catch (error) {
  console.warn('next-pwa not found, PWA features disabled');
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
  // Turbopack configuration for Next.js 16
  turbopack: {},
  // Increase header size limit to handle large cookies
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = withPWA(nextConfig);

